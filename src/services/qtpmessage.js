(function () {
    'use strict';

    const net = require('net');
    const stream = require('stream');

    function TcpClient(mresolver) {
        this.sock = null;
        this.connectTo = (server_ip, server_port) => {
            this.sock = net.connect({ port: server_port, host: server_ip }, () => {
                console.log('succeed connected to server: ' + this.sock.remoteAddress);
            });

            this.sock.on('data', (data) => {
                console.log("Received a message: msglen = %d", data.length);
                if (mresolver.setInBuffer(data) === false) {
                    console.log('Warning: NetWork data length reached the limit!');
                    this.sock.pause();
                    setTimeout(() => {
                        this.sock.resume();
                    }, 1000);
                }
            });

            this.sock.on('end', () => {
                console.log('disconnected from server: ' + this.sock.remoteAddress);
                this.sock = null;
                mresolver.stop();
            });

            this.sock.on('close', (had_error) => {
                if (had_error) {
                    console.error('raise a transimssion error');
                }
            });

            return true;
        };


        this.send = (data, callback) => {
            this.sock.write(data);
            if (callback) {
                callback();
            }
        };
    }

    var QtpConstant = {
        MSG_TYPE_LOGIN: 1,
        MSG_TYPE_LOGIN_ANSWER: 2,
        MSG_TYPE_LOGOUT: 3,
        MSG_TYPE_ALERT_TYPE: 4,
        MSG_TYPE_ALERT_TYPE_ANSER: 5,
        MSG_TYPE_ALERT_SUB: 6,
        MSG_TYPE_ALERT_RESULT: 7,
        MSG_TYPE_ALERT_ANSWER: 8,
        MSG_TYPE_ALERT_CANCLE: 9,
        MSG_TYPE_TOPLIST: 10,
        MSG_TYPE_TOPLIST_ANSWER: 11,
        MSG_TYPE_HEARTBEAT: 12,
        MSG_TYPE_NONE: -1
    };

    function QtpMessageClient() {
        this.clientSock = new TcpClient(this);
        this.maxLen = 1024 * 1024;
        this.msgtype = 0;
        this.datalen = 0;
        this.headerLen = 12;
        this.chunkLen = 4 * 1024;
        this.inBuffer = Buffer.alloc(this.chunkLen, 0);
        this.inBufferBeg = 0;
        this.inBufferEnd = 0;
        this.eventHandle = undefined;

        this.connectTo = (ip, port) => {
            return this.clientSock.connectTo(ip, port);
        };

        this.setInBuffer = (data) => {

            if (this.inBufferEnd + data.length <= this.chunkLen) {
                var len = data.copy(this.inBuffer, this.inBufferEnd, 0);
                this.inBufferEnd += len;
            } else {
                //console.log(this.inBuffer);
                //console.log(data);
                var temp = this.chunkLen > this.inBufferEnd ? this.chunkLen - this.inBufferEnd : 0;
                var tmpInBuffer = Buffer.alloc(this.inBuffer.length + this.chunkLen);
                var orginlen = this.inBuffer.copy(tmpInBuffer, 0, this.inBufferBeg, this.inBufferEnd);
                var datalen = data.copy(tmpInBuffer, orginlen);
                this.inBufferBeg = 0;
                this.inBufferEnd = orginlen + datalen;
                this.inBuffer = null;
                this.inBuffer = tmpInBuffer;
                tmpInBuffer = null;
                /*
                if (temp > 0) {
                    data.copy(this.inBuffer, this.inBufferEnd, 0, temp);
                    this.inBufferEnd += data.length;
                    this.inBuffer = Buffer.concat([this.inBuffer, data.slice(temp)], this.inBufferEnd);
                } else {
                    this.inBufferEnd += data.length;
                    this.inBuffer = Buffer.concat([this.inBuffer, data], this.inBufferEnd);
                }*/
            }

            if (this.inBufferEnd > this.maxLen) { /** could set the length as a configuration */
                return false;
            }

            console.log(this.inBufferBeg, this.inBufferEnd);
            return true;
        };

        this.send = (type, data) => {
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
                this.clientSock.send(total);
                total = null;
                content = null;
            } else {
                this.clientSock.send(header);
            }
            header = null;
        };

        this.readHeader = () => {
            var version = this.inBuffer.readUInt8(this.inBufferBeg + 0);
            var service = this.inBuffer.readUInt8(this.inBufferBeg + 1);
            this.msgtype = this.inBuffer.readUInt16LE(this.inBufferBeg + 2);
            var topic = this.inBuffer.readUInt16LE(this.inBufferBeg + 4);
            var optslen = this.inBuffer.readUInt16LE(this.inBufferBeg + 6);
            this.datalen = this.inBuffer.readUInt32LE(this.inBufferBeg + 8);
            //console.log("beg: %d; datalen: %d", this.inBufferBeg, this.datalen);
        };

        this.readContent = () => {
            //send top list to front
            var obj = JSON.stringify(this.inBuffer.slice(this.inBufferBeg + this.headerLen
                , this.inBufferBeg + this.headerLen + this.datalen));

            const copystr = JSON.parse(obj, (k, v) => {
                return v && v.type === 'Buffer'
                    ? Buffer.from(v.data)
                    : v;
            });

            if (copystr.length == 0) {
                return null;
            }

            return JSON.parse(copystr.toString());
        };

        this.resolve = () => {
            var contentLen = this.inBufferEnd - this.inBufferBeg;
            if (contentLen < this.headerLen) {
                console.log('wait for a message!');
                return null; // a uncomplete msg;
            }
            //read msg header;
            this.readHeader();

            if (contentLen < this.headerLen + this.datalen) {
                console.log("wait form more buffer, actual len: %d, expect len: %d"
                    , contentLen, this.headerLen + this.datalen);
                return null; // a uncomplete msg;
            }

            switch (this.msgtype) {
                case QtpConstant.MSG_TYPE_TOPLIST_ANSWER:
                    console.info("Received a Toplist Msg, datalen: %d", this.datalen);
                    break;
                case QtpConstant.MSG_TYPE_ALERT_RESULT:
                    console.info("Received a Alert_RESULT Msg, datalen: %d", this.datalen);
                    break;
                case QtpConstant.MSG_TYPE_ALERT_ANSWER:
                    console.info("Received a ALERT_ANSWER Msg, datalen: %d", this.datalen);
                    break;
                default:
                    console.info("Received a Unknown Msg, datalen: %d, msgtype: %d", this.datalen, this.msgtype);
                    break;
            }

            var res = this.readContent();

            this.inBufferBeg += this.headerLen + this.datalen;

            if (this.inBufferBeg > this.chunkLen) {
                this.inBuffer.copy(this.inBuffer, 0, this.inBufferBeg);
                this.inBufferEnd -= this.inBufferBeg;
                this.inBufferBeg = 0;
            }

            return res;
        };

        this.onEvent = (callback) => {
            this.eventHandle = setInterval(() => {
                var res = this.resolve();
                callback(res);
            }, 1000);
        };

        this.stop = () => {
            this.clientSock = null;
            clearInterval(this.eventHandle);
            this.inBuffer = null;
            this.inBuffer = Buffer.alloc(this.chunkLen, 0);
            this.inBufferBeg = this.inBufferEnd = 0;
        }
        //setInterval(this.resolve, 1000);
    }

    module.exports = { QtpConstant, QtpMessageClient };
}).call(this);