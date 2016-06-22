'use strict';
// Module to create native browser window.
//const {BrowserWindow, Menu, MenuItem} = require('electron');
const MenuClass = require('./base/MenuWindow');
require('./base/ContentWindow');
const utility = require('./services/utility');
const electron = require('electron');
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.

function AIApplication() {
  this.windows = new Object();
  //this.windows['ChartWindow'] = new ChartWindow();
  //this.windows['TableWindow'] = new TableWindow();
}

AIApplication.prototype.Start = function () {
  utility.loadExtension(this.windows);
  this.mainWindow = new MenuClass.MenuWindow();
  this.windows['main'] = this.mainWindow;
  this.mainWindow.show();
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

module.exports = AIApplication;