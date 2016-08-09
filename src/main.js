'use strict';


if (require('electron-squirrel-startup')) return;

// Module to control application life.
const electron = require('electron');
const app = electron.app;

if (handleSquirrelEvent()) {
  // squirrel event handled and app will exit in 1000ms, so don't do anything else
  return;
}

function handleSquirrelEvent() {
  if (process.argv.length === 1) {
    return false;
  }

  const ChildProcess = require('child_process');
  const path = require('path');

  const appFolder = path.resolve(process.execPath, '..');
  const rootAtomFolder = path.resolve(appFolder, '..');
  const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'));
  const exeName = path.basename(process.execPath);

  const spawn = function(command, args) {
    let spawnedProcess, error;

    try {
      spawnedProcess = ChildProcess.spawn(command, args, {detached: true});
    } catch (error) {}

    return spawnedProcess;
  };

  const spawnUpdate = function(args) {
    return spawn(updateDotExe, args);
  };

  const squirrelEvent = process.argv[1];
  switch (squirrelEvent) {
    case '--squirrel-install':
    case '--squirrel-updated':
      // Optionally do things such as:
      // - Add your .exe to the PATH
      // - Write to the registry for things like file associations and
      //   explorer context menus

      // Install desktop and start menu shortcuts
      spawnUpdate(['--createShortcut', exeName]);

      setTimeout(app.quit, 1000);
      return true;

    case '--squirrel-uninstall':
      // Undo anything you did in the --squirrel-install and
      // --squirrel-updated handlers

      // Remove desktop and start menu shortcuts
      spawnUpdate(['--removeShortcut', exeName]);

      setTimeout(app.quit, 1000);
      return true;

    case '--squirrel-obsolete':
      // This is called on the outgoing version of your app before
      // we update to the new version - it's the opposite of
      // --squirrel-updated

      app.quit();
      return true;
  }
};

const AIApplication = require('./AIApplication');
var application = null;
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function () {
  application = new AIApplication();
  application.Start();
  console.log(process.versions['chrome']);
});

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (application === null) {
    application = new AIApplication();
  }
});

app.on('open-url', function (url, bShow) {
  if (application != null) {
    application.SetWindow(url);
  }
});

app.on('disconnected', function () {
  electron.dialog.showMessageBox({ type: "warning", buttons: ["重新连接", "忽略"], title: "连接断开", message: "与服务器的连接已断开！" }, function (res) {
    if (res == 0) {
      app.emit('reconnect');
    } else {
      app.emit('heartbeat', global.Configuration.hearbeatInterval);
    }
  });
})

app.on('before-quit', function () {
  application.SaveWindows();
});