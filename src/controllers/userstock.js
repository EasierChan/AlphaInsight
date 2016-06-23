/**
 * controller for userstock
 */
'use strict';


angular.module('app_userstock', [])
    .controller('c_userstock', ['$scope', function ($scope) {
        $scope.headers = ['股票代码'];
        const fs = require('fs');
        //read from conf/user-stock.json
        console.log(__dirname);
        var config_file = __dirname + "/../conf/user-stock.json";
        $scope.codes = JSON.parse(fs.readFileSync(config_file));
        $scope.addCode = function () {
            for (var idx in $scope.codes) {
                if ($scope.codes[idx] === $scope.newcode) {
                    return;
                }
            }
            $scope.codes.push($scope.newcode);
            fs.writeFileSync(config_file, JSON.stringify($scope.codes));
        }
    }]);