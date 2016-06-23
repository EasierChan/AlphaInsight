(function () {
    'use strict';
    const Qtp = require('../services/qtpmessage');
    const QtpConstant = require('../models/qtpmodel').QtpConstant;
    const MsgChannel = require('../models/qtpmodel').MsgChannel;
    const electron = require('electron');


    Qtp.getInstance().connectTo('172.24.10.35', '9005');
    electron.ipcMain.on(MsgChannel.Alert_Sub, function (event, msg) {
        console.log('hello');
        if (msg.msgtype == undefined) {
            console.error('invalid client request!');
            //event.sender.send('alerts-reply', { errmsg: "invalid client request!" });
            return;
        }
        console.log("received a message: type=%d", msg.msgtype);
        Qtp.getInstance().send(msg.msgtype, msg);


        switch (msg.msgtype) {
            case QtpConstant.MSG_TYPE_ALERT_TYPE:
                Qtp.getInstance().addListener(QtpConstant.MSG_TYPE_ALERT_TYPE_ANSER, function (res) {
                    if (!event.sender.isDestroyed()) {
                        event.sender.send(MsgChannel.Alert_Pub, res);
                        return true;
                    }
                    return false;
                });
                break;
            case QtpConstant.MSG_TYPE_ALERT_SUB:
                Qtp.getInstance().addListener(QtpConstant.MSG_TYPE_ALERT_ANSWER, function (res) {
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