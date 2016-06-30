'use strict';
const ipcRenderer = require('electron').ipcRenderer;


angular.module("app_preference", [])
    .controller("c_preference", ["$scope", function ($scope) {
        ipcRenderer.on('backend_change', function (e, ObjConf) {
            //console.log(bFavour);
            $scope.$apply(function () {
                console.log(ObjConf);
                $scope.server_ip = ObjConf.FeedHandler.ip;
                $scope.server_port = ObjConf.FeedHandler.port;
                $scope.recv_freq = ObjConf.recvfrequency;
            })
        });

        $scope.save = function () {
            //alert("hello");
            ipcRenderer.send('preference_change', {ip: $scope.server_ip, port: $scope.server_port, freq:$scope.recv_freq});
        }
    }]);