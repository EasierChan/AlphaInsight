'use strict';

const ipcRenderer = require('electron').ipcRenderer;
const QtpConstant = require('../models/qtpmodel').QtpConstant;
const IPCMSG = require('../models/qtpmodel').IPCMSG;

angular.module("app_toplist", ['ui.bootstrap'])
    .controller('c_parent', ['$scope', function ($scope) {

    }])
    .controller('c_config', ['$scope', function ($scope) {
        $scope.oneAtATime = true;
        $scope.status = {
            isFirstOpen: true,
            isFirstDisable: false
        };
        
        ipcRenderer.send(IPCMSG.BackendPoint, {reqno: 1, msgtype: QtpConstant.MSG_TYPE_TOPLIST});
        ipcRenderer.once(IPCMSG.FrontendPoint, function (e, arg) {
            console.log(arg);
            $scope.topArr = arg.toplisttype;

        });


    }]);