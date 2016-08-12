(function () {
    'use strict';
    //const {Menu, app, BrowserWindow, dialog} = require('electron');
    const electron = require('electron');

    var menutemplate = [
        {//File Menu
            label: '文件',
            accelerator: 'Alt+F',
            submenu: [
                {
                    label: '连接',
                    click: function (item, wind) {
                        if (item.label == '连接') {
                            electron.app.emit('reconnect');
                        }
                    }
                },
                {
                    type: 'separator',
                },
                {
                    label: '选项',
                    click: function (item, wind) {
                        //console.log('click MenuItem ' + item.label);
                        electron.app.emit('open-url', 'preference');
                    }
                },
                {
                    type: 'separator'
                },
                {
                    label: '退出',
                    accelerator: 'Alt+F4',
                    click: function (item, wind) {
                        console.log('click MenuItem ' + item.label);
                        electron.app.quit();
                    }
                }
            ]
        },
        {//Account
            label: '账户',
            submenu: [
                {
                    label: '登录',
                    click: function (item, wind) {
                        console.log('click ' + item.label + 'on ' + wind.title);
                    }
                },
                {
                    label: '注销',
                    click: function (item, wind) {
                        console.log('click ' + item.label + 'on ' + wind.title);
                    }
                }
            ]
        },
        {//Windows
            label: '窗口',
            accelerator: 'Alt+W',
            submenu: [
                {
                    label: '信号',
                    submenu: []
                },
                {
                    label: '列表',
                    submenu: []
                }
            ]
        },
        {//Help
            label: '帮助',
            accelerator: 'Alt+W',
            submenu: [
                {
                    label: '帮助',
                    click: function (item, wind) {
                        console.log('click ' + item.label + 'on ' + wind.title);
                    }
                },
                {
                    label: '关于',
                    click: function (item, wind) {
                        electron.dialog.showMessageBox(wind, {
                            type: 'info', title: 'About', message: 'AlphaInsight version ' + electron.app.getVersion() + '\nreserved by LeHigh',
                            buttons: ['OK']
                        });
                    }
                }
            ]
        }
    ];

    function MenuWindow() {
        var ssize = electron.screen.getPrimaryDisplay().workAreaSize;
        // Create the browser window.
        var option = {
            title: 'AlphaInsight',
            autoHideMenuBar: false,
            show: false,
            resizeable: false
        };

        option.maxWidth = ssize.width;
        option.maxHeight = 30;
        option.useContentSize = true;
        option.maximizable = false;
        option.width = 300;//ssize.width - 200;//parseInt(ssize.width * 0.9);
        option.height = 30;
        option.x = (ssize.width - option.width) / 2;
        option.y = 0;
        
        this.win = new electron.BrowserWindow(option);
        this.win.loadURL("file://"+ __dirname + "/../views/menu.html");
        this.win.setMenu(electron.Menu.buildFromTemplate(menutemplate));
        // and load the index.html of the app.
        //this.win.loadURL(menutemplate);
        var realthis = this;
        this.win.on('close', function (e) {
            realthis.win = null;
            electron.app.quit();
        });
        
        electron.app.on('heartbeat', function(idelay){
            realthis.win.webContents.send('connstate', idelay);
        });
    } //end constructor MenuWindow

    MenuWindow.prototype.show = function () {
        this.win.show();
        this.win.setAlwaysOnTop(true);
        
        if(global.Configuration.windowSetting){
            if(global.Configuration.windowSetting.alwaysOnTop){
                this.win.setAlwaysOnTop(true);
            }
        }
    };

    MenuWindow.prototype.hide = function () {
        this.win.hide();
    };

    module.exports.MenuWindow = MenuWindow;
    module.exports.menutemplate = menutemplate;
}).call(this);