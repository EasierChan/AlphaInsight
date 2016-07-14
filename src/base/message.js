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
        Qtp.getInstance().watchDisconnection(function () {
            app.emit('disconnected');
            app.emit('heartbeat', global.Configuration.hearbeatInterval);
        });

        var istart = 0, iend = 900;
        setInterval(function () {
            if (iend < istart) {
                app.emit('heartbeat', global.Configuration.hearbeatInterval);
            }
            Qtp.getInstance().send(QtpConstant.MSG_TYPE_HEARTBEAT);
            istart = Date.now();
        }, global.Configuration.hearbeatInterval);

        Qtp.getInstance().addListener(QtpConstant.MSG_TYPE_HEARTBEAT, function () {
            iend = Date.now();
            app.emit('heartbeat', iend - istart);
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
                Qtp.getInstance().send(msg.msgtype, msg);
                Qtp.getInstance().addListener(msg.msgtype, function (res) {
                    if (!event.sender.isDestroyed()) {
                        event.sender.send(IPCMSG.FrontendPoint, res);
                        //console.log(res);
                        return true;
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

                Qtp.getInstance().addListener(QtpConstant.MSG_TYPE_ALERT, function (res) {
                    if (!event.sender.isDestroyed()) {
                        event.sender.send(IPCMSG.FrontendPoint, res);
                        return true;
                    }
                    return false;
                });
                break;
            default:
                break;
        }
    });
    
    this.requestMsg = function(type, callback){
        switch (type) {
            case QtpConstant.MSG_TYPE_ALERT_TYPE:
                Qtp.getInstance().send(type, {reqno:1, msgtype: type});
                Qtp.getInstance().addListener(type, callback);
                break;
            case QtpConstant.MSG_TYPE_TOPLIST:
                Qtp.getInstance().send(type, {reqno:2, msgtype: type});
                Qtp.getInstance().addListener(type, callback);
                break;
            default:
                console.error('wrong type: %d', type);
                break;
        }
    };
    
    
}).call(this);