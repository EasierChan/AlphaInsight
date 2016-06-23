(function () {
    //const {Menu, app, BrowserWindow, dialog} = require('electron');
    const electron = require('electron');

    var menutemplate = [
        {//File Menu
            label: 'File',
            accelerator: 'Alt+F',
            submenu: [
                {
                    label: 'Quit',
                    accelerator: 'Alt+F4',
                    click: function (item, wind) {
                        console.log('click MenuItem ' + item.label);
                        electron.app.quit();
                    }
                }
            ]
        },
        {//Account
            label: 'Account',
            submenu: [
                {
                    label: 'Log in',
                    click: function (item, wind) {
                        console.log('click ' + item.label + 'on ' + wind.title);
                    }
                },
                {
                    label: 'Log out',
                    click: function (item, wind) {
                        console.log('click ' + item.label + 'on ' + wind.title);
                    }
                }
            ]
        },
        {//Windows
            label: 'Windows',
            accelerator: 'Alt+W',
            submenu: [
                {
                    label: 'Alerts',
                    submenu: []
                },
                {
                    label: 'Toplist',
                    submenu: []
                }
            ]
        },
        {//Help
            label: 'Help',
            accelerator: 'Alt+W',
            submenu: [
                {
                    label: 'Help',
                    click: function (item, wind) {
                        console.log('click ' + item.label + 'on ' + wind.title);
                    }
                },
                {
                    label: 'About',
                    click: function (item, wind) {
                        electron.dialog.showMessageBox(wind, {
                            type: 'info', title: 'About', message: 'AlphaInsight version 0.1.0\nreserved by LeHigh',
                            buttons: ['OK']
                        });
                    }
                }
            ]
        }
    ];

    function MenuWindow() {
        var ssize = require('electron').screen.getPrimaryDisplay().workAreaSize;
        // Create the browser window.

        option = {
            title: 'AlphaInsight',
            width: 420, height: 50,
            autoHideMenuBar: false,
            show: false
        };

        option.maxWidth = ssize.width;
        option.maxHeight = 50;
        option.maximizable = false;
        option.width = ssize.width - 200;//parseInt(ssize.width * 0.9);
        option.x = (ssize.width - option.width) / 2;
        option.y = 0;
        //option.transparent = true;
        this.win = new electron.BrowserWindow(option);

        this.win.setMenu(electron.Menu.buildFromTemplate(menutemplate));
        // and load the index.html of the app.
        //this.win.loadURL(menutemplate);
        var realthis = this;
        this.win.on('close', function (e) {
            realthis.win = null;
            electron.app.quit();
            //e.preventDefault();
            /*dialog.showMessageBox(this.win, { type: 'warning', title: 'Warning', buttons: ['Yes', 'No'], message: 'Sure to Quit?' }, (res) => {
                if (res == 0) {//Yes
                    console.log('click Yes');
                    this.win = null;
                    app.exit(0);
                } else {
                    console.log('click No');
                }
            });*/
        });
        // Open the DevTools.
        //this.win.webContents.openDevTools();
    } //end constructor MenuWindow

    MenuWindow.prototype.show = function () {
        this.win.show();
    }

    MenuWindow.prototype.hide = function () {
        this.win.hide();
    }

    module.exports.MenuWindow = MenuWindow;
    module.exports.menutemplate = menutemplate;
}).call(this);