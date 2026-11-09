const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const EXPECTED = 'b08853dc6e38bc3626e1c1cd407ffa842143a5b0554742e7a10ad819b70f8906';
const digest = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

function prepareExecutable(bundled, folder, expected = EXPECTED) {
  if (digest(bundled) !== expected) throw new Error('El motor no pasó la verificación. Reinstala Arsenal.');
  fs.mkdirSync(folder, {recursive:true});
  const executable = path.join(folder, 'OmniGet.exe');
  // Windows locks running executables. Reuse the verified installed copy even
  // when it belongs to a native window left open by a previous Arsenal session.
  let installed;
  try { installed = digest(executable); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (installed !== expected) {
    try { fs.copyFileSync(bundled, executable); }
    catch (error) {
      if (['EBUSY','EPERM','EACCES'].includes(error.code)) {
        throw new Error('Cierra OmniGet desde su propia ventana y vuelve a intentarlo para actualizar el motor. Tus datos se conservan.');
      }
      throw error;
    }
  }
  // Preserve the portable profile and avoid rewriting an existing marker.
  try { fs.writeFileSync(path.join(folder, 'portable.txt'), '', {flag:'wx'}); }
  catch (error) { if (error.code !== 'EEXIST') throw error; }
  return executable;
}

function createOmnigetLauncher({bundled, folder, spawn, expected = EXPECTED}) {
  let child;
  let pending;
  return function open() {
    if (pending) return pending;
    if (child && child.exitCode === null && child.signalCode === null) return Promise.resolve();
    // Share the complete launch, including preparation, between concurrent IPCs.
    pending = Promise.resolve().then(async () => {
      const executable = prepareExecutable(bundled, folder, expected);
      const candidate = spawn(executable, [], {cwd:folder, detached:true, stdio:'ignore', shell:false});
      await new Promise((resolve, reject) => {
        candidate.once('spawn', resolve);
        candidate.once('error', reject);
      });
      child = candidate;
      candidate.unref();
    }).finally(() => { pending = undefined; });
    return pending;
  };
}

module.exports = {prepareExecutable, createOmnigetLauncher};
