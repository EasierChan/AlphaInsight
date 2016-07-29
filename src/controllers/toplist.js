'use strict';

require("../../resource/js/contextMenu.js");
const ipcRenderer = require('electron').ipcRenderer;
const QtpConstant = require('../models/qtpmodel').QtpConstant;
const IPCMSG = require('../models/qtpmodel').IPCMSG;
const fs = require('fs');

angular.module("app_toplist", ['ui.bootstrap', 'ngAnimate', 'ui.bootstrap.contextMenu'])
    .controller('c_parent', ['$scope', function ($scope) {

        $scope.shareObject = new Object();
        $scope.shareObject.header = [];
        $scope.shareObject.columns = [];
        $scope.shareObject.rankMin = 1;
        $scope.shareObject.rankMax = 30;
        $scope.shareObject.curCode = "000001.sz";
        $scope.shareObject.bCurCheck = false;
        $scope.shareObject.normalTimer = null;
        $scope.shareObject.relateTimer = null;

        $scope.oneAtATime = true;
        $scope.status = {
            isFirstOpen: true,
            isFirstDisable: false,
            bopen: false,
            aopen: true
        };

        var configContent = null;
        var configFileName = null;
        var winID = null;

        ipcRenderer.on('config', function (event, arg) {
            console.log(arg);
            configFileName = arg.cfg.curName;
            winID = arg.winID;
            if (typeof arg.cfg.lastName != 'undefined') {
                try {
                    configContent = require('../../winconfig/' + arg.cfg.lastName);
                    console.log(configContent);
                    fs.rename('./winconfig/' + arg.cfg.lastName, './winconfig/' + arg.cfg.curName, function (e) { console.log(e, 'rm oldfile') });
                } catch (e) {
                    configContent = null;
                }
            }

            ipcRenderer.send(IPCMSG.BackendPoint, { reqno: 1, msgtype: QtpConstant.MSG_TYPE_TOPLIST });
        });

        $scope.menuOptions = [
            ['返回', function ($itemScope) {
                angular.element(document.getElementById("toplist_config")).removeClass("future").addClass("current");
                angular.element(document.getElementById("toplist_content")).removeClass("current").addClass("future");
                ipcRenderer.removeListener(IPCMSG.FrontendPoint, frontListenerObj);
                $scope.rows = [];
                clearTimeout($scope.shareObject.normalTimer);
                clearTimeout($scope.shareObject.relateTimer);
                //$scope.shareObject = angular.copy(shareObject_bak);
                $scope.saveConfig();
            }],
            ['置顶', function($itemScope){
                //alert(JSON.stringify(winID));
                ipcRenderer.send('set-window-top' + winID,  true);
            }]
        ];

        var reqObj = {
            reqno: 1,
            msgtype: QtpConstant.MSG_TYPE_TOPLIST_BASE,
            ranke: [$scope.shareObject.rankMin, $scope.shareObject.rankMax],
            master: '',
            sort: 1,
            column: [],
            filter: []
        };

        var relateObj = {
            reqno: 1,
            msgtype: QtpConstant.MSG_TYPE_TOPLIST_RELATE,
            ranke: [$scope.shareObject.rankMin, $scope.shareObject.rankMax],
            master: '',
            codelist: [],
            column: ['szWindCode', 'szCNName', 'nMatch', 'nChgAmpl', 'nSpeed']
        };

        var baseHeader = [];
        var formats = new Array();
        ipcRenderer.once(IPCMSG.FrontendPoint, function (e, arg) {
            console.log(arg, configContent);
            reqObj.column.push(arg.toplisttype[0].option[0].fieldname);
            reqObj.column.push(arg.toplisttype[0].option[1].fieldname);
            formats.push(1000); //代码
            formats.push(1000); //名称
            baseHeader.push(arg.toplisttype[0].option[0].columnname);
            baseHeader.push(arg.toplisttype[0].option[1].columnname);
            arg.toplisttype[0].option.splice(0, 2);
            $scope.topArr = arg.toplisttype;

            if (configContent != null) {

                for (var j = 0; j < $scope.topArr[0].option.length; ++j) {

                    $scope.topArr[0].option[j].bCheck = false;
                    for (var i = 0; i < configContent.reqObj.column.length; ++i) {
                        if ($scope.topArr[0].option[j].fieldname == configContent.reqObj.column[i]) {
                            var colID = configContent.reqObj.column[i];
                            if (reqObj.column.indexOf(colID) < 0) {
                                reqObj.column.push(colID);
                                formats.push($scope.topArr[0].option[j].format);
                                baseHeader.push($scope.topArr[0].option[j].columnname);
                                $scope.topArr[0].option[j].bCheck = true;
                                var p_interval = $scope.topArr[0].option[j].interval;
                                if (p_interval > 0 && intervals.indexOf(p_interval) < 0) {
                                    intervals.push(p_interval);
                                }
                            }
                            break;
                        }
                    }
                }

                $scope.shareObject.rankMin = configContent.reqObj.ranke[0];
                $scope.shareObject.rankMax = configContent.reqObj.ranke[1];
                relateObj = configContent.relateObj;

                if (configContent.curCode)
                    $scope.shareObject.curCode = configContent.curCode;
                if (configContent.bCurCheck)
                    $scope.shareObject.bCurCheck = configContent.bCurCheck;

                
                $scope.status = configContent.status;
                $scope.$apply();
                
                if (configContent.hasSub) {
                    $scope.reqToplist();
                }
            }
        });

        //$scope.curCode = "000001.sz";
        var frontListenerObj = null;
        var minInterval = null;
        $scope.reqToplist = function () {

            relateObj.reqno = -1;
            reqObj.reqno = -1;
            relateObj.codelist=[];
            //shareObject_bak = angular.copy($scope.shareObject);

            if (frontListenerObj == null) {
                frontListenerObj = new frontListener();
                relateObj.reqno = 1;// 第一次send，=1；非第一次，=-1，防止主程序创建多个监听回调
                reqObj.reqno = 1;
            }

            if ($scope.status.bopen) { //相关性排序
                $scope.shareObject.header = ['相关系数','代码', '名称', '现价', '涨幅', '涨速'];
                $scope.shareObject.columns = relateObj.column;
                formats = [1000, 1000, 1002, 1001, 1001];
                //relateObj.codelist.length = 0;
                //console.log($scope.shareObject.curCode);
                if (relateObj.codelist.indexOf($scope.shareObject.curCode) < 0)
                    relateObj.codelist.push($scope.shareObject.curCode);
                console.log(relateObj);
                ipcRenderer.send(IPCMSG.BackendPoint, relateObj);
            } else {
                minInterval = intervals.sort(function (a, b) {
                    return parseInt(a) - parseInt(b);
                })[0];
                console.log(minInterval);
                //console.log(reqObj.column);
                //console.log($scope.shareObject.header);
                $scope.shareObject.header = baseHeader;
                $scope.shareObject.columns = reqObj.column;
                reqObj.ranke = [parseInt($scope.shareObject.rankMin), parseInt($scope.shareObject.rankMax)];
                reqObj.master = reqObj.column[0];
                $scope.predicate = reqObj.master;
                console.log(reqObj);
                ipcRenderer.send(IPCMSG.BackendPoint, reqObj);
            }

            angular.element(document.getElementById("toplist_config")).removeClass("current").addClass("future");
            angular.element(document.getElementById("toplist_content")).removeClass("future").addClass("current");

            ipcRenderer.on(IPCMSG.FrontendPoint, frontListenerObj);
            $scope.saveConfig();
        };

        var idx;
        var intervals = new Array();
        $scope.setColumn = function (colID, text, p_interval, format, bCheck) {

            //console.log(colID, text, p_interval, bCheck);

            if (bCheck != undefined) {
                if (bCheck) {
                    if (reqObj.column.indexOf(colID) < 0) {
                        reqObj.column.push(colID);
                        formats.push(format);                        
                        baseHeader.push(text);
                        if (p_interval > 0 && intervals.indexOf(p_interval) < 0) {
                            intervals.push(p_interval);
                        }

                    }
                } else {
                    if ((idx = reqObj.column.indexOf(colID)) >= 0) {
                        reqObj.column.splice(idx, 1);
                        formats.splice(idx, 1);                        
                        baseHeader.splice(idx, 1);
                        if ((idx = intervals.indexOf(p_interval)) >= 0) {
                            intervals.splice(idx, 1);
                        }
                    }
                }

                $scope.saveConfig();
            }
        };

        $scope.saveConfig = function () {
            if (configContent == null)
                configContent = {};
            reqObj.ranke = [parseInt($scope.shareObject.rankMin), parseInt($scope.shareObject.rankMax)];

            configContent.reqObj = reqObj;
            configContent.relateObj = relateObj;
            configContent.status = $scope.status;
            configContent.curCode = $scope.shareObject.curCode;
            configContent.bCurCheck = $scope.shareObject.bCurCheck;

            configContent.hasSub = angular.element(document.getElementById("toplist_config")).hasClass("future");
            fs.writeFile("./winconfig/" + configFileName, JSON.stringify(configContent), function (err) {
                if (err) {
                    console.log(err);
                }
            });
        };

        $scope.rows = [];
        var frontListener = function () {

            $scope.rows = [];

            return function (e, res) {

                //console.log(res);
                if (res.msgtype == QtpConstant.MSG_TYPE_TOPLIST_BASE) {
                    //console.log(res.data);
                    res.data.forEach(function (obj, index) {
                        //console.log(obj);
                        $scope.rows[index] = new Array();
                        for (var col in $scope.shareObject.columns) {
                            //$scope.rows[index].push(eval("obj." + $scope.shareObject.columns[col]));
                            if (formats[col] == 1001) {
                                $scope.rows[index].push(parseFloat(obj[$scope.shareObject.columns[col]])/ 100 + '%');
                                continue;
                            }
                            if (formats[col] == 1002) {
                                $scope.rows[index].push(parseFloat(obj[$scope.shareObject.columns[col]]) / 10000);
                                continue;
                            }
                            $scope.rows[index].push(obj[$scope.shareObject.columns[col]]);
                        }

                        // for(var prop in obj){
                        //     if($scope.shareObject.columns.indexOf(prop) > -1){
                        //         $scope.rows[index].push(obj[prop]);
                        //     }
                        // }
                    });
                    //console.log($scope.rows);
                    $scope.$apply();

                    $scope.shareObject.normalTimer = setTimeout(function(){
                         ipcRenderer.send(IPCMSG.BackendPoint, reqObj);
                     }, minInterval*1000);
                } else if (res.msgtype == QtpConstant.MSG_TYPE_TOPLIST_RELATE) {
                    res.data.forEach(function (obj, index) {
                        $scope.rows[index] = new Array();
                        //相关性系数列
                        $scope.rows[index].push(res.relevance[index]);
                        //
                        for (var col in $scope.shareObject.columns) {

                            if (formats[col] == 1001) {
                                $scope.rows[index].push(parseFloat(obj[$scope.shareObject.columns[col]])/ 100 + '%');
                                continue;
                            }
                            if (formats[col] == 1002) {
                                $scope.rows[index].push(parseFloat(obj[$scope.shareObject.columns[col]]) / 10000);
                                continue;
                            }
                            $scope.rows[index].push(obj[$scope.shareObject.columns[col]]);
                        }

                    });

                    //console.log($scope.rows);
                    $scope.$apply();
                    $scope.shareObject.relateTimer = setTimeout(function(){
                         ipcRenderer.send(IPCMSG.BackendPoint, relateObj);
                     },  3 * 1000);
                }
            }
        };

        var headerMap = new Object();

        $scope.predicate = '';
        $scope.reverse = false;

        $scope.setOption = function (colHeader, colIndex) {


            if($scope.status.bopen){
                
            } else {
                $scope.predicate = colHeader;
                $scope.reverse = !$scope.reverse;
                // var obj = new Object();
                var headerID = reqObj.column[colIndex];

                reqObj.master = headerID;
                reqObj.sort = $scope.reverse ? -1 : 1;
                
                console.log(reqObj);
                ipcRenderer.send(IPCMSG.BackendPoint, reqObj);
                //obj = null;
            }
        }
    }]);
