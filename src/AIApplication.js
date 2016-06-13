'use strict';

global.rootdir = __dirname;
// Module to create native browser window.
//const {BrowserWindow, Menu, MenuItem} = require('electron');
const MenuWindow = require('./base/MenuWindow');
const {ChartWindow,TableWindow} = require('./base/ContentWindow');
const {app, dialog} = require('electron');
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.


function AIApplication() {
  this.mainWindow = new MenuWindow(this);
  this.windows = new Object();
  this.windows['main'] = this.mainWindow;
  this.windows['ChartWindow'] = new ChartWindow(this);
  this.windows['TableWindow'] = new TableWindow(this);
}

AIApplication.prototype.Start = function () {
  this.mainWindow.show();
  //for(var key in this.windows){
    //this.windows[key].show();
  //}
 
}

AIApplication.prototype.AddWindow = function (id, wind) {
  this.windows[id] = wind;
}

AIApplication.prototype.SetWindow = function (windId, bshow) {
  if(!this.windows.hasOwnProperty(windId)){
    dialog.showMessageBox(null, {type: 'error', title: 'Error', message: 'Unregistered Window!', buttons: ['OK']});
    return;
  }
  
  if(bshow)
   this.windows[windId].show();
  else
   this.windows[windId].hide();
};

module.exports = AIApplication;