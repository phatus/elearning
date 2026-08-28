const fs = require('fs');
const path = require('path');
const child_process = require('child_process');

const origDlopen = process.dlopen;
const tmpDir = path.join('/tmp', 'node-addons');
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}

function getTmpExecutable(filename) {
  if (typeof filename === 'string' && filename.startsWith('/run/media/')) {
    const base = path.basename(filename);
    const dest = path.join(tmpDir, base);
    try {
      if (!fs.existsSync(dest)) {
        fs.copyFileSync(filename, dest);
        fs.chmodSync(dest, 0o755);
      }
      return dest;
    } catch (e) {
      console.error('Failed to copy binary:', e);
    }
  }
  return filename;
}

process.dlopen = function(module, filename, flags) {
  const targetPath = getTmpExecutable(filename);
  if (flags !== undefined) {
    return origDlopen.call(this, module, targetPath, flags);
  } else {
    return origDlopen.call(this, module, targetPath);
  }
};

const origSpawn = child_process.spawn;
child_process.spawn = function(command, args, options) {
  const newCommand = getTmpExecutable(command);
  return origSpawn.call(this, newCommand, args, options);
};

const origSpawnSync = child_process.spawnSync;
child_process.spawnSync = function(command, args, options) {
  const newCommand = getTmpExecutable(command);
  return origSpawnSync.call(this, newCommand, args, options);
};
