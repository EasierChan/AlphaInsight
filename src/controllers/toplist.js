'use strict';

const ipcRenderer = require('electron').ipcRenderer;
const QtpConstant = require('../models/qtpmodel').QtpConstant;
const IPCMSG = require('../models/qtpmodel').IPCMSG;

angular.module("app_toplist", ['ui.bootstrap', 'ngAnimate'])
    .controller('c_parent', ['$scope', function ($scope) {
        // $scope.currentPage = 1;
        // $scope.totalItems = 20;

        // $scope.pageChange= function(){
        // }
        $scope.shareObject = new Object();
        $scope.shareObject.header = [];
        $scope.shareObject.columns = [];
    }])
    .controller('c_config', ['$scope', function ($scope) {
        $scope.oneAtATime = true;
        $scope.status = {
            isFirstOpen: true,
            isFirstDisable: false,
            bopen: false,
            aopen: true
        };

        ipcRenderer.send(IPCMSG.BackendPoint, { reqno: 1, msgtype: QtpConstant.MSG_TYPE_TOPLIST });
        ipcRenderer.once(IPCMSG.FrontendPoint, function (e, arg) {
            console.log(arg);
            $scope.topArr = arg.toplisttype;
        });

        var reqObj = {
            reqno: 1,
            msgtype: QtpConstant.MSG_TYPE_TOPLIST_BASE,
            ranke: [2, 5],
            column: [],
            filter: []
        };


        $scope.reqToplist = function () {
            //console.log(reqObj.column);
            //console.log($scope.shareObject.header);
            $scope.shareObject.columns = reqObj.column;
            ipcRenderer.send(IPCMSG.BackendPoint, reqObj);
            angular.element(document.getElementById("toplist_config")).removeClass("current").addClass("future");
            angular.element(document.getElementById("toplist_content")).removeClass("future").addClass("current");
        };

        var idx;
        $scope.setColumn = function (colID, text, bCheck) {
            if (bCheck != undefined) {
                if (bCheck) {
                    if (reqObj.column.indexOf(colID) < 0) {
                        reqObj.column.push(colID);
                        $scope.shareObject.header.push(text);
                    }
                } else {
                    if ((idx = reqObj.column.indexOf(colID)) >= 0) {
                        reqObj.column.splice(idx, 1);
                        $scope.shareObject.header.splice(idx, 1);
                    }
                }
            }
        };
    }])
    .controller('c_topcontent', ['$scope', function ($scope) {
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
                    //console.log(col, $scope.shareObject.columns[col]);
                    $scope.rows[index].push(eval("obj." + $scope.shareObject.columns[col]));
                }
            });
            console.log($scope.rows);
            $scope.$apply();
        })
    }]);