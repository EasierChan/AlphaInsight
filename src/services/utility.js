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
        loadUserStockFromJSON();
        loadCodeTable();
        
        //代码表
        global.codeTable = [];
        //计数器
        global.Subscriber = new Object();
        global.Subscriber.alerts = 0;
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

        if (!global.Configuration.hasOwnProperty('hearbeatInterval')) {
            global.Configuration.hearbeatInterval = 10000;
        }

        if (!global.Configuration.hasOwnProperty('windowSetting')) {
            global.Configuration['windowSetting']['alwaysOnTop'] = true;
        }
        configObj = null;
    }

    function loadUserStockFromJSON() {
        var fstockpath = __dirname + "/../conf/user-stock.json";
        const stat = fs.statSync(fstockpath);
        if(!stat.isFile()){
            console.error("自选股文件不存在!");
        }
        global.UserStock = new Object();
        global.UserStock.codes = JSON.parse(fs.readFileSync(fstockpath));
        global.UserStock.detail = [];
        global.UserStock.setDetail = function () {
            var count = global.UserStock.codes.length;
            var idx = 0;
            global.codeTable.forEach(function (item) {
                if(count == 0)return;
                if ((idx = global.UserStock.codes.indexOf(item.code)) >= 0) {
                    var arr = new Array();
                    arr.push(global.UserStock.codes[idx]);
                    arr.push(item.name);
                    global.UserStock.detail.push(arr);
                    --count;
                }
            });
            //console.log(global.UserStock.detail);
            //console.log(global.codeTable[0]);
        }
        
        global.UserStock.save = function () {
            fs.writeFile(fstockpath, JSON.stringify(global.UserStock.codes), function (err) {
                if (err) throw err;
                console.log("stock file saved succesfully!");
            });
        };
    }
    
    function loadCodeTable(){
        var fstockpath = __dirname + "/../conf/codetable.json";
        fs.readFile(fstockpath, (err, data) => {
            if (err && err.code == 'ENOENT'){
                console.error("代码表文件不存在！");
                return;
            };
            global.codeTable = JSON.parse(data);
            //console.error(codeTable);
        });
        
        global.saveCodeTable = function(){
            fs.writeFile(fstockpath, JSON.stringify(global.codeTable), function (err) {
                if ( err ) throw err;
                console.log("stock file saved succesfully!");
            });
        };
        //global.codeTable = JSON.parse(fs.readFileSync(fstockpath));
    }
    // 加载自选股
    function loadUserStockFromCSV() {
        var fstockpath = __dirname + "/../conf/user-stock.csv";
        global.UserStock = new Object();
        global.UserStock.detail = new Array();
        global.UserStock.codes = new Array();

        const decoder = new StringDecoder('utf8');
        const rows = decoder.write(fs.readFileSync(fstockpath)).split(os.EOL);
        const rl = require('readline');
        var tempArr;
        rows.forEach(function (row) {
            tempArr = row.split(',');
            global.UserStock.detail.push(tempArr);
            global.UserStock.codes.push(tempArr[0]);
        });

        global.UserStock.save = function () {
            fs.writeFile(fstockpath, global.UserStock.detail.join(os.EOL), function (err) {
                if (err) throw err;
                console.log("stock file saved succesfully!");
            });
        };
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
