/**
 * controller for toplist
 */
'use strict';

const { QtpConstant, QtpMessageClient } = require('../services/qtpmessage');

angular.module('app_toplist', [])
    .controller('c_toplist', function ($scope, $interval) {
        var bigBuyAlert = {
            reqno: 1,
            msgtype: QtpConstant.MSG_TYPE_ALERT_SUB,
            alertset: [1],
            filter: []
        };
        
        $scope.headers = ['股票代码', '时间', '数量'];
        var codes = [];
        
        var qtpMsgClt = new QtpMessageClient();
        qtpMsgClt.connectTo('172.24.10.35', '9005');
        qtpMsgClt.send(QtpConstant.MSG_TYPE_ALERT_SUB, bigBuyAlert);
        qtpMsgClt.onEvent((res) => {
            if (res == undefined || res == null || res.code == undefined)
                return;
            console.log(res);
            var codeinfo = new Object();
            codeinfo.codeid = res.code;
            codeinfo.raisetime = res.time;
            codeinfo.quantity = res.quantity;
            if(codes.length == 5){
                codes.shift();
            }
            codes.push(codeinfo);
        });
        
        //$scope.codeid = '000001';
        $interval(()=>{
            $scope.codes = codes;
        }, 1000);
    });