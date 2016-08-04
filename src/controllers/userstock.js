/**
 * controller for userstock
 */
'use strict';

const ipcRenderer = require('electron').ipcRenderer;
const remote = require('electron').remote;
const fs = require('fs');
const StringDecoder = require('string_decoder').StringDecoder;

angular.module('app_userstock', [])
    .controller('c_userstock', ['$scope', function ($scope) {
        $scope.headers = ['股票代码', '股票名称'];
        $scope.bAllSelect = false;
        $scope.codes = [];
        var pattern = /^[0-9]{6}$/;
        function saveToFile() {
            ipcRenderer.send('save-user-stock', $scope.codes);
            ipcRenderer.send('userstock_change', $scope.bEnable);
        }

        $scope.addCode = function () {
            if (!pattern.test($scope.newcode)) {
                alert('股票代码格式不合法!');
                // $scope.newcode = null;
                return;
            }

            for (var idx in $scope.codes) {
                if ($scope.codes[idx][0] === $scope.newcode) {
                    $scope.newcode = null;
                    return;
                }
            }

            var ret = ipcRenderer.sendSync('get-code-name', $scope.newcode);
            if (ret == -1) {
                alert("股票代码不存在!");
                // $scope.newcode = null;
                return;
            }

            var newCodes = [$scope.newcode, ret];
            $scope.codes.unshift(newCodes);
            $scope.newcode = null;
            saveToFile();
        };
        // 删除按钮
        // $scope.delCode = function () {
        //     //scan the selected checkboxs. and delete them;
        //     var items = document.getElementById('content').querySelectorAll("input[type='checkbox']");
        //     var codes = new Array();
        //     for (var i = 0; i < items.length; ++i) {
        //         if (!items[i].checked) {
        //             codes.push($scope.codes[i]);
        //         }
        //     }

        //     $scope.codes = codes;
        //     saveToFile();
        // };
        // import csv file
        $scope.importFromFile = function () {
            remote.dialog.showOpenDialog({
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
                        // 导入股票数组
                        const codeArr = decoder.write(data).split(require('os').EOL);
                        if (codeArr[0].length == 7) {
                            codeArr[0] = codeArr[0].substr(1);
                        }
                        var errCode = [];
                        var ret = null; //returnVal, code value
                        codeArr.forEach(function (item) {
                            if (item.length > 5) {
                                for (var i = 0; i < $scope.codes.length; ++i) {
                                    if ($scope.codes[i][0] == item) {
                                        break;
                                    }
                                }

                                if (i == $scope.codes.length) {
                                    ret = ipcRenderer.sendSync('get-code-name', item);
                                    if (ret != -1) {
                                        $scope.codes.push([item, ret]);
                                    } else {
                                        errCode.push(item);
                                    }
                                }
                            }
                        });

                        if (errCode.length > 0) {
                            alert('股票代码不存在: ' + errCode.join(','));
                            errCode = null;
                        }
                        $scope.$apply();
                        saveToFile();
                    });
                }
            });
        }
        // export file
        $scope.exportToFile = function() {
            var codesCSV = "";
            for(var i = 0; i < $scope.codes.length; ++i){
                codesCSV += $scope.codes[i][0] + require('os').EOL;
            }
            //alert(codesCSV);
            remote.dialog.showSaveDialog(remote.getCurrentWindow(), {
                title: "自选股导出",
                filters: [
                    { name: '*.csv 文件', extensions: ['csv'] }
                ]
            }, function(filename){
                fs.writeFile(filename
                    , codesCSV
                    , function (err) {
                        if (err) {
                            throw err;
                        }
                        console.log('Save 自选股文件 successfully!');
                    });
                codesCSV = null;
            });
        }

        ipcRenderer.on('backend_change', function (e, obj) {
            $scope.$apply(function () {
                $scope.bEnable = obj.bEnable;
                $scope.codes = obj.codeDetail;
            });
        });

        $scope.enableThis = function () {
            ipcRenderer.send('userstock_change', $scope.bEnable);
        };

        $scope.remove = function (row) {
            // 找到相同元素索引
            for (var i = 0; i < $scope.codes.length; ++i) {
                if ($scope.codes[i][0] == row[0]) {
                    break;
                }
            }
            // 把后面的元素往前move
            for (var k = i + 1; k < $scope.codes.length; ++k) {
                $scope.codes[k - 1] = $scope.codes[k];
            }
            $scope.codes[k - 1] = null;
            $scope.codes.length = k - 1;
            saveToFile();
        };

        document.onkeydown = function (event) {
            if (event.keyCode == 13) {
                document.getElementById("enter").click();
                return false;
            }
        }
        // // 全选 全不选
        // $scope.toggleAll = function () {
        //     //alert($scope.bAllSelect);
        //     for (var i = 0; i < $scope.codes.length; ++i) {
        //         $scope.codes[i].checked = $scope.bAllSelect;
        //     }
        // };
        // // 切换
        // $scope.toggle = function (item) {
        //     if (!item.checked) {
        //         $scope.bAllSelect = false;
        //     }
        //     else {
        //         var allSelected = true;
        //         for (var i = 0; i < $scope.codes.length; i++) {
        //             if (!$scope.codes[i].checked) {
        //                 allSelected = false;
        //                 break;
        //             }
        //         }
        //         $scope.bAllSelect = allSelected;
        //     }
        // };
    }]);
