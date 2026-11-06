"""Install untouched, checksum-pinned official browser distributions."""
import concurrent.futures
import hashlib
import gzip
import re
import json
import os
from pathlib import Path
import shutil
import time
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / '.cache' / 'releases'
OUT = ROOT / 'public' / 'tools'
LAYOUT = 2


def download(url, destination):
    for attempt in range(3):
        try:
            request = urllib.request.Request(url, headers={'User-Agent': 'NavajaSuiza-build'})
            with urllib.request.urlopen(request, timeout=120) as source, destination.open('wb') as target:
                shutil.copyfileobj(source, target)
            return
        except Exception:
            if attempt == 2:
                raise
            time.sleep(attempt + 1)


def prepare_browser_entry(destination, app_id):
    """Unpack split gzip at build time: Pages can serve the actual wasm directly.

    Avoid the upstream streaming bootstrap, which can stall without reporting an
    error. Keep the original application JS/wasm and licenses unmodified.
    """
    parts = destination / 'app' / 'parts.txt'
    if not parts.exists():
        return
    lines = [line.strip() for line in parts.read_text().splitlines() if line.strip()]
    if lines[0] != f'{app_id}-parts 1':
        raise RuntimeError(f'Unknown parts format: {app_id}')
    names = lines[1:]
    if not names or any(not re.fullmatch(r'[A-Za-z0-9_-]+\.part-[a-z]+', name) for name in names):
        raise RuntimeError(f'Unsafe or empty parts list: {app_id}')
    packed = b''.join((parts.parent / name).read_bytes() for name in names)
    wasm = gzip.decompress(packed) if packed.startswith(b'\x1f\x8b') else packed
    if not wasm.startswith(b'\0asm\x01\0\0\0'):
        raise RuntimeError(f'Invalid unpacked WebAssembly: {app_id}')
    wasm_name = f'{app_id}-web_bg.wasm'
    (parts.parent / wasm_name).write_bytes(wasm)
    loader = parts.parent / f'{app_id}-web.js'
    if not loader.exists():
        raise RuntimeError(f'Missing application loader: {app_id}')
    entry = destination / 'index.html'
    html = entry.read_text()
    script = f"""<script type="module">
import init from './app/{app_id}-web.js';
try {{
  await init({{ module_or_path: new URL('./app/{wasm_name}', import.meta.url) }});
}} catch (error) {{
  console.error('Editor startup failed', error);
  const loading = document.getElementById('{app_id}_loading');
  if (loading) loading.textContent = 'No se pudo iniciar el editor: ' + String(error);
  parent.postMessage({{ type: '{app_id}:failed', error: String(error) }}, location.origin);
}}
</script>"""
    html, count = re.subn(r'<script type="module">.*?</script>', lambda _: script, html, count=1, flags=re.S)
    if count != 1:
        raise RuntimeError(f'Missing bootstrap script: {app_id}')
    html = re.sub(r'<link rel="(?:modulepreload|preload)"[^>]*>', '', html)
    entry.write_text(html)
    # The boot loader and compressed copies are no longer used by the page.
    for name in names:
        (parts.parent / name).unlink()


def install(app):
    archive = CACHE / app['asset']
    if not archive.exists():
        download(app['url'], archive)
    actual = hashlib.file_digest(archive.open('rb'), 'sha256').hexdigest()
    if actual != app['sha256']:
        archive.unlink()
        raise RuntimeError(f"Checksum mismatch: {app['id']}")
    destination = OUT / app['id']
    stamp = destination / 'distribution.json'
    if stamp.exists() and json.loads(stamp.read_text()).get('sha256') == actual and json.loads(stamp.read_text()).get('layout') == LAYOUT:
        return app['id'], sum(p.stat().st_size for p in destination.rglob('*') if p.is_file())
    if destination.exists():
        shutil.rmtree(destination)
    destination.mkdir(parents=True)
    with zipfile.ZipFile(archive) as bundle:
        entries = [item for item in bundle.infolist() if not item.is_dir()]
        roots = [Path(item.filename) for item in entries if Path(item.filename).name == 'index.html']
        if len(roots) != 1:
            raise RuntimeError(f"Expected one browser entry: {app['id']}")
        prefix = roots[0].parent
        for entry in entries:
            relative = Path(entry.filename).relative_to(prefix)
            if relative.is_absolute() or '..' in relative.parts:
                raise RuntimeError('Unsafe archive path')
            if relative.suffix == '.map' or relative.name in {'_headers', '.htaccess', 'HOSTING.md', 'README.md'}:
                continue
            target = destination / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            with bundle.open(entry) as source, target.open('wb') as output:
                shutil.copyfileobj(source, output)
    prepare_browser_entry(destination, app['id'])
    stamp.write_text(json.dumps({**app, 'layout': LAYOUT}, indent=2) + '\n')
    return app['id'], sum(p.stat().st_size for p in destination.rglob('*') if p.is_file())


def main():
    CACHE.mkdir(parents=True, exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)
    apps = json.loads((ROOT / 'apps.lock.json').read_text())
    total = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
        futures = [pool.submit(install, app) for app in apps]
        for future in concurrent.futures.as_completed(futures):
            name, size = future.result()
            total += size
            print(f'{name}: verified, {size / 1_000_000:.1f} MB', flush=True)
    print(f'Total: {total / 1_000_000:.1f} MB', flush=True)
    if total > 950_000_000:
        raise RuntimeError('Distributions exceed the safe Pages budget')


if __name__ == '__main__':
    main()

