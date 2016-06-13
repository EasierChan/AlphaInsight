'use strict';

// Module to control application life.
const electron = require('electron');

const app = electron.app; 

const rootpath = __dirname + '/src';

const AIApplication = require(rootpath + '/AIApplication');


let application = null;
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function(){
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

app.on('open-url', (url, bShow) => {
  if(application){
    application.SetWindow(url, bShow);
  }
});