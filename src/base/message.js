(function () {
    'use strict';
    const Qtp = require('../services/qtpmessage');
    const QtpConstant = require('../models/qtpmodel').QtpConstant;
    const MsgChannel = require('../models/qtpmodel').MsgChannel;
    const app = require('electron').app;
    const ipcMain = require('electron').ipcMain;
    const dialog = require('electron').dialog;
    const os = require('os');

    var alerts = new Array();


    Array.prototype.unique = function () {
        var i = this.length;
        while (i--) {
            this.splice(i)
        }
    }

    this.Start = function () {
        Qtp.getInstance().connectTo(global.Configuration.FeedHandler.ip
            , global.Configuration.FeedHandler.port);
        Qtp.getInstance().watchDisconnection(function () {
            app.emit('disconnected');
        });
        
        var idelay = 0;
        setInterval(function () {
            Qtp.getInstance().send(QtpConstant.MSG_TYPE_HEARTBEAT);
            idelay = new Date().getTime();
        }, 10000);
        
        Qtp.getInstance().addListener(QtpConstant.MSG_TYPE_HEARTBEAT, function(){
            idelay = (new Date()).getTime() - idelay;
            app.emit('heartbeat', idelay);
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

    ipcMain.on(MsgChannel.Alert_Sub, function (event, msg) {
        if (msg.msgtype == undefined) {
            console.error('invalid client request!');
            //event.sender.send('alerts-reply', { errmsg: "invalid client request!" });
            return;
        }

        //console.log("Send a message: type=%d", msg.msgtype);

        switch (msg.msgtype) {
            case QtpConstant.MSG_TYPE_ALERT_TYPE:
                Qtp.getInstance().send(msg.msgtype, msg);
                Qtp.getInstance().addListener(QtpConstant.MSG_TYPE_ALERT_TYPE, function (res) {
                    if (!event.sender.isDestroyed()) {
                        event.sender.send(MsgChannel.Alert_Pub, res);
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

                Qtp.getInstance().send(msg.msgtype, msg);

                Qtp.getInstance().addListener(QtpConstant.MSG_TYPE_ALERT, function (res) {
                    if (!event.sender.isDestroyed()) {
                        event.sender.send(MsgChannel.Alert_Pub, res);
                        return true;
                    }
                    return false;
                });
                break;
            default:
                break;
        }
    });

}).call(this);