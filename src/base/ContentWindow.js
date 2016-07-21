/**
 * to show a
 */

(function () {
  'use strict';

  const electron = require('electron');
  const extension = require('../services/extension');
  const EventEmitter = require('events');
  const msgServ = require('./message');
  const IPCMSG = require('../models/qtpmodel').IPCMSG;
  const fs = require('fs');
  //class MyEmitter extends EventEmitter { }  
  //const myEmmiter = new EventEmitter();
  var closeListener = function (realthis) {
    return function (event) {
      if (typeof realthis.config.lastName == 'undefined') {
        fs.unlink('./winconfig/' + realthis.config.curName, function (e) { console.log(e, 'rm file', realthis.config.curName) });
      }
      realthis.win = null;
    }
  }

  function ChartWindow() {
    this.config = {};
    this.win = new electron.BrowserWindow({ autoHideMenuBar: true, skipTaskbar: true, height: 300, width: 500, resizable: false, show: false });
    this.win.loadURL('file://' + __dirname + '/../views/chart.html');
    var realthis = this;
    this.win.on('close', function (event) {
      realthis.win = null;
    });
  }

  ChartWindow.prototype.show = function () {
    if (this.win == null) {
      this.win = new ChartWindow();
    }
    this.win.show();
    return this;
  };

  ChartWindow.prototype.hide = function () {
    if (this.win != null)
      this.win.hide();
  };

  ChartWindow.prototype.getConfig = function () {
    if (this.win == null)
      return;

    var bounds = this.win.getBounds();
    this.config.bounds = bounds;

    return this.config;
  }

  function TableWindow() {
    this.config = {};
    this.win = new electron.BrowserWindow({ autoHideMenuBar: true, skipTaskbar: false, height: 300, width: 500, resizable: true, show: false });
    this.win.loadURL('file://' + __dirname + '/../views/alert.html');
    var realthis = this;

    this.win.on('close', new closeListener(realthis));

    this.win.webContents.on('did-finish-load', function () {

      realthis.win.webContents.send('config'
        , realthis.config);

      delete realthis.config.lastName;

      realthis.win.webContents.send('backend_change'
        , {
          bEnable: global.Configuration.enableFavourites,
          codes: global.UserStock
        });
    });

    electron.ipcMain.on('userstock_change', function (e, arg) {
      //console.log("toggle favourites feature. current is %s", arg);
      global.Configuration.enableFavourites = arg;
      if (realthis.win == null) {
        return;
      }
      realthis.win.webContents.send('backend_change'
        , {
          bEnable: global.Configuration.enableFavourites,
          codes: global.UserStock
        });
      //myEmmiter.emit('favour-toggle');
    });

    if (global.Configuration.environment === 'development') {
      this.win.openDevTools();
    }
  }

  TableWindow.prototype.show = function (config) {

    this.config = config;
    this.win.show();

    if (typeof config.bounds != 'undefined') {
      this.win.setBounds(config.bounds);
    }

    if (global.Configuration.windowSetting) {
      if (global.Configuration.windowSetting.alwaysOnTop) {
        this.win.setAlwaysOnTop(true);
      }
    }
    return this;
  };

  TableWindow.prototype.getConfig = function () {
    if (this.win == null)
      return null;
    var bounds = this.win.getBounds();
    this.config.bounds = bounds;
    this.config.lastName = this.config.curName;
    return this.config;
  }

  function UserStockWind() {
    this.config = {};
    this.isClosed = false;
    this.win = new electron.BrowserWindow({ autoHideMenuBar: true, skipTaskbar: true, height: 300, width: 500, resizable: true, show: false });
    this.win.loadURL('file://' + __dirname + '/../views/userstock.html');
    var realthis = this;

    this.win.on('close', function (event) {
      // if (typeof realthis.config.lastName == 'undefined') {
      //   fs.unlink('./winconfig/' + realthis.config.curName, function (e) { console.log(e, 'rm file', realthis.config.curName) });
      // }
      //close;
      realthis.isClosed = true;
    });

    this.win.webContents.on('did-finish-load', function () {
      // realthis.win.webContents.send('config'
      //   , realthis.config);

      // delete realthis.config.lastName;

      realthis.win.webContents.send('backend_change', {
        bEnable: global.Configuration.enableFavourites,
        codeDetail: global.UserStock.detail
      });
    });
  }

  UserStockWind.prototype.show = function (config) {
    if (this.isClosed) {
      this.config = {};
      this.win = new electron.BrowserWindow({ autoHideMenuBar: true, skipTaskbar: true, height: 300, width: 500, resizable: true, show: false });
      this.win.loadURL('file://' + __dirname + '/../views/userstock.html');
      var realthis = this;

      this.win.on('close', function (event) {
        // if (typeof realthis.config.lastName == 'undefined') {
        //   fs.unlink('./winconfig/' + realthis.config.curName, function (e) { console.log(e, 'rm file', realthis.config.curName) });
        // }
        realthis.isClosed = true;
      });


      this.win.webContents.on('did-finish-load', function () {
        // realthis.win.webContents.send('config'
        //   , realthis.config);

        // delete realthis.config.lastName;

        realthis.win.webContents.send('backend_change', {
          bEnable: global.Configuration.enableFavourites,
          codeDetail: global.UserStock.detail
        });
      });

    }
    this.config = config;
    this.win.show();
    this.isClosed = false;

    if (typeof config.bounds != 'undefined') {
      this.win.setBounds(config.bounds);
    }

    return this;
    //this.win.openDevTools();
  };

  UserStockWind.prototype.hide = function () {
    if (!this.isClosed) {
      this.win.hide();
    }
  };

  UserStockWind.prototype.getConfig = function () {
    if (this.win == null || this.isClosed)
      return null;

    var bounds = this.win.getBounds();
    this.config.bounds = bounds;
    this.config.lastName = this.config.curName;
    return this.config;
  }

  function ToplistWind() {
    this.config = {};
    this.win = new electron.BrowserWindow({ autoHideMenuBar: true, skipTaskbar: false, height: 300, width: 500, resizable: true, show: false });
    this.win.loadURL('file://' + __dirname + '/../views/toplist.html');
    var realthis = this;
    this.win.on('close', new closeListener(realthis));

    this.win.webContents.on('did-finish-load', function () {
      // TODO
      //msgServ.requestMsg()
    });

    if (global.Configuration.environment === 'development') {
      this.win.openDevTools();
    }
  }

  ToplistWind.prototype.show = function (config) {
    this.win.show();

    if (typeof config.bounds != 'undefined') {
      this.win.setBounds(config.bounds);
    }
    return this;
  };

  ToplistWind.prototype.getConfig = function () {
    if (this.win == null)
      return null;

    var bounds = this.win.getBounds();
    this.config.bounds = bounds;

    return this.config;
  }

  extension.registerWindow('UserStockWind', function () { return new UserStockWind() }, [], '自选股', true);
  extension.registerWindow('TableWindow', function () { return new TableWindow() }, [0], '新建', false);
  extension.registerWindow('Toplist', function () { return new ToplistWind() }, [1], '新建', false);
}).call(this);

