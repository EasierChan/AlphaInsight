(function () {
    'use strict';
    const Qtp = require('../services/qtpmessage');
    const QtpConstant = require('../models/qtpmodel').QtpConstant;
    const IPCMSG = require('../models/qtpmodel').IPCMSG;
    const app = require('electron').app;
    const ipcMain = require('electron').ipcMain;
    const dialog = require('electron').dialog;
    const os = require('os');

    var alerts = new Array();

    this.Start = function () {
        console.log('start connect to server.');
        Qtp.getInstance().connectTo(global.Configuration.FeedHandler.ip
            , global.Configuration.FeedHandler.port);
        Qtp.getInstance().onDisconnected(function () {
            app.emit('disconnected');
            app.emit('heartbeat', global.Configuration.hearbeatInterval);
        });

        var istart = 0, iend = 900;
        function heartBeat() {
            if (iend < istart) {
                app.emit('heartbeat', global.Configuration.hearbeatInterval);
            }
            Qtp.getInstance().send(QtpConstant.MSG_TYPE_HEARTBEAT);
            istart = Date.now();
        }
        setInterval(heartBeat, global.Configuration.hearbeatInterval);

        Qtp.getInstance().addListener(QtpConstant.MSG_TYPE_HEARTBEAT, function () {
            iend = Date.now();
            app.emit('heartbeat', iend - istart);
        });

        Qtp.getInstance().onConnected(function () {
            console.log("send first heartbeat!");
            heartBeat();
            //TODO 请求代码表
            Qtp.getInstance().send(QtpConstant.MSG_TYPE_CODETABLE,
                { reqno: 1, msgtype: QtpConstant.MSG_TYPE_CODETABLE, codelist: [] });
            Qtp.getInstance().addListener(QtpConstant.MSG_TYPE_CODETABLE, function (res) {
                console.log("res.codetable.length: %d", res.codetable.length);
                if (res.codetable instanceof Array && res.codetable.length > 0) {
                    if (res.codetable.length > 0) {
                        global.codeTable.length = 0;
                        res.codetable.forEach(function (row) {
                            global.codeTable.push({ code: row.szWindCode, name: row.szCNName });
                        });
                        global.UserStock.setDetail();
                        // 异步保存到文件
                        global.saveCodeTable();
                    }
                } else if(!(res.codetable instanceof Array)){
                    console.error("res.codetable is not a array");
                } else {
                    console.warn("res.codetable is an empty array!");
                }
                return false;
            });
        });
    }

    function Reconnect() {
        if (Qtp.getInstance().getConnState() == 0) {
            Qtp.getInstance().connectTo(global.Configuration.FeedHandler.ip
                , global.Configuration.FeedHandler.port);

            setTimeout(function () {
                if (Qtp.getInstance().getConnState() == 2 && alerts.length > 0) {
                    var msg = {
                        reqno: 1,
                        msgtype: QtpConstant.MSG_TYPE_ALERT_SUB,
                        alertset: alerts,
                        filter: []
                    };
                    Qtp.getInstance().send(msg.msgtype, msg);
                }
            }, 1000);
        }
    }

    function Reset() {
        if (Qtp.getInstance().getConnState() != 0) {
            Qtp.getInstance().reset();
        }
        Reconnect();
    }

    app.on('reconnect', function (e, arg) {
        if (Qtp.getInstance().getConnState() == 2) {
            dialog.showMessageBox({
                type: "info",
                buttons: ["OK"],
                title: "提示",
                message: "连接已建立"
            });
        }
        Reconnect();
    });

    app.on('reset', function (e, arg) {
        Reset();
    });

    var g_reqno = 1;
    ipcMain.on(IPCMSG.BackendPoint, function (event, msg) {
        if (msg.msgtype == undefined) {
            console.error('invalid client request!');
            //event.sender.send('alerts-reply', { errmsg: "invalid client request!" });
            return;
        }

        //console.log("Send a message: type=%d", msg.msgtype);

        switch (msg.msgtype) {
            case QtpConstant.MSG_TYPE_ALERT_TYPE:
            case QtpConstant.MSG_TYPE_TOPLIST:
                msg.reqno = g_reqno++;
                Qtp.getInstance().send(msg.msgtype, msg);
                Qtp.getInstance().addListener(msg.msgtype, function (res) {
                    if (!event.sender.isDestroyed() && res.reqno == msg.reqno) {
                        event.sender.send(IPCMSG.FrontendPoint, res);
                        //console.log(res);
                        return false; //响应一次就取消
                    }
                    return false;
                });
                break;
            case QtpConstant.MSG_TYPE_ALERT_SUB:
                //add new alert.
                for (var x in msg.alertset) {
                    if (alerts.indexOf(msg.alertset[x]) < 0) {
                        alerts.push(msg.alertset[x]);
                    }
                }
                msg.alertset = alerts;
                Qtp.getInstance().send(msg.msgtype, msg);
                if (msg.reqno == -1) { //only send msg, avoid addListener for the Same Window
                    msg.reqno = 1;
                    break;
                }

                Qtp.getInstance().addListener(QtpConstant.MSG_TYPE_ALERT, function (res) {
                    if (!event.sender.isDestroyed()) {
                        event.sender.send(IPCMSG.FrontendPoint, res);
                        return true;
                    }
                    return false;
                });
                break;
            case QtpConstant.MSG_TYPE_TOPLIST_BASE:
            case QtpConstant.MSG_TYPE_TOPLIST_RELATE:
                msg.reqno = g_reqno++;
                Qtp.getInstance().send(msg.msgtype, msg);
                Qtp.getInstance().addListener(msg.msgtype, function (res) {
                    if (!event.sender.isDestroyed() && res.reqno == msg.reqno) {
                        event.sender.send(IPCMSG.FrontendPoint, res);
                        return false; //响应一次就取消
                    }
                    return false;
                });
                break;
            default:
                break;
        }
    });

    ipcMain.on('save-user-stock', function (e, data) {
        global.UserStock.detail = data;
        global.UserStock.codes = null;
        global.UserStock.codes = [];
        global.UserStock.detail.forEach(function (item) {
            global.UserStock.codes.push(item[0]);
        });
        global.UserStock.save();
    });

    this.CancelSub = function (type) {
        switch (type) {
            case 0: //cancel alert:
                Qtp.getInstance().send(QtpConstant.MSG_TYPE_ALERT_CANCEL, { reqno: 1, msgtype: QtpConstant.MSG_TYPE_ALERT_CANCEL, alertset: [] });
                break;
            default:
                console.error('wrong type: %d', type);
                break;
        }
    };


}).call(this);