(function () {
    'use strict';

    const net = require('net');
    const stream = require('stream');
    const QtpConstant = require('../models/qtpmodel').QtpConstant;

    function TcpClient(mresolver) {
        this.sock_ = null;
        this.mresolver_ = mresolver;
        this.bConnected = false;// origin
    }

    TcpClient.prototype.connectTo = function (server_ip, server_port, cb_success) {
        var parent = this;
        this.sock_ = net.connect({ port: server_port, host: server_ip }, function (e) {
            console.log('succeed connected to server: ' + parent.sock_.remoteAddress);
            parent.bConnected = true;
            cb_success();
        });

        this.sock_.on('error', function (err) {
            console.error('connection error: ', err);
        })

        this.sock_.on('data', function (data) {
            console.log("Recv server message: msglen = %d", data.length);
            if (parent.mresolver_.setInBuffer(data) === false) {
                console.log('Warning: NetWork data length reached the limit!');
                parent.sock_.pause();
                setTimeout(function () {
                    parent.sock_.resume();
                }, 1000);
            }
        });

        this.sock_.on('end', function () {
            if (parent.sock_.remoteAddress) {
                console.log('disconnected from server: ' + parent.sock_.remoteAddress);
                parent.bConnected = false;
                parent.mresolver_.stop();
            }
        });

        this.sock_.on('close', function (had_error) {
            if (had_error) {
                //console.error('raise a transimssion error');
                parent.bConnected = false;
                parent.mresolver_.stop();
            }
        });

        return true;
    };

    TcpClient.prototype.send = function (data, callback) {
        if (!this.bConnected) {
            console.log('connection is not established.');
            return false;
        }

        var len = this.sock_.write(data);
        //console.log("send data len: ", len);
        if (callback) {
            callback();
        }
        return true;
    };

    TcpClient.prototype.close = function () {
        if (this.bConnected) {
            this.sock_.end();
            this.sock_ = null;
        }
    };

    TcpClient.prototype.pause = function () {
        this.sock_.pause();
    };

    function QtpMessageClient(cb_disconnect) {
        this.connState = 0;
        this.clientSock_ = new TcpClient(this);
        this.maxLen_ = 1024 * 1024;
        this.headerLen_ = 12;
        this.chunkLen_ = 4 * 1024;
        this.inBuffer_ = Buffer.alloc(this.chunkLen_, 0);
        this.inBufferBeg_ = 0;
        this.inBufferEnd_ = 0;
        this.listeners_ = new Array();
        //this.eventHandle_ = null;
        this.cb_disconnect_ = cb_disconnect;
        this.recordNum = 0;
        var realthis = this;
        // setInterval(function () {
        //     if (realthis.recordNum > 10 && (realthis.inBufferEnd_ - realthis.inBufferBeg_) > 0) {
        //         if (realthis.eventHandle_) {
        //             clearInterval(realthis.eventHandle_);
        //             global.Configuration.recvfrequency >>= 1;
        //             global.Configuration.recvfrequency = global.Configuration.recvfrequency > 0 ? global.Configuration.recvfrequency : 10;
        //             realthis.eventHandle_ = setInterval(function () {
        //                 realthis.resolve();
        //             }, global.Configuration.recvfrequency);
        //             //console.log("#################### ########### come in: %d", global.Configuration.recvfrequency);
        //         }
        //         return;
        //     }

        //     if(realthis.recordNum == 0 && (realthis.inBufferEnd_ - realthis.inBufferBeg_) < 12){
        //         if (realthis.eventHandle_) {
        //             clearInterval(realthis.eventHandle_);
        //             global.Configuration.recvfrequency += 10;
        //             global.Configuration.recvfrequency = global.Configuration.recvfrequency < 100 ? global.Configuration.recvfrequency : 100;
        //             realthis.eventHandle_ = setInterval(function () {
        //                 realthis.resolve();
        //             }, global.Configuration.recvfrequency);
        //             //console.log("#################### ########### come in: %d", global.Configuration.recvfrequency);
        //         }
        //     }
        // }, 1000);
    }

    // to connect, maybe can't connect to the server.
    QtpMessageClient.prototype.connectTo = function (ip, port) {
        if (this.connState == 2) { //prevent from reconnecting
            return true;
        }
        this.recordNum = 0;
        this.connState = 1;
        var realthis = this;
        return this.clientSock_.connectTo(ip, port, function () {
            realthis.connState = 2;
            // realthis.eventHandle_ = setInterval(function () {
            //     realthis.resolve();
            // }, global.Configuration.recvfrequency);
        });
    };

    QtpMessageClient.prototype.setInBuffer = function (data) {
        ++this.recordNum; //add a record

        if (this.inBufferEnd_ + data.length <= this.inBuffer_.length) {
            var len = data.copy(this.inBuffer_, this.inBufferEnd_, 0);
            this.inBufferEnd_ += len;
        } else {
            //console.log(this.inBuffer_);
            //console.log(data);
            var count = parseInt(data.length / this.chunkLen_, 10) + 1;
            var tmpInBuffer = Buffer.alloc(this.inBuffer_.length + this.chunkLen_ * count);
            var orginlen = this.inBuffer_.copy(tmpInBuffer, 0, this.inBufferBeg_, this.inBufferEnd_);
            var dlen = data.copy(tmpInBuffer, orginlen);
            this.inBufferBeg_ = 0;
            this.inBufferEnd_ = orginlen + dlen;
            this.inBuffer_ = null;
            this.inBuffer_ = tmpInBuffer;
            tmpInBuffer = null;
        }

        if (this.inBufferEnd_ > this.maxLen_) { /** could set the length as a configuration */
            return false;
        }

        console.log(this.inBufferBeg_, this.inBufferEnd_);
        while (this.resolve()) {
            ;
        } // add test
        return true;
    };

    QtpMessageClient.prototype.send = function (type, data) {
        if (this.connState != 2) {
            return false;
        }

        //console.log("send a request: msgtype=%d", type);
        var header = Buffer.alloc(12, 0);
        header.writeUInt16LE(type, 2);
        switch (type) {
            case QtpConstant.MSG_TYPE_LOGIN:
                console.log("Send MSG_TYPE_LOGIN");
                break;
            case QtpConstant.MSG_TYPE_LOGOUT:
                console.log("Send MSG_TYPE_LOGOUT");
                break;
            case QtpConstant.MSG_TYPE_HEARTBEAT:
                console.log("Send MSG_TYPE_HEARTBEAT");
                break;
            case QtpConstant.MSG_TYPE_CODETABLE:
                console.log("Send MSG_TYPE_CODETABLE");
                break;
            case QtpConstant.MSG_TYPE_ALERT_TYPE:
                console.log("Send MSG_TYPE_ALERT_TYPE");
                break;
            case QtpConstant.MSG_TYPE_ALERT_SUB:
                console.log("Send MSG_TYPE_ALERT_SUB");
                break;
            case QtpConstant.MSG_TYPE_ALERT_ADD:
                console.log("Send MSG_TYPE_ALERT_ADD");
                break;
            case QtpConstant.MSG_TYPE_ALERT_CANCEL:
                console.log("Send MSG_TYPE_ALERT_CANCEL");
                this.clearInBuffer();
                break;
            case QtpConstant.MSG_TYPE_TOPLIST:
                console.log("Send MSG_TYPE_TOPLIST");
                break;
            case QtpConstant.MSG_TYPE_TOPLIST_BASE:
                console.log("Send MSG_TYPE_TOPLIST_BASE");
                break;
            default:
                console.log('unknown request type!');
                break;
        }

        var ret = false;
        if (data) {
            var content = Buffer.from(JSON.stringify(data));
            header.writeUInt32LE(content.length, 8);
            var total = Buffer.concat([header, content], header.length + content.length);
            ret = this.clientSock_.send(total);
            total = null;
            content = null;
        } else {
            ret = this.clientSock_.send(header);
        }

        header = null;
        return ret;
    };

    QtpMessageClient.prototype.readHeader = function () {
        var version = this.inBuffer_.readUInt8(this.inBufferBeg_ + 0);
        var service = this.inBuffer_.readUInt8(this.inBufferBeg_ + 1);
        var msgtype = this.inBuffer_.readUInt16LE(this.inBufferBeg_ + 2);
        var topic = this.inBuffer_.readUInt16LE(this.inBufferBeg_ + 4);
        var optslen = this.inBuffer_.readUInt16LE(this.inBufferBeg_ + 6);
        var datalen = this.inBuffer_.readUInt32LE(this.inBufferBeg_ + 8);
        //console.log("beg: %d; datalen: %d", this.inBufferBeg_, datalen);
        return { type: msgtype, datalen: datalen };
    };

    QtpMessageClient.prototype.readContent = function (datalen) {
        //send top list to front
        var obj = JSON.stringify(this.inBuffer_.slice(this.inBufferBeg_ + this.headerLen_
            , this.inBufferBeg_ + this.headerLen_ + datalen));

        const copystr = JSON.parse(obj, function (k, v) {
            return v && v.type === 'Buffer'
                ? Buffer.from(v.data)
                : v;
        });

        if (copystr.length == 0) {
            return null;
        }

        return JSON.parse(copystr.toString());
    };

    QtpMessageClient.prototype.resolve = function () {
        var contentLen = this.inBufferEnd_ - this.inBufferBeg_;
        if (contentLen < this.headerLen_) {
            console.log('wait for a message!');
            return false; // a uncomplete msg;
        }
        //read msg header;
        var header = this.readHeader();

        if (contentLen < this.headerLen_ + header.datalen) {
            console.log("wait for more buffer, actual len: %d, expect len: %d"
                , contentLen, this.headerLen_ + header.datalen);
            return false; // a uncomplete msg;
        }

        switch (header.type) {
            case QtpConstant.MSG_TYPE_LOGIN:
                console.info("Received MSG_TYPE_LOGIN ,type: %d", header.type);
                break;
            case QtpConstant.MSG_TYPE_ALERT_TYPE:
                console.info("Received MSG_TYPE_ALERT_TYPE, type: %d", header.type);
                break;
            case QtpConstant.MSG_TYPE_TOPLIST:
                console.info("Received MSG_TYPE_TOPLIST, datalen: type: %d", header.type);
                break;
            case QtpConstant.MSG_TYPE_TOPLIST_BASE:
                console.info("Received MSG_TYPE_TOPLIST_BASE, datalen: type: %d", header.type);
                break;
            case QtpConstant.MSG_TYPE_ALERT_SUB:
                console.info("Received MSG_TYPE_ALERT_SUB, datalen: type: %d", header.type);
                break;
            case QtpConstant.MSG_TYPE_ALERT:
                console.info("Received MSG_TYPE_ALERT, datalen: type: %d", header.type);
                break;
            case QtpConstant.MSG_TYPE_ALERT_CANCEL:
                console.info("Received MSG_TYPE_ALERT_CANCEL, datalen: type: %d", header.type);
                break;
            case QtpConstant.MSG_TYPE_HEARTBEAT:
                console.info("Received MSG_TYPE_HEARTBEAT");
                break;
            default:
                console.info("Received a Unknown Msg, datalen: %d, msgtype: %d", header.datalen, header.type);
                break;
        }


        var res = this.readContent(header.datalen);
        this.inBufferBeg_ += this.headerLen_ + header.datalen;

        if (this.inBufferBeg_ > this.chunkLen_) {
            this.inBuffer_.copy(this.inBuffer_, 0, this.inBufferBeg_);
            this.inBufferEnd_ -= this.inBufferBeg_;
            this.inBufferBeg_ = 0;
        }

        --this.recordNum; //remove a record
        // call the related listeners.
        for (var idx in this.listeners_) {
            if (this.listeners_[idx].type == header.type) {
                for (var k = 0; k < this.listeners_[idx].fnArr.length;) {
                    if ((this.listeners_[idx].fnArr[k])(res) == false) { // false to delete from fnArr.
                        this.listeners_[idx].fnArr.splice(k, 1);
                        continue;
                    }
                    ++k;
                }

                if (this.listeners_[idx].fnArr.length == 0 && header.type == QtpConstant.MSG_TYPE_ALERT_SUB) {
                    this.send(QtpConstant.MSG_TYPE_ALERT_CANCEL, { reqno: 1, msgtype: QtpConstant.MSG_TYPE_ALERT_CANCEL, alertset: [] });
                }
            }
        }

        header = null;
        //console.log(res);
        return true;
    };

    QtpMessageClient.prototype.addListener = function (ptype, pcallback) {
        if (ptype == undefined) {
            console.error('error parameter for addListener');
            return;
        }

        for (var i in this.listeners_) {
            if (this.listeners_[i].type == ptype) {
                this.listeners_[i].fnArr.push(pcallback);
                return;
            }
        }

        this.listeners_.push({ type: ptype, fnArr: [pcallback] });
    }

    QtpMessageClient.prototype.stop = function () {
        this.reset();
        if (this.cb_disconnect_) {
            (this.cb_disconnect_)();
        }
    }

    QtpMessageClient.prototype.reset = function () {
        // if (this.eventHandle_) {
        //     clearInterval(this.eventHandle_);
        // }
        this.clientSock_.close();
        this.inBuffer_ = null;
        this.inBuffer_ = Buffer.alloc(this.chunkLen_, 0);
        this.inBufferBeg_ = this.inBufferEnd_ = 0;
        this.connState = 0;
    }

    QtpMessageClient.prototype.clearInBuffer = function () {
        // if(this.eventHandle_){
        //     clearInterval(this.eventHandle_);
        // }
        this.inBuffer_ = null;
        this.inBuffer_ = Buffer.alloc(this.chunkLen_, 0);
        this.inBufferBeg_ = this.inBufferEnd_ = 0;
        this.recordNum = 0;
        var realthis = this;
        // this.eventHandle_ = setInterval(function () {
        //     realthis.resolve();
        // }, global.Configuration.recvfrequency);
    }

    QtpMessageClient.prototype.watchDisconnection = function (cb_disconnect) {
        this.cb_disconnect_ = cb_disconnect;
    }

    QtpMessageClient.prototype.getConnState = function () {
        return this.connState;
    }

    var getInstance = (function () {
        var qtpclient = new QtpMessageClient();
        return function () {
            return qtpclient;
        }
    })();

    //console.log(typeof getInstance);
    module.exports.getInstance = getInstance;
}).call(this);