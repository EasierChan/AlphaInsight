/**
 * controller for userstock
 */
'use strict';

const electron = require('electron');

angular.module('app_userstock', [])
    .controller('c_userstock', ['$scope', function ($scope) {
        $scope.headers = ['股票代码','股票名称'];
        $scope.bAllSelect = false;
        var pattern = /^[0-9]{6}\.s[zh]$/;
        //const fs = require('fs');
        //read from conf/user-stock.json
        //console.log(__dirname);
        $scope.addCode = function () {
            if (!pattern.test($scope.newcode)) {
                alert('unvalid stock code!');
                return;
            }

            for (var idx in $scope.codes) {
                if ($scope.codes[idx] === $scope.newcode) {
                    return;
                }
            }
            $scope.codes.push($scope.newcode);
            //fs.writeFileSync(config_file, JSON.stringify($scope.codes));
        };

        $scope.delCode = function () {
            //scan the selected checkboxs. and delete them;
            var items = document.getElementById('content').querySelectorAll("input[type='checkbox']");
            var codes = new Array();
            for (var i = 0; i < items.length; ++i) {
                if (!items[i].checked) {
                    codes.push($scope.codes[i]);
                }
            }
            
            $scope.codes = codes;
            //fs.writeFileSync(config_file, JSON.stringify($scope.codes));
        };

        electron.ipcRenderer.on('backend_change', function (e, obj) {
            //console.log(bFavour);
            $scope.$apply(function () {
                $scope.bEnable = obj.bEnable;
                $scope.codes = obj.codeDetail;
            })
        });

        $scope.enableThis = function () {
            electron.ipcRenderer.send('userstock_change', $scope.bEnable);
        }

        $scope.toggleAll = function () {
            //alert($scope.bAllSelect);
            var items = document.getElementById('content').querySelectorAll("input[type='checkbox']");
            for (var i = 0; i < items.length; ++i) {
                //alert(i);
                //alert(items[i].checked);
                items[i].checked = $scope.bAllSelect;
            }
        };

        $scope.toggle = function (idx) {
            //var items = document.getElementById('content').querySelectorAll("input[type='checkbox']");
            //alert(items[idx].checked);
        };
    }]);