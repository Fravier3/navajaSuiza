"""Install untouched, checksum-pinned official browser distributions."""
import concurrent.futures
import hashlib
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
    if stamp.exists() and json.loads(stamp.read_text()).get('sha256') == actual:
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
    stamp.write_text(json.dumps(app, indent=2) + '\n')
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
