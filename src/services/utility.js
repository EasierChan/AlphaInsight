/**
 * some tool function for application
 */

(function () {
    'use strict';
    const extension = require('./extension');
    const menutemplate = require('../base/MenuWindow').menutemplate;
    const assert = require('assert');
    const fs = require('fs');

    var insertMenu = function (targetMenu, idx) {
        if (idx >= 0 && idx < targetMenu.length) {
            return targetMenu[idx].submenu ? targetMenu[idx].submenu : (targetMenu[idx].submenu = [], targetMenu[idx].submenu);
        }
        return -1;
    }

    this.loadExtension = function (windows) {
        var app = require('electron').app;
        extension.windowsMap.forEach(function (obj) {
            if (obj && obj.type && obj.getInstance && obj.ancestorIdxArr && obj.nickname) {
                if (obj.isSingleton) {
                    windows[obj.type] = obj.getInstance();
                } else {
                    windows[obj.type] = obj.getInstance;
                }
                if (obj.ancestorIdxArr.length == 0) {
                    menutemplate[2].submenu.push({
                        label: obj.nickname, click: function (item, wind) {
                            app.emit('open-url', obj.type);
                        }
                    });
                } else {
                    var res = menutemplate[2].submenu;
                    var targetMenu;
                    var i = 0;
                    while (res !== -1) {
                        targetMenu = res;
                        res = insertMenu(targetMenu, obj.ancestorIdxArr[i++]);
                    }
                    targetMenu.push({
                        label: obj.nickname, click: function (item, wind) {
                            app.emit('open-url', obj.type);
                        }
                    });
                }
                return;
            }
            console.error('wrong extension: ', obj);
        });
    }

    var fpath = __dirname + "/../conf/alpha.json";
    this.loadConfig = function () {
        var errmsg = "incorrect configuration file.";
        var configObj = JSON.parse(fs.readFileSync(fpath));
        assert(configObj.hasOwnProperty('FeedHandler'), errmsg);
        assert(configObj.hasOwnProperty('enableFavourites'), errmsg);
        global.Configuration = configObj;
        if(!global.Configuration.hasOwnProperty('recvfrequency')){
            global.Configuration.recvfrequency = 1000;
        }
        configObj = null;
        fpath = __dirname + "/../conf/user-stock.json";
        global.UserStockCode = JSON.parse(fs.readFileSync(fpath));
    }

    var startWatcher = function () {
        fs.watch(fpath, function (event, filename) {
            console.log(event, filename);
        });
    }

    //startWatcher();
    module.exports = this;

}).call(this);