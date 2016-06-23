/**
 * to show a 
 */

(function () {
  'use strict';

  const electron = require('electron');
  const extension = require('../services/extension');

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
    this.win = new electron.BrowserWindow({ autoHideMenuBar: true, skipTaskbar: true, height: 300, width: 500, resizable: true, show: false });
    this.win.loadURL('file://' + __dirname + '/../views/toplist.html');
    var realthis = this;
    this.win.on('close', function (event) {
      realthis.win = null;
    });
    //this.win.openDevTools();
  }

  TableWindow.prototype.show = function () {
    this.win.show();
  };
  TableWindow.prototype.hide = function () {
    if (this.win != null)
      this.win.hide();
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

    this.win.openDevTools();
  }

  UserStockWind.prototype.show = function () {
    if (this.isClosed) {
      this.win = new electron.BrowserWindow({ autoHideMenuBar: true, skipTaskbar: true, height: 300, width: 500, resizable: true, show: false });
      this.win.loadURL('file://' + __dirname + '/../views/userstock.html');
      this.win.on('close', function (event) {
        //close;
        this.isClosed = true;
      });
      //this.win.openDevTools();
    }
    this.win.show();
    this.isClosed = false;
  };

  UserStockWind.prototype.hide = function () {
    if (!this.isClosed)
      this.win.hide();
  };

  extension.registerWindow('UserStockWind', function () { return new UserStockWind() }, [], 'Favourites', true);
  extension.registerWindow('TableWindow', function () { return new TableWindow() }, [0], 'Alerts', false);
}).call(this);

