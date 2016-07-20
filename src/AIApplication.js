'use strict';
// Module to create native browser window.
//const {BrowserWindow, Menu, MenuItem} = require('electron');
const MenuClass = require('./base/MenuWindow');
require('./base/ContentWindow');
const messageSvr = require('./base/message');
const utility = require('./services/utility');
const electron = require('electron');
const PreferenceWindow = require('./base/internalwindow').PreferenceWindow;

const fs = require('fs');
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
  this.loadlastWins();
}

AIApplication.prototype.AddWindow = function (id, wind) {
  this.windows[id] = wind;
}

AIApplication.prototype.SetWindow = function (windId, config) {
  if (!this.windows.hasOwnProperty(windId)) {
    electron.dialog.showMessageBox(null, { type: 'error', title: 'Error', message: 'Unregistered Window!', buttons: ['OK'] });
    return;
  }

  if (typeof this.windows[windId].apps == 'undefined') {
    this.windows[windId].apps = [];
  }

  if (typeof (this.windows[windId]) == 'object') {
    var wind = this.windows[windId].show();
    if (typeof config != 'undefined') {
      wind.win.setBounds(config.bounds);
    }

    this.windows[windId].apps.push(wind);
  } else if (typeof (this.windows[windId]) == 'function') {
    var fwind = (this.windows[windId])().show();
    if (typeof config != 'undefined') {
      fwind.win.setBounds(config.bounds);
    }
    this.windows[windId].apps.push(fwind);
  } else {
    console.error('illegal registered Window!');
  }
};

AIApplication.prototype.SaveWindows = function () {
  var winsConfig = {};
  for (var windId in this.windows) {

    if (typeof this.windows[windId].apps == 'undefined')
      continue;

    winsConfig[windId] = [];

    for (var i = 0; i < this.windows[windId].apps.length; ++i) {

      var config = this.windows[windId].apps[i].getConfig();
      if (config == null)
        continue;

      winsConfig[windId].push(config);
    }
  }

  fs.writeFileSync("./wins.json", JSON.stringify(winsConfig));
}

AIApplication.prototype.loadlastWins = function () {

  try {

    if (!fs.statSync('./wins.json').isFile())
      return;

    var wins = require('../wins.json');

    for (var windId in wins) {
      for (var i = 0; i < wins[windId].length; ++i) {
        this.SetWindow(windId, wins[windId][i]);
      }
    }

  } catch (e) {
    console.log(e);
  }
}

module.exports = AIApplication;