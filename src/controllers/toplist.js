'use strict';

const ipcRenderer = require('electron').ipcRenderer;
const QtpConstant = require('../models/qtpmodel').QtpConstant;
const IPCMSG = require('../models/qtpmodel').IPCMSG;

angular.module("app_toplist", ['ui.bootstrap', 'ngAnimate'])
    .controller('c_parent', ['$scope', function ($scope) {

        $scope.shareObject = new Object();
        $scope.shareObject.header = [];
        $scope.shareObject.columns = [];
        $scope.shareObject.rankMin = 1;
        $scope.shareObject.rankMax = 30;
        $scope.shareObject.curCode = "000001.sz";

        $scope.oneAtATime = true;
        $scope.status = {
            isFirstOpen: true,
            isFirstDisable: false,
            bopen: false,
            aopen: true
        };

        var configContent = null;
        var configFileName = null;

        ipcRenderer.on('config', function (event, arg) {
            //console.log(arg);
            configFileName = arg.curName;
            if (typeof arg.lastName != 'undefined') {
                try {
                    configContent = require('../../winconfig/' + arg.lastName);
                    fs.rename('./winconfig/' + arg.lastName, './winconfig/' + arg.curName, function (e) { console.log(e, 'rm oldfile') });

                } catch (e) {
                    configContent = null;
                }
            }

            ipcRenderer.send(IPCMSG.BackendPoint, { reqno: 1, msgtype: QtpConstant.MSG_TYPE_TOPLIST });
        });


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


        var formats = new Array();
        ipcRenderer.once(IPCMSG.FrontendPoint, function (e, arg) {
            console.log(arg);
            reqObj.column.push(arg.toplisttype[0].option[0].fieldname);
            reqObj.column.push(arg.toplisttype[0].option[1].fieldname);
            formats.push(1000); //代码
            formats.push(1000); //名称
            $scope.shareObject.header.push(arg.toplisttype[0].option[0].columnname);
            $scope.shareObject.header.push(arg.toplisttype[0].option[1].columnname);
            arg.toplisttype[0].option.splice(0, 2);
            $scope.topArr = arg.toplisttype;
        });

        //$scope.curCode = "000001.sz";
        var minInterval = null;
        $scope.reqToplist = function () {
            if ($scope.status.bopen) { //相关性排序
                $scope.shareObject.header = ['代码','名称', '现价', '涨幅','涨速'];
                $scope.shareObject.columns = relateObj.column;
                formats = [1000, 1000, 1002, 1001, 1001];
                //relateObj.codelist.length = 0;
                //console.log($scope.shareObject.curCode);
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
                $scope.shareObject.columns = reqObj.column;
                reqObj.ranke = [parseInt($scope.shareObject.rankMin), parseInt($scope.shareObject.rankMax)];
                reqObj.master = reqObj.column[0];
                $scope.predicate = reqObj.master;
                console.log(reqObj);
                ipcRenderer.send(IPCMSG.BackendPoint, reqObj);
            }

            angular.element(document.getElementById("toplist_config")).removeClass("current").addClass("future");
            angular.element(document.getElementById("toplist_content")).removeClass("future").addClass("current");
        };

        var idx;

        var intervals = new Array();
        $scope.setColumn = function (colID, text, p_interval, format, bCheck) {

            console.log(colID, text, p_interval, bCheck);

            if (bCheck != undefined) {
                if (bCheck) {
                    if (reqObj.column.indexOf(colID) < 0) {
                        reqObj.column.push(colID);
                        formats.push(format);
                        $scope.shareObject.header.push(text);
                        if (p_interval > 0 && intervals.indexOf(p_interval) < 0) {
                            intervals.push(p_interval);
                        }

                    }
                } else {
                    if ((idx = reqObj.column.indexOf(colID)) >= 0) {
                        reqObj.column.splice(idx, 1);
                        formats.splice(idx, 1);
                        $scope.shareObject.header.splice(idx, 1);
                        if ((idx = intervals.indexOf(p_interval)) >= 0) {
                            intervals.splice(idx, 1);
                        }
                    }
                }
            }
        };

        var saveConfig = function () {
            if (configContent == null)
                configContent = {};
            configContent.topArr = $scope.topArr;
            // configContent.codesCheck = [];
            // for (var i = 0; i < $scope.codes1.length; ++i) {
            //     configContent.codesCheck.push($scope.codes1[i].checked);
            // }

            //            configContent.hasSub = angular.element(document.getElementById("tv_alert")).hasClass("future");
            fs.writeFile("./winconfig/" + configFileName, JSON.stringify(configContent), function (err) {
                if (err) {
                    console.log(err);
                }
            });
        };

        $scope.rows = [];
        ipcRenderer.on(IPCMSG.FrontendPoint, function (e, res) {
            if (res.msgtype == QtpConstant.MSG_TYPE_TOPLIST_BASE ) {
                //console.log(res.data);
                res.data.forEach(function (obj, index) {
                    //console.log(obj);
                    $scope.rows[index] = new Array();
                    for (var col in $scope.shareObject.columns) {
                        //$scope.rows[index].push(eval("obj." + $scope.shareObject.columns[col]));
                        if (formats[col] == 1001) {
                            $scope.rows[index].push(obj[$scope.shareObject.columns[col]] + '%');
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
                console.log($scope.rows);
                $scope.$apply();

                // setTimeout(function(){
                //     ipcRenderer.send(IPCMSG.BackendPoint, reqObj);
                // }, minInterval*1000);
            } else if (res.msgtype == QtpConstant.MSG_TYPE_TOPLIST_RELATE) {
                res.data.forEach(function (obj, index) {
                    console.log(obj);
                    $scope.rows[index] = new Array();
                    for (var col in $scope.shareObject.columns) {
                        
                        if (formats[col] == 1001) {
                            $scope.rows[index].push(obj[$scope.shareObject.columns[col]] + '%');
                            continue;
                        }
                        if (formats[col] == 1002) {
                            $scope.rows[index].push(parseFloat(obj[$scope.shareObject.columns[col]]) / 10000);
                            continue;
                        }
                        $scope.rows[index].push(obj[$scope.shareObject.columns[col]]);
                    }
                });
                    
                console.log($scope.rows);
                $scope.$apply();
            }
        })

        var headerMap = new Object();

        $scope.predicate = '';
        $scope.reverse = false;

        $scope.setOption = function (colHeader, colIndex) {

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
    }]);