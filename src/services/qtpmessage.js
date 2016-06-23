(function () {
    'use strict';

    const net = require('net');
    const stream = require('stream');
    const QtpConstant = require('../models/qtpmodel');

    function TcpClient(mresolver) {
        this.sock_ = null;
        this.mresolver_ = mresolver;
    }

    TcpClient.prototype.connectTo = function (server_ip, server_port) {
        var parent = this;
        this.sock_ = net.connect({ port: server_port, host: server_ip }, function (e) {
            console.log('succeed connected to server: ' + parent.sock_.remoteAddress);
        });


        this.sock_.on('data', function (data) {
            console.log("Received a message: msglen = %d", data.length);
            if (parent.mresolver_.setInBuffer(data) === false) {
                console.log('Warning: NetWork data length reached the limit!');
                parent.sock_.pause();
                setTimeout(function() {
                    parent.sock_.resume();
                }, 1000);
            }
        });

        this.sock_.on('end', function () {
            console.log('disconnected from server: ' + parent.sock_.remoteAddress);
            parent.mresolver_.stop();
        });

        this.sock_.on('close', function(had_error) {
            if (had_error) {
                console.error('raise a transimssion error');
            }
        });

        return true;
    };

    TcpClient.prototype.send = function (data, callback) {
        var len = this.sock_.write(data);
        //console.log("send data len: ", len);
        if (callback) {
            callback();
        }
    };

    TcpClient.prototype.close = function () {
        if (this.sock_ != null) {
            this.sock_.end();
            this.sock_ = null;
        }
    };

    function QtpMessageClient() {
        this.clientSock_ = new TcpClient(this);
        this.maxLen_ = 1024 * 1024;
        this.headerLen_ = 12;
        this.chunkLen_ = 4 * 1024;
        this.inBuffer_ = Buffer.alloc(this.chunkLen_, 0);
        this.inBufferBeg_ = 0;
        this.inBufferEnd_ = 0;
        this.listeners_ = new Array();
        this.eventHandle_ = null;
        //setInterval(resolve, 1000);
    }

    QtpMessageClient.prototype.connectTo = function (ip, port) {
        var realthis = this;
        this.eventHandle_ = setInterval(function () {
            realthis.resolve();
        }, 1000);
        return this.clientSock_.connectTo(ip, port);
    };

    QtpMessageClient.prototype.setInBuffer = function (data) {

        if (this.inBufferEnd_ + data.length <= this.chunkLen_) {
            var len = data.copy(this.inBuffer_, this.inBufferEnd_, 0);
            this.inBufferEnd_ += len;
        } else {
            //console.log(this.inBuffer_);
            //console.log(data);
            var tmpInBuffer = Buffer.alloc(this.inBuffer_.length + this.chunkLen_);
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
        return true;
    };

    QtpMessageClient.prototype.send = function (type, data) {
        console.log("send a request: msgtype=%d", type);
        var header = Buffer.alloc(12, 0);
        switch (type) {
            case QtpConstant.MSG_TYPE_LOGIN:
                header.writeUInt16LE(0x0002, 2);
                //header.writeUInt32LE(0x00000014, 8);
                break;
            case QtpConstant.MSG_TYPE_LOGOUT:
                //todo
                break;
            case QtpConstant.MSG_TYPE_ALERT_TYPE:
                header.writeUInt16LE(QtpConstant.MSG_TYPE_ALERT_TYPE, 2);
                //todo
                break;
            case QtpConstant.MSG_TYPE_TOPLIST:
                header.writeUInt16LE(QtpConstant.MSG_TYPE_TOPLIST, 2);
                break;
            case QtpConstant.MSG_TYPE_ALERT_SUB:
                header.writeUInt16LE(QtpConstant.MSG_TYPE_ALERT_SUB, 2);
                break;
            case QtpConstant.MSG_TYPE_TOPLIST:
                //
                break;
            case QtpConstant.MSG_TYPE_HEARTBEAT:
                //
                break;
            default:
                console.log('unknown request type!');
                break;
        }

        if (data) {
            var content = Buffer.from(JSON.stringify(data));
            header.writeUInt32LE(content.length, 8);
            var total = Buffer.concat([header, content], header.length + content.length);
            this.clientSock_.send(total);
            total = null;
            content = null;
        } else {
            this.clientSock_.send(header);
        }
        header = null;
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

        const copystr = JSON.parse(obj, function(k, v) {
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
            return null; // a uncomplete msg;
        }
        //read msg header;
        var header = this.readHeader();

        if (contentLen < this.headerLen_ + header.datalen) {
            console.log("wait for more buffer, actual len: %d, expect len: %d"
                , contentLen, this.headerLen_ + header.datalen);
            return null; // a uncomplete msg;
        }

        switch (header.type) {
            case QtpConstant.MSG_TYPE_LOGIN_ANSWER:
                console.info("Received Login_Ansewer Msg ,type: %d", header.type);
                break;
            case QtpConstant.MSG_TYPE_ALERT_TYPE_ANSER:
                console.info("Received a ALERT_TYPE_ANSER Msg, type: %d", header.type);
                break;
            case QtpConstant.MSG_TYPE_TOPLIST_ANSWER:
                console.info("Received a Toplist Msg, datalen: type: %d", header.type);
                break;
            case QtpConstant.MSG_TYPE_ALERT_RESULT:
                console.info("Received a Alert_RESULT Msg, datalen: type: %d", header.type);
                break;
            case QtpConstant.MSG_TYPE_ALERT_ANSWER:
                console.info("Received a ALERT_ANSWER Msg, datalen: type: %d", header.type);
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

        for (var idx in this.listeners_) {
            if (this.listeners_[idx].type == header.type) {

                this.listeners_[idx].callback(res);
            }
        }

        //return {type: msgtype, result: res};
    };

    QtpMessageClient.prototype.addListener = function (ptype, pcallback) {
        this.listeners_.push({ type: ptype, callback: pcallback });
    }

    QtpMessageClient.prototype.stop = function () {
        this.clientSock_.close();
        this.clientSock_ = null;
        clearInterval(this.eventHandle_);
        this.inBuffer_ = null;
        this.inBuffer_ = Buffer.alloc(this.chunkLen_, 0);
        this.inBufferBeg_ = this.inBufferEnd_ = 0;
    }

    var getInstance = (function () {
        var qtpclient = new QtpMessageClient();
        qtpclient.connectTo('172.24.10.35', '9005');
        return function () {
            return qtpclient;
        }
    })();

    //console.log(typeof getInstance);
    module.exports.getInstance = getInstance;
}).call(this);