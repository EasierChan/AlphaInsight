/**
 * controller for toplist
 */
'use strict';

const { QtpConstant, QtpMessageClient } = require('../services/qtpmessage');

angular.module('app_toplist', ['treeControl'])
    .service('qtpclient', function () {
        var qtpMsgClt = new QtpMessageClient();
        qtpMsgClt.connectTo('172.24.10.35', '9005');
        this.getInstance = () => {
            return qtpMsgClt;
        }

    })
    .controller('c_parent', function ($scope) {
        $scope.$on("alert_change", (e, data) => {
            $scope.$broadcast("alert_pub", data);
        });
    })
    .controller('c_treeview', function ($scope, $interval, qtpclient) {
        var reqobj = {
            reqno: 1,
            msgtype: 4
        };

        var dataForTheTree = new Object();
        var superType = new Array();
        var curalert = null;

        qtpclient.getInstance().send(QtpConstant.MSG_TYPE_ALERT_TYPE, reqobj);
        qtpclient.getInstance().addListener(QtpConstant.MSG_TYPE_ALERT_TYPE_ANSER, (data) => {
            if (data == null) {
                console.error('no data');
                return;
            }
            console.log(data);
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
        $scope.subAlerts = () => {
            alertset.length = 0;
            for (var i in $scope.dataForTheTree) {
                for (var j in $scope.dataForTheTree[i].children) {
                    if ($scope.dataForTheTree[i].children[j].check) {
                        alertset.push($scope.dataForTheTree[i].children[j].alertid);
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
            $scope.$emit("alert_change", alertset);
        };

        var temp = new Array();
        $interval(() => {
            temp.length = 0;
            for (var prop in dataForTheTree) {
                temp.push(dataForTheTree[prop]);
            }

            $scope.dataForTheTree = temp;
        }, 1000);
    })
    .controller('c_toplist', function ($scope, $interval, qtpclient) {
        var bigBuyAlert = {
            reqno: 1,
            msgtype: QtpConstant.MSG_TYPE_ALERT_SUB,
            filter: []
        };

        $scope.headers = ['信号ID','股票代码','股票名称', '时间', '数量'];
        var codes = [];
        // alert(qtpclient.alertset);
        // var qtpMsgClt = new QtpMessageClient();
        // qtpMsgClt.connectTo('172.24.10.35', '9005');
        $scope.$on("alert_pub", (e, alerts) => {
            bigBuyAlert.alertset = alerts;
            qtpclient.getInstance().send(QtpConstant.MSG_TYPE_ALERT_SUB, bigBuyAlert);
            qtpclient.getInstance().addListener(QtpConstant.MSG_TYPE_ALERT_ANSWER, (res) => {
                if (res == undefined || res == null || res.code == undefined)
                    return;
                console.log(res);
                var codeinfo = new Object();
                codeinfo.alertid = res.alert;
                codeinfo.codeid = res.code;
                codeinfo.codename = res.cnname;
                codeinfo.raisetime = res.time;
               
                codeinfo.quantity = res.quantity;
                if (codes.length == 10) {
                    codes.shift();
                }
                codes.push(codeinfo);
            });

            $interval(() => {
                $scope.codes = codes;
            }, 1000);
        });
    });