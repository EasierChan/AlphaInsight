'use strict';
// Module to create native browser window.
//const {BrowserWindow, Menu, MenuItem} = require('electron');
const MenuClass = require('./base/MenuWindow');
require('./base/ContentWindow');
const messageSvr = require('./base/message');
const utility = require('./services/utility');
const electron = require('electron');
const PreferenceWindow = require('./base/internalwindow').PreferenceWindow;


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.

function AIApplication() {
  this.windows = new Object();
  //this.windows['ChartWindow'] = new ChartWindow();
  //this.windows['TableWindow'] = new TableWindow();
}

AIApplication.prototype.Start = function () {
  utility.loadConfig();
  utility.loadExtension(this.windows);
  messageSvr.Start();
  this.mainWindow = new MenuClass.MenuWindow();
  this.windows['main'] = this.mainWindow;
  this.windows['preference'] = new PreferenceWindow();
  this.mainWindow.show();
  //setTimeout(function () {utility.loadlastWins()}, 5*500);
}

AIApplication.prototype.AddWindow = function (id, wind) {
  this.windows[id] = wind;
}

AIApplication.prototype.SetWindow = function (windId) {
  if (!this.windows.hasOwnProperty(windId)) {
    electron.dialog.showMessageBox(null, { type: 'error', title: 'Error', message: 'Unregistered Window!', buttons: ['OK'] });
    return;
  }

  if (typeof (this.windows[windId]) == 'object') {
    this.windows[windId].show();
  } else if (typeof (this.windows[windId]) == 'function') {
    (this.windows[windId])().show();
  } else {
    console.error('illegal registered Window!');
  }
};

AIApplication.prototype.SaveWindows = function () {
  console.log(this.mainWindow);  
}

module.exports = AIApplication;