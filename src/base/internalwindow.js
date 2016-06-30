/**
 * windows for internal configurations.
 */
(function () {
    'use strict';

    const ipcMain = require('electron').ipcMain;
    const BrowserWindow = require('electron').BrowserWindow;

    function PreferenceWindow() {
        this.isClosed = false;
        this.makeWindow();
    }

    PreferenceWindow.prototype.makeWindow = function () {
        var option = { autoHideMenuBar: true, show: false, width: 500, maxWidth: 500, height: 300, maxHeight: 300, maximizable: false };
        this.win = new BrowserWindow(option);
        this.win.loadURL('file://' + __dirname + '/../views/preference.html');

        var realthis = this;
        this.win.on('close', function (event) {
            realthis.isClosed = true;
        });


        this.win.webContents.on('did-finish-load', function () {
            realthis.win.webContents.send('backend_change', global.Configuration);
        });
        //receive preference_change
    }

    PreferenceWindow.prototype.show = function () {
        if (this.isClosed) {
            this.makeWindow();
        }
        this.win.show();
        //this.win.openDevTools();
        this.isClosed = false;
    }

    ipcMain.on('preference_change', function (e, arg) {
        global.Configuration.FeedHandler.ip = arg.ip;
        global.Configuration.FeedHandler.port = arg.port;
        global.Configuration.recvfrequency = arg.freq;
        require('electron').app.emit('reset');
    });
    
    module.exports.PreferenceWindow = PreferenceWindow;
}).call(this);