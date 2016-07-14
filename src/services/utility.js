/**
 * some tool function for application
 */

(function () {
    'use strict';
    const extension = require('./extension');
    const menutemplate = require('../base/MenuWindow').menutemplate;
    const assert = require('assert');
    const fs = require('fs');
    const os = require('os');
    const StringDecoder = require('string_decoder').StringDecoder;

    var insertMenu = function (targetMenu, idx) {
        if (idx >= 0 && idx < targetMenu.length) {
            return targetMenu[idx].submenu ? targetMenu[idx].submenu : (targetMenu[idx].submenu = [], targetMenu[idx].submenu);
        }
        return -1;
    }

    this.loadExtension = function (windows) {
        console.log('start loading extension.');
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

    this.loadConfig = function () {
        console.log('start loading configuration.');
        loadDefaultSetting();
        loadUserStock();
    }

    function loadDefaultSetting() {
        var fpath = __dirname + "/../conf/default-setting.json";
        var errmsg = "incorrect configuration file.";
        var configObj = JSON.parse(fs.readFileSync(fpath));
        assert(configObj.hasOwnProperty('FeedHandler'), errmsg);
        assert(configObj.hasOwnProperty('enableFavourites'), errmsg);
        errmsg = null;
        global.Configuration = configObj;
        global.Configuration.save = function () {
            fs.writeFile(fpath
                , JSON.stringify(global.Configuration, null, 2)
                , function (err) {
                    if (err) {
                        throw err;
                    }
                    console.log('Save Configuration successfully!');
                });
        };
        
        if (!global.Configuration.hasOwnProperty('recvfrequency')) {
            global.Configuration.recvfrequency = 1000;
        }
        
        if(!global.Configuration.hasOwnProperty('hearbeatInterval')){
            global.Configuration.hearbeatInterval = 10000;
        }
        configObj = null;
    }
    
    function loadUserStock(){
        var fstockpath = __dirname + "/../conf/user-stock.csv";
        global.UserStock = new Object();
        global.UserStock.detail = new Array();
        global.UserStock.codes = new Array();
        
        const decoder = new StringDecoder('utf8');
        const rows = decoder.write(fs.readFileSync(fstockpath)).split(os.EOL);
        const rl = require('readline');
        var tempArr;
        rows.forEach(function(row){
            tempArr = row.split(',');
            global.UserStock.detail.push(tempArr);
            global.UserStock.codes.push(tempArr[0]);
        });
        
        //console.log(global.UserStock);
    }
    
    function startWatcher() {
        fs.watch(fpath, function (event, filename) {
            console.log(event, filename);
        });
    }

    //startWatcher();
    module.exports = this;

}).call(this);