/**
 * to show a 
 */

(function () {
  'use strict';

  const {BrowserWindow} = require('electron');
  const extension = require('../services/extension');

  function ChartWindow() {
    this.win = new BrowserWindow({ autoHideMenuBar: true, skipTaskbar: true, height: 300, width: 500, resizable: false, show: false })
    this.win.loadURL('file://' + __dirname + '/../views/chart.html');
    this.show = () => {
      if (this.win == null) {
        this.win = new ChartWindow();
      }
      
      this.win.show();
    };

    this.hide = () => {
      if (this.win != null)
        this.win.hide();
    };

    this.win.on('close', (event) => {
      this.win = null;
      //event.preventDefault();
      //this.hide();
      //application.SetWindow('ChartWindow', false); //close
    });
    //this.win.openDevTools();
  }

  function TableWindow() {
    this.win = new BrowserWindow({ autoHideMenuBar: true, skipTaskbar: true, height: 300, width: 500, resizable: true, show: false })
    this.win.loadURL('file://' + __dirname + '/../views/toplist.html');
    this.show = () => {
      if (this.win === null) {
        this.win = new TableWindow();
      }
      this.win.show();
    };

    this.hide = () => {
      if (this.win != null)
        this.win.hide();
    };

    this.win.on('close', (event) => {
      this.win = null;
      //event.preventDefault();
      //this.hide();
      //application.SetWindow('TableWindow', false); //close
    });
    this.win.openDevTools();
  }
  
  
  extension.registerWindow('ChartWin', ()=>{return new ChartWindow()}, [], 'Chars', true);
  extension.registerWindow('TableWindow', ()=>{return new TableWindow()}, [0], 'Alerts', false);

  module.exports = { ChartWindow, TableWindow };
}).call(this);

