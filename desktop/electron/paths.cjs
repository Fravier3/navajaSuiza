const path = require('node:path');
function resolveAsset(rawUrl, shellRoot, toolsRoot) {
  const url = new URL(rawUrl);
  if (url.protocol !== 'omnidesk:' || url.hostname !== 'app') throw new Error('Invalid origin');
  const decoded = decodeURIComponent(url.pathname);
  if (decoded.includes('\\') || decoded.includes('\0') || decoded.split('/').includes('..')) throw new Error('Invalid path');
  const tool = decoded.startsWith('/tools/');
  const root = path.resolve(tool ? toolsRoot : shellRoot);
  const relative = tool ? decoded.slice(7) : decoded.slice(1) || 'index.html';
  const target = path.resolve(root, relative);
  if (!target.startsWith(root + path.sep)) throw new Error('Path outside application');
  return target;
}
module.exports = { resolveAsset };
