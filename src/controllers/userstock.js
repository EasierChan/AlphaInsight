/**
 * controller for userstock
 */
'use strict';

const ipcRenderer = require('electron').ipcRenderer;
const fs = require('fs');
const StringDecoder = require('string_decoder').StringDecoder;

angular.module('app_userstock', [])
    .controller('c_userstock', ['$scope', function ($scope) {
        $scope.headers = ['股票代码', '股票名称'];
        $scope.bAllSelect = false;
        $scope.codes = [];
        //var pattern = /^[0-9]{6}\.s[zh]$/;
        var pattern = /^[0-9]{6}$/;
        //const fs = require('fs');
        //read from conf/user-stock.json
        //console.log(__dirname);
        function saveToFile() {
            ipcRenderer.send('save-user-stock', $scope.codes);
            ipcRenderer.send('userstock_change', $scope.bEnable);
        }

        $scope.addCode = function () {
            if (!pattern.test($scope.newcode)) {
                alert('unvalid stock code!');
                return;
            }

            for (var idx in $scope.codes) {
                if ($scope.codes[idx][0] === $scope.newcode) {
                    return;
                }
            }

            var ret = ipcRenderer.sendSync('get-code-name', $scope.newcode);
            if(ret == -1){
                alert("股票代码不存在!");
                return;
            }
            var newCodes = [$scope.newcode, ret];
            newCodes.checked = $scope.bAllSelect;
            $scope.codes.push(newCodes);
            saveToFile();
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
            saveToFile();
        };
        // import csv file
        $scope.importFromFile = function () {
            electron.remote.dialog.showOpenDialog({
                title: '选择文件',
                filters: [
                    { name: '*.csv 文件', extensions: ['csv'] }
                ],
                properties: ['openFile']
            }, function (filename) {
                if (filename) {
                    //console.log(filename);
                    fs.readFile(filename[0], function (err, data) {
                        if (err) {
                            console.error(err);
                            throw err;
                        }
                        const decoder = new StringDecoder('utf8');
                        const codeArr = decoder.write(data).split(require('os').EOL);

                        codeArr.forEach(function (item) {
                            for (var i = 0; i < $scope.codes.length; ++i) {
                                if ($scope.codes[i][0] == item) {
                                    break;
                                }
                            }

                            if (i == $scope.codes.length) {
                                var ret = ipcRenderer.sendSync('get-code-name', $scope.newcode);
                                $scope.codes.push([item, ret]);
                            }
                        });

                        $scope.$apply();
                        saveToFile();
                    });
                }
            });
        }

        ipcRenderer.on('backend_change', function (e, obj) {
            //console.log(bFavour);
            $scope.$apply(function () {
                $scope.bEnable = obj.bEnable;
                $scope.codes = obj.codeDetail;
            });
        });

        $scope.enableThis = function () {
            ipcRenderer.send('userstock_change', $scope.bEnable);
        }

        $scope.toggleAll = function () {
            //alert($scope.bAllSelect);
            for (var i = 0; i < $scope.codes.length; ++i) {
                $scope.codes[i].checked = $scope.bAllSelect;
            }
        };

        $scope.toggle = function (item) {
            if (!item.checked) {
                $scope.bAllSelect = false;
            }
            else {
                var allSelected = true;
                for (var i = 0; i < $scope.codes.length; i++) {
                    if (!$scope.codes[i].checked) {
                        allSelected = false;
                        break;
                    }
                }
                $scope.bAllSelect = allSelected;
            }
        };
    }]);

document.onkeydown = function (event) {
    if (event.keyCode == 13) {
        document.getElementById("enter").click();
        return false;
    }
}