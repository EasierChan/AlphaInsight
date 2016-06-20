'use strict';

global.rootdir = __dirname;
// Module to create native browser window.
//const {BrowserWindow, Menu, MenuItem} = require('electron');
const {MenuWindow} = require('./base/MenuWindow');
const {ChartWindow, TableWindow} = require('./base/ContentWindow');
const utility = require('./services/utility');
const {app, dialog} = require('electron');
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.

function AIApplication() {
  this.windows = new Object();
  //this.windows['ChartWindow'] = new ChartWindow();
  //this.windows['TableWindow'] = new TableWindow();
}

AIApplication.prototype.Start = function () {
  utility.loadExtension(this.windows);
  this.mainWindow = new MenuWindow();
  this.windows['main'] = this.mainWindow;
  this.mainWindow.show();
}

AIApplication.prototype.AddWindow = function (id, wind) {
  this.windows[id] = wind;
}

AIApplication.prototype.SetWindow = function (windId) {
  if (!this.windows.hasOwnProperty(windId)) {
    dialog.showMessageBox(null, { type: 'error', title: 'Error', message: 'Unregistered Window!', buttons: ['OK'] });
    return;
  }
  
  if (typeof (this.windows[windId]) == 'object') {
    this.windows[windId].show();
  } else if(typeof(this.windows[windId]) == 'function'){
    (this.windows[windId])().show();
  } else {
    console.error('illegal registered Window!');
  }
};

module.exports = AIApplication;