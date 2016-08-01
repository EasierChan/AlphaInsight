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
  function closeListener(realthis, sign) {
    return function (event) {
      if (typeof realthis.config.lastName == 'undefined') {
        fs.unlink('./winconfig/' + realthis.config.curName, function (e) { /*console.log(e, 'rm file', realthis.config.curName)*/ });
      }
      removeUserStockListener(realthis);
      realthis.win = null;

      if (sign && sign == 'alert') {
        if (1 > --global.Subscriber.alerts) {
          msgServ.CancelSub(0);
        }
      }
    }
  }

  function registerWindowTopListener(winref) {
    electron.ipcMain.on('set-window-top' + winref.win.id, function (e, arg) {
      winref.win.setAlwaysOnTop(arg);
    });
  }

  var userStockListener = [];
  function registerUserStockListener(winref) {
    userStockListener.push(winref);
  }
  function removeUserStockListener(winref) {
    for(var i = 0; i< userStockListener.length; ++i){
      if(winref === userStockListener[i]){
        userStockListener.splice(i,1);
        break;
      }
    }
  }

  electron.ipcMain.on('userstock_change', function (e, arg) {
    global.Configuration.enableFavourites = arg;

    userStockListener.forEach(function (winref) {
      winref.win.webContents.send('backend_change'
        , {
          bEnable: global.Configuration.enableFavourites,
          codes: global.UserStock
        }
      )
    });
  });



  function TableWindow() {
    this.config = {};
    this.win = new electron.BrowserWindow({ autoHideMenuBar: true, skipTaskbar: false, height: 500, width: 500, resizable: true, show: false });
    this.win.loadURL('file://' + __dirname + '/../views/alert.html');
    var realthis = this;

    registerWindowTopListener(realthis);

    this.win.on('close', closeListener(realthis, 'alert'));

    this.win.webContents.on('did-finish-load', function () {
      realthis.win.webContents.send('config'
        , realthis.config);
      delete realthis.config.lastName;

      realthis.win.webContents.send('backend_change'
        , {
          bEnable: global.Configuration.enableFavourites,
          codes: global.UserStock,
          winID: realthis.win.id
        });
    });

    registerUserStockListener(realthis);

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
      realthis.isClosed = true;
      realthis.win = null;
    });

    this.win.webContents.on('did-finish-load', function () {
      realthis.win.webContents.send('backend_change', {
        bEnable: global.Configuration.enableFavourites,
        codeDetail: global.UserStock.detail
      });
    });


    this.win.webContents.on('filter-toggle', function (e, arg) {
      global.Configuration.enableFavourites = arg;
    });
  }

  // used to the code name with codeid
  electron.ipcMain.on('get-code-name', function (event, arg) {
    var index = 0;
    for (; index < global.codeTable.length; ++index) {
      if (global.codeTable[index].code == arg) {
        break;
      }
    }

    if (index < global.codeTable.length)
      event.returnValue = global.codeTable[index].name;
    else
      event.returnValue = -1;
  });

  UserStockWind.prototype.show = function (config) {
    if (this.isClosed) {
      this.config = {};
      this.win = new electron.BrowserWindow({ autoHideMenuBar: true, skipTaskbar: true, height: 300, width: 500, resizable: true, show: false });
      this.win.loadURL('file://' + __dirname + '/../views/userstock.html');
      var realthis = this;

      this.win.on('close', function (event) {
        realthis.isClosed = true;
        realthis.win = null;
      });

      this.win.webContents.on('did-finish-load', function () {
        console.log(global.Configuration.enableFavourites);
        realthis.win.webContents.send('backend_change', {
          bEnable: global.Configuration.enableFavourites,
          codeDetail: global.UserStock.detail
        });
      });

      this.win.webContents.on('filter-toggle', function (e, arg) {
        global.Configuration.enableFavourites = arg;
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

    registerWindowTopListener(realthis);

    this.win.on('close', closeListener(realthis));

    this.win.webContents.on('did-finish-load', function () {
      // TODO
      realthis.win.webContents.send('config'
        , { cfg: realthis.config, winID: realthis.win.id });

      delete realthis.config.lastName;
    });

    if (global.Configuration.environment === 'development') {
      this.win.openDevTools();
    }
  }

  ToplistWind.prototype.show = function (config) {
    this.config = config;
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
    this.config.lastName = this.config.curName;
    return this.config;
  }

  extension.registerWindow('UserStockWind', function () { return new UserStockWind() }, [], '自选股', true);
  extension.registerWindow('TableWindow', function () { return new TableWindow() }, [0], '新建', false);
  extension.registerWindow('Toplist', function () { return new ToplistWind() }, [1], '新建', false);
}).call(this);

