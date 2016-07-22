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
            column: [],
            filter: []
        };
        
        ipcRenderer.once(IPCMSG.FrontendPoint, function (e, arg) {
            console.log(arg);
            reqObj.column.push(arg.toplisttype[0].option[0].fieldname);
            reqObj.column.push(arg.toplisttype[0].option[1].fieldname);
            $scope.shareObject.header.push(arg.toplisttype[0].option[0].columnname);
            $scope.shareObject.header.push(arg.toplisttype[0].option[1].columnname);
            arg.toplisttype[0].option.splice(0,2);
            $scope.topArr = arg.toplisttype;
        });
        
        var minInterval = null;
        $scope.reqToplist = function () {
            minInterval = intervals.sort(function(a,b){
                return parseInt(a) - parseInt(b);
            })[0];
            console.log(minInterval);
            //console.log(reqObj.column);
            //console.log($scope.shareObject.header);
            $scope.shareObject.columns = reqObj.column;
            reqObj.ranke = [parseInt($scope.shareObject.rankMin), parseInt($scope.shareObject.rankMax)];
            console.log(reqObj);

            ipcRenderer.send(IPCMSG.BackendPoint, reqObj);
            angular.element(document.getElementById("toplist_config")).removeClass("current").addClass("future");
            angular.element(document.getElementById("toplist_content")).removeClass("future").addClass("current");
        };

        var idx;

        var intervals = new Array();
        $scope.setColumn = function (colID, text, p_interval, bCheck) {

            console.log(colID, text, p_interval, bCheck);

            if (bCheck != undefined) {
                if (bCheck) {
                    if (reqObj.column.indexOf(colID) < 0) {
                        reqObj.column.push(colID);
                        $scope.shareObject.header.push(text);
                        if(p_interval > 0 && intervals.indexOf(p_interval) < 0){
                            intervals.push(p_interval);
                        }

                    }
                } else {
                    if ((idx = reqObj.column.indexOf(colID)) >= 0) {
                        reqObj.column.splice(idx, 1);
                        $scope.shareObject.header.splice(idx, 1);
                        if((idx = intervals.indexOf(p_interval)) >= 0){
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

        // }])
        // .controller('c_topcontent', ['$scope', function ($scope) {
        $scope.rows = [];
        ipcRenderer.on(IPCMSG.FrontendPoint, function (e, res) {
            if (res.msgtype != QtpConstant.MSG_TYPE_TOPLIST_BASE) {
                return;
            }
            //console.log(res.data);
            res.data.forEach(function (obj, index) {
                //console.log(obj);
                $scope.rows[index] = new Array();
                for (var col in $scope.shareObject.columns) {
                    $scope.rows[index].push(eval("obj." + $scope.shareObject.columns[col]));
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
        })
        
        var headerMap = new Object();
        
        $scope.setOption = function(colHeader, colIndex){
            var obj = new Object();
            var headerID = reqObj.column[colIndex];
            obj[headerID] = new Object();
            if(!headerMap.hasOwnProperty(colHeader)){
                headerMap[colHeader] = false;
                obj[headerID]["asc"] = "";
            } else {
                headerMap[colHeader] = !(headerMap[colHeader]);
                obj[headerID]["desc"] = "";
            }
            
            reqObj.filter.push(obj);
            console.log(reqObj);
            ipcRenderer.send(IPCMSG.BackendPoint, reqObj);
            obj = null;
        }
    }]);