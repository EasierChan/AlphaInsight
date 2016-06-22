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
    this.show = function () {
      if (this.win == null) {
        this.win = new ChartWindow();
      }

      this.win.show();
    };

    this.hide = function () {
      if (this.win != null)
        this.win.hide();
    };

    this.win.on('close', function (event) {
      this.win = null;
    });
    //this.win.openDevTools();
  }

  function TableWindow() {
    this.win = new electron.BrowserWindow({ autoHideMenuBar: true, skipTaskbar: true, height: 300, width: 500, resizable: true, show: false });
    this.win.loadURL('file://' + __dirname + '/../views/toplist.html');
    this.show = () => {
      this.win.show();
    };

    this.hide = () => {
      if (this.win != null)
        this.win.hide();
    };

    this.win.on('close', function (event) {
      this.win = null;
    });
    this.win.openDevTools();
  }

  function UserStockWind() {
    var isClosed = false;
    this.win = new electron.BrowserWindow({ autoHideMenuBar: true, skipTaskbar: true, height: 300, width: 500, resizable: true, show: false });
    this.win.loadURL('file://' + __dirname + '/../views/userstock.html');
    this.show = () => {
      if (isClosed) {
        this.win = new electron.BrowserWindow({ autoHideMenuBar: true, skipTaskbar: true, height: 300, width: 500, resizable: true, show: false });
        this.win.loadURL('file://' + __dirname + '/../views/userstock.html');
        this.win.on('close', function (event) {
          //close;
          isClosed = true;
        });
        this.win.openDevTools();
      }
      this.win.show();
      isClosed = false;
    };

    this.hide = () => {
      if (!isClosed)
        this.win.hide();
    };

    this.win.on('close', function (event) {
      //close;
      isClosed = true;
    });

    this.win.openDevTools();
  }

  extension.registerWindow('UserStockWind', function () { return new UserStockWind() }, [], 'Favourites', true);
  extension.registerWindow('TableWindow', function () { return new TableWindow() }, [0], 'Alerts', false);

  module.exports = { ChartWindow, TableWindow };
}).call(this);

