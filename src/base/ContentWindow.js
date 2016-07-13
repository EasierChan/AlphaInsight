/**
 * to show a 
 */

(function () {
  'use strict';

  const electron = require('electron');
  const extension = require('../services/extension');
  const EventEmitter = require('events');
  const msgServ = require('./message');
  //class MyEmitter extends EventEmitter { }

  //const myEmmiter = new EventEmitter();

  function ChartWindow() {
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
  };

  ChartWindow.prototype.hide = function () {
    if (this.win != null)
      this.win.hide();
  };

  function TableWindow() {
    this.win = new electron.BrowserWindow({ autoHideMenuBar: true, skipTaskbar: false, height: 300, width: 500, resizable: true, show: false });
    this.win.loadURL('file://' + __dirname + '/../views/alert.html');
    var realthis = this;
    this.win.on('close', function (event) {
      realthis.win = null;
    });

    this.win.webContents.on('did-finish-load', function () {
      realthis.win.webContents.send('backend_change'
        , {
          bEnable: global.Configuration.enableFavourites,
          codes: global.UserStockCode
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
          codes: global.UserStockCode
        });
      //myEmmiter.emit('favour-toggle');
    });

    if (global.Configuration.environment === 'development') {
      this.win.openDevTools();
    }
  }

  TableWindow.prototype.show = function () {
    this.win.show();
  };

  function UserStockWind() {
    this.isClosed = false;
    this.win = new electron.BrowserWindow({ autoHideMenuBar: true, skipTaskbar: true, height: 300, width: 500, resizable: true, show: false });
    this.win.loadURL('file://' + __dirname + '/../views/userstock.html');
    var realthis = this;

    this.win.on('close', function (event) {
      //close;
      realthis.isClosed = true;
    });

    this.win.webContents.on('did-finish-load', function () {
      realthis.win.webContents.send('backend_change', global.Configuration.enableFavourites);
    });
  }

  UserStockWind.prototype.show = function () {
    if (this.isClosed) {
      this.win = new electron.BrowserWindow({ autoHideMenuBar: true, skipTaskbar: true, height: 300, width: 500, resizable: true, show: false });
      this.win.loadURL('file://' + __dirname + '/../views/userstock.html');
      var realthis = this;

      this.win.on('close', function (event) {
        //close;
        realthis.isClosed = true;
      });


      this.win.webContents.on('did-finish-load', function () {
        realthis.win.webContents.send('backend_change', global.Configuration.enableFavourites);
      });
    }
    this.win.show();
    this.isClosed = false;
    //this.win.openDevTools();
  };

  UserStockWind.prototype.hide = function () {
    if (!this.isClosed) {
      this.win.hide();
    }
  };

  function ToplistWind() {
    this.win = new electron.BrowserWindow({ autoHideMenuBar: true, skipTaskbar: false, height: 300, width: 500, resizable: true, show: false });
    this.win.loadURL('file://' + __dirname + '/../views/toplist.html');
    var realthis = this;
    this.win.on('close', function (event) {
      realthis.win = null;
    });

    this.win.webContents.on('did-finish-load', function () {
      // TODO
      //msgServ.requestMsg()
    });

    if (global.Configuration.environment === 'development') {
      this.win.openDevTools();
    }
  }

  ToplistWind.prototype.show = function () {
    this.win.show();
  };

  extension.registerWindow('UserStockWind', function () { return new UserStockWind() }, [], '自选股', true);
  extension.registerWindow('TableWindow', function () { return new TableWindow() }, [0], '新建', false);
  extension.registerWindow('Toplist', function () { return new ToplistWind() }, [1], '新建', false);
}).call(this);

