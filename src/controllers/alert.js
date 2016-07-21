/**
 * controller for toplist
 */

//const { QtpConstant, QtpMessageClient } = require('../services/qtpmessage');
//const Qtp = require('../services/qtpmessage');
jQuery = $ = require('../../resource/js/jquery.min.js');

require("../../resource/js/angular.js")
require("../../resource/js/semantic.js")
require("../../resource/js/contextMenu.js")
require("../../resource/js/angular-tree-control.js")
const QtpConstant = require('../models/qtpmodel').QtpConstant;
const IPCMSG = require('../models/qtpmodel').IPCMSG;
const electron = require('electron');
const fs = require('fs');

angular.module('app_alert', ['treeControl', 'ui.bootstrap.contextMenu'])
    .controller('c_parent', ['$scope', function ($scope) {
        // $scope.$on("alert_change", function (e, alerts, formats) {
        //     $scope.$broadcast("alert_pub", alerts, formats);
        // });
        // }])
        //.controller('c_treeview', ['$scope', '$interval', function ($scope, $interval) {
        $scope.stockheaders = ['股票代码', '股票名称'];
        $scope.codes1 = [];
        $scope.bAllSelect = false;
        $scope.dataForTheTree = {};
        var configContent = null;

        $scope.toggleAll = function () {
            for (var i = 0; i < $scope.codes1.length; ++i) {
                $scope.codes1[i].checked = $scope.bAllSelect;
            }
            saveConfig();
        };

        $scope.toggle = function (item) {
            if (!item.checked) {
                $scope.bAllSelect = false;
            }
            else {
                var allSelected = true;
                for (var i = 0; i < $scope.codes1.length; i++) {
                    if (!$scope.codes1[i].checked) {
                        allSelected = false;
                        break;
                    }
                }
                $scope.bAllSelect = allSelected;
            }

            saveConfig();
        };

        var frontListenerObj = null;

        $scope.menuOptions = [
            ['返回', function ($itemScope) {
                angular.element(document.getElementById("tv_alert")).removeClass("future").addClass("current");
                angular.element(document.getElementById("tb_alert")).removeClass("current").addClass("future");
                electron.ipcRenderer.removeListener(IPCMSG.FrontendPoint, frontListenerObj);
            }],
        ];

        var reqobj = {
            reqno: 1,
            msgtype: QtpConstant.MSG_TYPE_ALERT_TYPE
        };

        var configFileName = null;

        electron.ipcRenderer.on('config', function (event, arg) {
            console.log(arg);
            configFileName = arg.curName;
            if (typeof arg.lastName != 'undefined') {
                try {
                    configContent = require('../../winconfig/' + arg.lastName);
                    fs.rename('./winconfig/' + arg.lastName, './winconfig/' + arg.curName, function (e) { console.log(e, 'rm oldfile') });
                    $scope.codes1 = configContent.codes;

                    for (var i = 0; i < $scope.codes1.length; ++i) {
                        $scope.codes1[i].checked = configContent.codesCheck[i];
                    }
                } catch (e) {
                    configContent = null;
                }
            }

            electron.ipcRenderer.send(IPCMSG.BackendPoint, reqobj);
        });

        var getTreeConfig = function (nodes, obj) {
            for (var i in nodes) {
                if (nodes[i].alertid == obj.alertid) {
                    obj.check = nodes[i].check;
                    break;
                }

                if (nodes[i].children && nodes[i].children.length != 0)
                    getTreeConfig(nodes[i].children, obj);

                if (typeof obj.check != 'undefined')
                    break;
            }
        }

        //qtpclient.connectTo('172.24.10.35', 9005);
        //qtpclient.send(QtpConstant.MSG_TYPE_ALERT_TYPE, reqobj);
        //Qtp.getInstance().send(QtpConstant.MSG_TYPE_ALERT_TYPE, reqobj);
        //Qtp.getInstance().addListener(QtpConstant.MSG_TYPE_ALERT_TYPE_ANSER, function (data) {

        electron.ipcRenderer.once(IPCMSG.FrontendPoint, function (event, data) {
            if (data == null) {
                console.error('no data');
                return;
            }

            //console.log(data.alerttype, configContent);
            var dataForTheTree = new Object();
            var superType = new Array();
            var curalert = null;

            for (var idx in data.alerttype) {
                curalert = data.alerttype[idx];
                if (superType.indexOf(curalert.format) < 0) { // not found
                    var superobj = new Object();
                    superobj.name = curalert.faname;
                    superobj.alertid = curalert.format;
                    if (configContent != null)
                        getTreeConfig(configContent.node, superobj);

                    if (typeof superobj.check == 'undefined') {
                        superobj.check = false;
                    }
                    superobj.children = new Array();
                    dataForTheTree[curalert.format] = superobj;
                    superobj = null;
                    superType.push(curalert.format);
                }

                var subObj = new Object();
                subObj.name = curalert.name;
                subObj.alertid = curalert.alert;
                if (configContent != null)
                    getTreeConfig(configContent.node, subObj);

                if (typeof subObj.check == 'undefined') {
                    subObj.check = false;
                }
                subObj.children = new Array();
                dataForTheTree[curalert.format].children.push(subObj);
            }

            superType = null; //unref
            curalert = null; //unref

            var temp = new Array();
            $scope.$apply(function () {
                //temp.length = 0;
                for (var prop in dataForTheTree) {
                    temp.push(dataForTheTree[prop]);
                }

                $scope.dataForTheTree = temp;
            });

            temp = null;
            dataForTheTree = null;

            if(configContent != null && configContent.hasSub){
                $scope.subAlerts();
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
        //var inode = -1;
        $scope.showSelected = function (node, selected) {
            // inode = $scope.dataForTheTree.indexOf(node);
            // if(inode < 0){
            //     return;
            // }

            // node = $scope.dataForTheTree[inode];
            if (node.children.length > 0) { // 目前只支持二级菜单
                for (var idx in node.children) {
                    node.children[idx].check = node.check;
                }
            }

            saveConfig();
            //console.log($scope.dataForTheTree);            
        };

        var alertset = new Array();
        var formatset = new Array();

        $scope.subAlerts = function () {
            //alertset.length = 0;
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

            //alert(alertset.join());
            //$scope.$emit("alert_change", alertset, formatset);
            alert_pub(alertset, formatset);
            saveConfig();
        };

        // var temp = new Array();
        // $interval(function () {
        //     temp.length = 0;
        //     for (var prop in dataForTheTree) {
        //         temp.push(dataForTheTree[prop]);
        //     }

        //     $scope.dataForTheTree = temp;
        // }, 1000);
        //}])
        //.controller('c_alert', ['$scope', '$interval', function ($scope, $interval) {
        var bigBuyAlert = {
            reqno: 1,
            msgtype: QtpConstant.MSG_TYPE_ALERT_SUB,
            filter: []
        };

        var temparg = undefined;
        electron.ipcRenderer.on('backend_change', function (e, arg) {

            $scope.$apply(function () {
                for (var i = 0; i < $scope.codes1.length; ++i) {
                    for (var j = 0; j < arg.codes.detail.length; ++j) {
                        if ($scope.codes1[i][0] == arg.codes.detail[j][0]) {
                            arg.codes.detail[j]['checked'] = $scope.codes1[i].checked;
                            break;
                        }
                    }
                }

                $scope.codes1 = arg.codes.detail;

                $scope.bAllSelect = true;
                for (var i = 0; i < $scope.codes1.length; ++i) {
                    if (!$scope.codes1[i].checked) {
                        $scope.bAllSelect = false;
                        break;
                    }
                }
            })

            console.log(arg);
            temparg = arg;
        });

        $scope.headers = ['时间', '股票代码', '股票名称', '信号类型', '数量'];
        var codes = [];
        // alert(qtpclient.alertset);
        // var qtpMsgClt = new QtpMessageClient();
        // qtpMsgClt.connectTo('172.24.10.35', '9005');
        //$scope.$on("alert_pub", function (e, alerts, formats) {
        var alert_pub = function (alerts, formats) {

            angular.element(document.getElementById("tv_alert")).removeClass("current").addClass("future");
            angular.element(document.getElementById("tb_alert")).removeClass("future").addClass("current");

            bigBuyAlert.alertset = alerts;

            if (frontListenerObj == null) {
                frontListenerObj = new frontListener(alerts, formats);
                electron.ipcRenderer.send(IPCMSG.BackendPoint, bigBuyAlert);
            }

            //Qtp.getInstance().send(QtpConstant.MSG_TYPE_ALERT_SUB, bigBuyAlert);
            //Qtp.getInstance().addListener(QtpConstant.MSG_TYPE_ALERT_ANSWER, function (res) {

            electron.ipcRenderer.on(IPCMSG.FrontendPoint, frontListenerObj);
        };

        var saveConfig = function () {
            if (configContent == null)
                configContent = {};
            configContent.codes = $scope.codes1;
            configContent.codesCheck = [];
            for (var i = 0; i < $scope.codes1.length; ++i) {
                configContent.codesCheck.push($scope.codes1[i].checked);
            }

            configContent.node = $scope.dataForTheTree;
            configContent.hasSub = angular.element(document.getElementById("tv_alert")).hasClass("future");
            fs.writeFile("./winconfig/" + configFileName, JSON.stringify(configContent), function (err) {
                if (err) {
                    console.log(err);
                }
            });
        };

        var frontListener = function (alerts, formats) {

            return function (event, res) {
                //console.log(res);
                if (res == undefined || res == null || res.code == undefined) {
                    console.log('invalid alert!');
                    return;
                }
                var idx = -1;
                if ((idx = bigBuyAlert.alertset.indexOf(res.alertid)) < 0) {
                    console.log(res);
                    return;
                }

                if (temparg.bEnable && temparg.codes.codes.indexOf(res.code) < 0) {
                    console.log(res);
                    console.log('a unsubscribed stock code, %s!', res.code);
                    return;
                }

                if (temparg.bEnable) {
                    var isCodeSelected = false;
                    for (var i = 0; i < $scope.codes1.length; ++i) {
                        if (res.code == $scope.codes1[i][0]) {
                            isCodeSelected = $scope.codes1[i].checked;
                            break;
                        }
                    }

                    if (!isCodeSelected) {
                        return;
                    }
                }

                var codeinfo = new Object();
                var raisetime = res.time.toString();
                codeinfo.raisetime = raisetime.length < 9 ? '0' + raisetime : raisetime;
                codeinfo.raisetime = codeinfo.raisetime.slice(0, 2) + ':' + codeinfo.raisetime.slice(2, 4) + ':' + codeinfo.raisetime.slice(4, 6);
                codeinfo.codeid = res.code;
                codeinfo.codename = res.cnname;
                codeinfo.alertname = res.alertname;
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
                if (codes.length == 100) {
                    codes.pop();
                }
                codes.unshift(codeinfo);
                //
                $scope.$apply(function () {
                    $scope.codes = codes;
                });
            };
        }
    }]);