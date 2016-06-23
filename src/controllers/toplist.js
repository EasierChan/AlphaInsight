/**
 * controller for toplist
 */
'use strict';

//const { QtpConstant, QtpMessageClient } = require('../services/qtpmessage');
const Qtp = require('../services/qtpmessage');
const QtpConstant = require('../models/qtpmodel');

angular.module('app_toplist', ['treeControl'])
    .controller('c_parent', ['$scope', function ($scope) {
        $scope.$on("alert_change", function (e, alerts, formats) {
            $scope.$broadcast("alert_pub", alerts, formats);
        });
    }])
    .controller('c_treeview', ['$scope','$interval',function ($scope, $interval) {
        var reqobj = {
            reqno: 1,
            msgtype: QtpConstant.MSG_TYPE_ALERT_TYPE
        };

        var dataForTheTree = new Object();
        var superType = new Array();
        var curalert = null;
        //qtpclient.connectTo('172.24.10.35', 9005);
        //qtpclient.send(QtpConstant.MSG_TYPE_ALERT_TYPE, reqobj);
        Qtp.getInstance().send(QtpConstant.MSG_TYPE_ALERT_TYPE, reqobj);
        Qtp.getInstance().addListener(QtpConstant.MSG_TYPE_ALERT_TYPE_ANSER, function (data) {
            if (data == null) {
                console.error('no data');
                return;
            }
            //console.log(data);
            console.log(data.alerttype);
            for (var idx in data.alerttype) {
                curalert = data.alerttype[idx];
                if (superType.indexOf(curalert.format) < 0) { // not found
                    var superobj = new Object();
                    superobj.check = false;
                    superobj.name = curalert.faname;
                    superobj.alertid = curalert.format;
                    superobj.children = new Array();
                    dataForTheTree[curalert.format] = superobj;
                    superobj = null;
                    superType.push(curalert.format);
                }

                var subObj = new Object();
                subObj.check = false;
                subObj.name = curalert.name;
                subObj.alertid = curalert.alert;
                subObj.children = new Array();
                dataForTheTree[curalert.format].children.push(subObj);
            }
        });

        $scope.treeOptions = {
            nodeChildren: "children",
            dirSelectable: true,
            injectClasses: {
                ul: "a1",
                li: "a2",
                liSelected: "a7",
                iExpanded: "a3",
                iCollapsed: "a4",
                iLeaf: "a5",
                label: "a6",
                labelSelected: "a8"
            },
            multiSelection: true
        };

        $scope.selectedNodes = [];
        $scope.showSelected = function (node, selected) {
            if (node.children.length > 0) { // 目前只支持二级菜单
                for (var idx in node.children) {
                    node.children[idx].check = node.check;
                }
            }

        };

        var alertset = new Array();
        var formatset = new Array();
        $scope.subAlerts = function () {
            alertset.length = 0;
            for (var i in $scope.dataForTheTree) {
                for (var j in $scope.dataForTheTree[i].children) {
                    if ($scope.dataForTheTree[i].children[j].check) {
                        alertset.push($scope.dataForTheTree[i].children[j].alertid);
                        formatset.push($scope.dataForTheTree[i].alertid); //formats;
                    }
                }
            }

            //console.log(angular.element(document.getElementById("tv_alert")));
            if (alertset.length == 0) {
                alert("未订阅信号！");
                return;
            }
            angular.element(document.getElementById("tv_alert")).removeClass("current").addClass("future");
            angular.element(document.getElementById("tb_alert")).removeClass("future").addClass("current");
            //alert(alertset.join());
            $scope.$emit("alert_change", alertset, formatset);
        };

        var temp = new Array();
        $interval(function () {
            temp.length = 0;
            for (var prop in dataForTheTree) {
                temp.push(dataForTheTree[prop]);
            }

            $scope.dataForTheTree = temp;
        }, 1000);
    }])
    .controller('c_toplist', ['$scope', '$interval', function ($scope, $interval) {
        var bigBuyAlert = {
            reqno: 1,
            msgtype: QtpConstant.MSG_TYPE_ALERT_SUB,
            filter: []
        };
        const fs = require('fs');
        var config_file = __dirname + "/../conf/user-stock.json";
        var care_codes = JSON.parse(fs.readFileSync(config_file));
        $scope.headers = ['时间', '信号类型', '股票代码', '股票名称', '数量'];
        var codes = [];
        // alert(qtpclient.alertset);
        // var qtpMsgClt = new QtpMessageClient();
        // qtpMsgClt.connectTo('172.24.10.35', '9005');
        $scope.$on("alert_pub", function (e, alerts, formats) {
            bigBuyAlert.alertset = alerts;
            Qtp.getInstance().send(QtpConstant.MSG_TYPE_ALERT_SUB, bigBuyAlert);
            Qtp.getInstance().addListener(QtpConstant.MSG_TYPE_ALERT_ANSWER, function (res) {
                if (res == undefined || res == null || res.code == undefined) {
                    console.log('invalid alert!');
                    return;
                }
                var idx = -1;
                if ((idx = bigBuyAlert.alertset.indexOf(res.alertid)) < 0 
                  || care_codes.indexOf(res.code) < 0) {
                    console.log(res);
                    console.log('a unsubscribed alert!');
                    return;
                }
                console.log(res);

                var codeinfo = new Object();
                var raisetime = res.time.toString();
                codeinfo.raisetime = raisetime.length < 9 ? '0' + raisetime : raisetime;
                codeinfo.raisetime = codeinfo.raisetime.slice(0, 2) + ':' + codeinfo.raisetime.slice(2, 4) + ':' + codeinfo.raisetime.slice(4, 6);
                codeinfo.alertname = res.alertname;
                codeinfo.codeid = res.code;
                codeinfo.codename = res.cnname;
                switch (formats[idx]) {
                    case 1000:
                        codeinfo.quantity = res.quantity;
                        break;
                    case 1001:
                        codeinfo.quantity = (res.quantity / 100).toString() + '%';
                        break;
                    case 1002:
                        codeinfo.quantity = res.quantity / 10000;
                        break;
                    default:
                        codeinfo.quantity = res.quantity;
                        break;
                }

                switch (res.alertcolor) {
                    case 1:
                        codeinfo.color = 'red';
                        break;
                    case -1:
                        codeinfo.color = 'green';
                        break;
                    default:
                        codeinfo.color = 'none';
                }
                if (codes.length == 10) {
                    codes.pop();
                }
                codes.unshift(codeinfo);
            });

            $interval(function () {
                $scope.codes = codes;
            }, 1000);
        });
    }]);