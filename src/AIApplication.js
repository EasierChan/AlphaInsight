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

  if (typeof config == 'undefined') {
    config = {};
  }

  config.curName = windId + this.windows[windId].apps.length + '.json';

  if (typeof (this.windows[windId]) == 'object') {
    this.windows[windId].apps.push(this.windows[windId].show(config));
  } else if (typeof (this.windows[windId]) == 'function') {
    var fwind = (this.windows[windId])().show(config);
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
      if (this.windows[windId].apps[i] == null)
        continue;

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

    var intervals = 300;
    
    var rthis = this;
    function tmCreatWind(windId, wIndex) {
      if (wIndex < wins[windId].length) {
        rthis.SetWindow(windId, wins[windId][wIndex]);
        wIndex++;
        setTimeout(function(){tmCreatWind(windId, wIndex);}, intervals);
      }
    }

    for (var windId in wins) {
      tmCreatWind(windId, 0);
    }



  } catch (e) {
    console.log(e);
  }
}

module.exports = AIApplication;