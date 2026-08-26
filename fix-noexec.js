const fs = require('fs');
const path = require('path');

const origDlopen = process.dlopen;
const tmpDir = path.join('/tmp', 'node-addons');
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}

process.dlopen = function(module, filename, flags) {
  let targetPath = filename;
  if (typeof filename === 'string' && filename.startsWith('/run/media/')) {
    const base = path.basename(filename);
    const dest = path.join(tmpDir, base);
    try {
      if (!fs.existsSync(dest)) {
        fs.copyFileSync(filename, dest);
        fs.chmodSync(dest, 0o755);
      }
      targetPath = dest;
    } catch (e) {
      console.error('Failed to copy native addon:', e);
    }
  }
  if (flags !== undefined) {
    return origDlopen.call(this, module, targetPath, flags);
  } else {
    return origDlopen.call(this, module, targetPath);
  }
};
