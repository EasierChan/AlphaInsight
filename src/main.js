'use strict';

require('./services/updater');
// Module to control application life.
const electron = require('electron');
const app = electron.app;

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