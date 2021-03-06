/**
 * controller for toplist
 */

//const { QtpConstant, QtpMessageClient } = require('../services/qtpmessage');
//const Qtp = require('../services/qtpmessage');
window.$ = window.jQuery = require("../../resource/js/jquery.min.js");
require("../../resource/js/bootstrap.min.js");
require("../../resource/js/angular.js");
require("../../resource/js/semantic.js");
require("../../resource/js/angular-tree-control.js");
const QtpConstant = require('../models/qtpmodel').QtpConstant;
const IPCMSG = require('../models/qtpmodel').IPCMSG;
const remote = require('electron').remote;
const ipcRenderer = require('electron').ipcRenderer;
const fs = require('fs');
const userDir = remote.app.getPath("userData");

angular.module('app_alert', ['treeControl'])
    .controller('c_parent', ['$scope', function ($scope) {

        $scope.stockheaders = ['股票代码', '股票名称'];
        $scope.codes1 = [];
        $scope.bAllSelect = false;
        $scope.dataForTheTree = {};
        $scope.timeItemSel = true;
        $scope.equitCodeItemSel = false;
        $scope.equitNameItemSel = true;
        $scope.signalTypeItemSel = true;
        $scope.VolumeItemSel = true;
        $scope.fontsize = "td-font-lg";
        //$scope.clSlide ="slide future";

        var showSecond = true;
        var showSlide = true;
        var configContent = null;
        // 切换全选, 非全选
        $scope.toggleAll = function () {
            for (var i = 0; i < $scope.codes1.length; ++i) {
                $scope.codes1[i].checked = $scope.bAllSelect;
            }
            saveConfig();
        };
        // 切换选中
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
        var temparg = null;
        
        var template = [
                {
                    label: '返回',
                    click: function () {

                         angular.element(document.getElementById("tv_alert")).removeClass("future").addClass("current");
                         angular.element(document.getElementById("tb_alert")).removeClass("current").addClass("future");
                         ipcRenderer.removeListener(IPCMSG.FrontendPoint, frontListenerObj);
                         saveConfig();
                    }         
                },

                {
                    label: '置顶',
                    type: 'checkbox',
                    click: function (item, focusedWindow) {
                         //ipcRenderer.send('set-window-top' + temparg.winID, item.checked);
                         focusedWindow.setAlwaysOnTop(item.checked);
                    }         
                },

                {type: 'separator'},
                {
                    label: '字体小',
                    type: 'radio',
                    click: function (item, focusedWindow) {
                          $scope.fontsize = "td-font-xs";
                    }         
                },

                {
                    label: '字体中',
                    type: 'radio',
                    click: function (item, focusedWindow) {
                        $scope.fontsize = "td-font-sm";
                    }         
                },
                {
                    label: '字体大',
                    type: 'radio',
                    checked: true,
                    click: function (item, focusedWindow) {
                        $scope.fontsize = "td-font-lg";
                    }         
                },

                {type: 'separator'},
                {
                    label: '时间',
                    type: 'checkbox',
                    checked: true,
                    click: function (item, focusedWindow) {
                      $scope.timeItemSel = !$scope.timeItemSel;
                    },
                     
                },

                {
                    label: '代码',
                    type: 'checkbox',
                    checked: false,
                    click: function (item, focusedWindow) {
                     $scope.equitCodeItemSel = !$scope.equitCodeItemSel;
                    }         
                },

                {
                    label: '名称',
                    type: 'checkbox',
                    checked: true,
                    click: function (item, focusedWindow) {
                      $scope.equitNameItemSel = !$scope.equitNameItemSel;
                    }         
                },

                {
                    label: '类型',
                    type: 'checkbox',
                    checked: true,
                    click: function (item, focusedWindow) {
                      $scope.signalTypeItemSel =!$scope.signalTypeItemSel;
                    }         
                },

                {
                    label: '数量',
                    type: 'checkbox',
                    checked: true,
                    click: function (item, focusedWindow) {
                      $scope.VolumeItemSel =!$scope.VolumeItemSel;
                    }         
                },
                {type: 'separator'},

                {
                    label: '显示秒',
                    type: 'checkbox',
                    checked: true,
                    click: function (item, focusedWindow) {
                        showSecond =!showSecond;
                    }
                },
                {
                    label: '滚动条',
                    type: 'checkbox',
                    checked: true,
                    click: function (item, focusedWindow) {
                        showSlide =!showSlide;
                       // console.log("滚动条",showSlide);
                        if(showSlide){
                            //this.label='隐藏滚动条';
                           angular.element(document.getElementById("tb_alert")).removeClass("slides").addClass("slide");
                        }
                        else{
                            //this.label='显示滚动条';
                           angular.element(document.getElementById("tb_alert")).removeClass("slide").addClass("slides");

                        }
                    }
                }
                
        ];
        
        (function() {
            const menu = remote.Menu.buildFromTemplate(template);
            var alertWin=document.getElementById('tb_alert');
            alertWin.addEventListener('contextmenu', function(e) {
                     e.preventDefault();
                     menu.popup(remote.getCurrentWindow());
            }, false);
        })();
        //setContextMenu();

        (function() {
            var alertWinHk=document.getElementById('tb_alert');
            alertWinHk.addEventListener('click', function(e) {
                     e.preventDefault(); 
                     alert('查看代码'); 
            }, false);
        })();

        var reqobj = {
            reqno: 1,
            msgtype: QtpConstant.MSG_TYPE_ALERT_TYPE
        };

        var configFileName = null;

        ipcRenderer.on('config', function (event, arg) {
            console.log(arg);
            configFileName = arg.curName;
            if (typeof arg.lastName != 'undefined') {
                try {
                    configContent = require(userDir + '/winconfig/' + arg.lastName);
                    fs.rename(userDir+'/winconfig/' + arg.lastName, userDir+'/winconfig/' + arg.curName, function (e) { console.log(e, 'rm oldfile') });
                    $scope.codes1 = configContent.codes;

                    for (var i = 0; i < $scope.codes1.length; ++i) {
                        $scope.codes1[i].checked = configContent.codesCheck[i];
                    }
                } catch (e) {
                    configContent = null;
                }
            }

            ipcRenderer.send(IPCMSG.BackendPoint, reqobj);
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

        ipcRenderer.once(IPCMSG.FrontendPoint, function (event, data) {
            if (data == null) {
                console.error('no data');
                return;
            }

            console.log(data, configContent);
            var dataForTheTree = new Object();
            var superType = new Array();
            var curalert = null;

            for (var idx in data.alerttype) {
                curalert = data.alerttype[idx];
                if (superType.indexOf(curalert.category) < 0) { // not found
                    var superobj = new Object();
                    superobj.name = curalert.faname;
                    superobj.alertid = curalert.category;
                    superobj.format = 0;
                    if (configContent != null)
                        getTreeConfig(configContent.node, superobj);

                    if (typeof superobj.check == 'undefined') {
                        superobj.check = false;
                    }
                    superobj.children = new Array();
                    dataForTheTree[curalert.category] = superobj;
                    superType.push(curalert.category);
                    superobj = null;
                }

                var subObj = new Object();
                subObj.name = curalert.name;
                subObj.alertid = curalert.alert;
                subObj.format = curalert.format;
                if (configContent != null)
                    getTreeConfig(configContent.node, subObj);

                if (typeof subObj.check == 'undefined') {
                    subObj.check = false;
                }

                if(typeof curalert.explain == 'undefined') {
                    curalert.explain = '';
                }

                subObj.explain = curalert.explain;

                subObj.children = new Array();
                dataForTheTree[curalert.category].children.push(subObj);
                subObj = null;
            }

            console.log(dataForTheTree);
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

            if (configContent != null && configContent.hasSub) {
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
        $scope.showSelected = function (node, selected) {
            if (node.children.length > 0) { // 目前只支持二级菜单
                for (var idx in node.children) {
                    node.children[idx].check = node.check;
                }
            }

            saveConfig();
        };

        $scope.subAlerts = function () {
            var alertset = new Array();
            var formatset = new Array();
            //alertset.length = 0;
            for (var i in $scope.dataForTheTree) {
                for (var j in $scope.dataForTheTree[i].children) {
                    if ($scope.dataForTheTree[i].children[j].check) {
                        alertset.push($scope.dataForTheTree[i].children[j].alertid);
                        formatset.push($scope.dataForTheTree[i].children[j].format); //formats;
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

        var bigBuyAlert = {
            reqno: 1,
            msgtype: QtpConstant.MSG_TYPE_ALERT_SUB,
            filter: []
        };

        ipcRenderer.on('backend_change', function (e, arg) {

            $scope.$apply(function () {
                for (var j = 0; j < arg.codes.detail.length; ++j) {
                    arg.codes.detail[j]['checked'] = false;
                    for (var i = 0; i < $scope.codes1.length; ++i) {
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

            //console.log(arg);
            temparg = arg;
        });

        var codes = [];
        var bSelectedCode = [];
        var alert_pub = function (alerts, formats) {

            angular.element(document.getElementById("tv_alert")).removeClass("current").addClass("future");
            angular.element(document.getElementById("tb_alert")).removeClass("future").addClass("current");

            bigBuyAlert.alertset = alerts;
            bigBuyAlert.reqno = -1;
            bSelectedCode = [];

            for (var i = 0; i < $scope.codes1.length; ++i) {
                if ($scope.codes1[i].checked) {
                    bSelectedCode.push($scope.codes1[i][0]);
                }
            }

            if (frontListenerObj == null) {
                frontListenerObj = new frontListener(alerts, formats);
                bigBuyAlert.reqno = 1;// 第一次send，=1；非第一次，=-1，防止主程序创建多个监听回调
            }

            ipcRenderer.send(IPCMSG.BackendPoint, bigBuyAlert);
            ipcRenderer.on(IPCMSG.FrontendPoint, frontListenerObj);
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
            fs.writeFile(userDir + "/winconfig/" + configFileName, JSON.stringify(configContent), function (err) {
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
                    //console.log(res);
                    return;
                }

                if (temparg.bEnable && temparg.codes.codes.indexOf(res.code) < 0) {
                    //console.log(res);
                    //console.log('a unsubscribed stock code, %s!', res.code);
                    return;
                }

                if (bSelectedCode.length > 0 && bSelectedCode.indexOf(res.code) < 0) {
                    console.log('a unselected stock code, %s!', res.code);
                    return;
                }

                var codeinfo = new Object();
                var raisetime = res.time.toString();
                codeinfo.raisetime = raisetime.length < 9 ? '0' + raisetime : raisetime;
                codeinfo.raisetime = codeinfo.raisetime.slice(0, 2) + ':' + codeinfo.raisetime.slice(2, 4)  + (showSecond ? ":"+codeinfo.raisetime.slice(4, 6) : "");
                codeinfo.codeid = res.code;
                codeinfo.codename = res.cnname;
                codeinfo.alertname = res.alertname;
                codeinfo.quantity = res.detailed;
                // switch (formats[idx]) {
                //     case 1000:
                //         codeinfo.quantity = res.quantity;
                //         break;
                //     case 1001:
                //         codeinfo.quantity = (res.quantity / 100).toString() + '%';
                //         break;
                //     case 1002:
                //         codeinfo.quantity = res.quantity / 10000;
                //         break;
                //     default:
                //         codeinfo.quantity = res.quantity;
                //         break;
                // }
                // 颜色配置
                switch (res.alertcolor) {
                    case 1:
                        codeinfo.color = 'red';
                        break;
                    case -1:
                        codeinfo.color = 'green';
                        break;
                    default:
                        codeinfo.color = 'yellow';
                }
                // magic number 100, 目前实际上最多显示100条信号，采用的式先进先出。
                if (codes.length == 100) {
                    codes.shift();
                }
                codes.push(codeinfo);

                $scope.$apply(function () {
                    $scope.codes = codes;
                });

                var ele = document.getElementById("tb_alert");
                ele.scrollTop = ele.scrollHeight;
            };
        }
    }]);
