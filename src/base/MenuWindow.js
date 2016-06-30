(function () {
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
                            type: 'info', title: 'About', message: 'AlphaInsight version 0.1.0\nreserved by LeHigh',
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
        option = {
            title: 'AlphaInsight',
            width: 420, height: 30,
            autoHideMenuBar: false,
            show: false
        };

        option.maxWidth = ssize.width;
        option.maxHeight = 30;
        option.useContentSize = true;
        option.maximizable = false;
        option.width = ssize.width - 200;//parseInt(ssize.width * 0.9);
        option.x = (ssize.width - option.width) / 2;
        option.y = 0;
        //option.transparent = true;
        this.win = new electron.BrowserWindow(option);
        this.win.loadURL("file://"+ __dirname + "/../views/menu.html");
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
        
        electron.app.on('heartbeat', function(idelay){
            realthis.win.webContents.send('connstate', idelay);
        });
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