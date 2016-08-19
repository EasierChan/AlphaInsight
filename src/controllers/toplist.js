'use strict';

const ipcRenderer = require('electron').ipcRenderer;
const remote = require('electron').remote;
const QtpConstant = require('../models/qtpmodel').QtpConstant;
const IPCMSG = require('../models/qtpmodel').IPCMSG;
const fs = require('fs');
const userDir = remote.app.getPath("userData");

angular.module("app_toplist", ['ui.bootstrap', 'ngAnimate'])
    .controller('c_parent', ['$scope', function ($scope) {

        $scope.shareObject = new Object();
        $scope.shareObject.header = [];
        $scope.shareObject.columns = [];
        $scope.shareObject.rankMin = 1;
        $scope.shareObject.rankMax = 30;
        $scope.shareObject.curCode = "000001";
        $scope.shareObject.bCurCheck = false;
        $scope.shareObject.normalTimer = null;
        $scope.shareObject.relateTimer = null;
        $scope.menuShow={};
        $scope.isRowShow={};
       
         

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
                    configContent = require(userDir + '/winconfig/' + arg.cfg.lastName);
                    console.log(configContent);
                    fs.rename(userDir + '/winconfig/' + arg.cfg.lastName, userDir + '/winconfig/' + arg.cfg.curName, function (e) { console.log(e, 'rm oldfile') });
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

        var template = [{
                label: '自设相关性排序',
                click: function(item, focusedWindow) {
                    angular.element(document.getElementById("toplist_config")).removeClass("future").addClass("current");
                    angular.element(document.getElementById("toplist_content")).removeClass("current").addClass("future");
                    ipcRenderer.removeListener(IPCMSG.FrontendPoint, frontListenerObj);
                    $scope.rows = [];
                    clearTimeout($scope.shareObject.normalTimer);
                    clearTimeout($scope.shareObject.relateTimer);
                    //$scope.status.bopen=true;
                    //$scope.shareObject = angular.copy(shareObject_bak);
                    $scope.saveConfig();
                }
            },{
                label: '置顶',
                type: 'checkbox',
                click: function(item, focusedWindow) {
                    focusedWindow.setAlwaysOnTop(item.checked);
                }
            },{
                label: '基本列',
                submenu:[]
            },{
                label: '股票显示数',
                click: function(item, focusedWindow) {
                    angular.element(document.getElementById("dlgRangeInput")).removeClass("future").addClass("current");
                    //angular.element(document.getElementById("toplist_content")).removeClass("current").addClass("future");  
                    ipcRenderer.removeListener(IPCMSG.FrontendPoint, frontListenerObj);
                    $scope.rows = [];
                    clearTimeout($scope.shareObject.normalTimer);
                    clearTimeout($scope.shareObject.relateTimer);
               }
            },{
                label: '基本排序',
                click: function(item, focusedWindow) {
                    angular.element(document.getElementById("toplist_config")).removeClass("current").addClass("future");
                    angular.element(document.getElementById("toplist_content")).removeClass("future").addClass("current");
                    ipcRenderer.removeListener(IPCMSG.FrontendPoint, frontListenerObj);
                    $scope.rows = [];
                    clearTimeout($scope.shareObject.normalTimer);
                    clearTimeout($scope.shareObject.relateTimer);
                    $scope.shareObject.header = baseHeader;
                    $scope.shareObject.columns = reqObj.column;
                    reqObj.ranke = [parseInt($scope.shareObject.rankMin), parseInt($scope.shareObject.rankMax)];
                    reqObj.master = reqObj.column[0];
                    $scope.predicate = reqObj.master;
                    ipcRenderer.send(IPCMSG.BackendPoint, reqObj);
                    ipcRenderer.on(IPCMSG.FrontendPoint, frontListenerObj);
                    $scope.status.bopen=false;
                    $scope.saveConfig();
                }
            },
            // {
            //     label: '自选股',
            //     click: function(item, focusedWindow) {
                    
            //         }
            // },
            {
                label: '相关性',
                click: function(item, focusedWindow) {
                        if(delRowIndex==-1){
                              alert("单击行头，选中行！");
                              return;
                        }
                          
                       // angular.element(document.getElementById("toplist_content")).removeClass("current").addClass("future");
                        ipcRenderer.removeListener(IPCMSG.FrontendPoint, frontListenerObj);
                        $scope.rows = [];
                        clearTimeout($scope.shareObject.normalTimer);
                        clearTimeout($scope.shareObject.relateTimer);
                        relateObj.reqno = -1;
                        reqObj.reqno = -1;
                        relateObj.codelist = [];

                        var rowSel = $scope.rows[delRowIndex];
                        for(var item in $scope.rows[delRowIndex]){
                           $scope.shareObject.curCode = $scope.rows[delRowIndex][item];
                         //  console.log( $scope.shareObject.curCode);
                           break;
                        }
                       
                        
                       // console.log($scope.shareObject.curCode);
                        if (relateObj.codelist.indexOf($scope.shareObject.curCode) < 0){
                            relateObj.codelist.push($scope.shareObject.curCode);
                            if(!relateObj.codelist){
                                relateObj.codelist.push("600446");
                            }
                        }
                    //相关性排序
                        $scope.shareObject.header = ['相关系数', '代码', '名称', '现价', '涨幅', '涨速'];
                        $scope.shareObject.columns = relateObj.column;

                        formats = [1000, 1000, 1002, 1001, 1001];
                        $scope.status.bopen=true;
                        delRowIndex =-1;
                        ipcRenderer.send(IPCMSG.BackendPoint, relateObj);
                        //angular.element(document.getElementById("toplist_content")).removeClass("future").addClass("current");
                        ipcRenderer.on(IPCMSG.FrontendPoint, frontListenerObj);
                    }
            },{
                label: '删除列',
                click: function(item, focusedWindow) {
                  $scope.menuShow[$scope.selectCol] = false;
                  for(var menuIm in template[2].submenu ){
                      if(template[2].submenu[menuIm].label==selectCol){
                          $scope.menuShow[selectCol]=!$scope.menuShow[selectCol]; 
                          template[2].submenu[menuIm].checked = !template[2].submenu[menuIm].checked;
                          selectCol='';
                          break;
                      }
                  }
                }
            }
            // ,{
            //     label: '删除行',
            //     click: function(item, focusedWindow) {
            //         if(delRowIndex==-1){
            //             console.log("未选中行！")
            //             return ;
            //         }
            //        // $scope.rows.splice(delRowIndex,1);
            //        // $scope.$apply();
            //         if(delCodeList.indexOf(delcodeId)<0){
            //            delCodeList.push(delcodeId);
            //         }
            //         delRowIndex=-1;
            //     }
            // },

        ];

        var selectCol='';

        $scope.setSelCol = function(hdr){
             selectCol=hdr;
        };
        var filterGroup=[];
        var delRowIndex=-1;
        var delCodeList=[];
        var delcodeId='';

         $scope.selectRow = function (row,index){
             var filterItem={
               szWindCode: row[0],//代码
               szCNName: row[1] ,//名称
             }
             if((filterGroup.indexOf(filterItem))<0){
                filterGroup.push(filterItem);
             }
            
             delRowIndex=index;
             delcodeId=row[0];
             //selectRow=row;
             console.log(delcodeId);
        };

        $scope.relaseWinShow = function(){
            
            relateObj.reqno = -1;
            reqObj.reqno = -1;
            relateObj.codelist = [];
           //相关性排序
            $scope.shareObject.header = ['相关系数', '代码', '名称', '现价', '涨幅', '涨速'];
            $scope.shareObject.columns = relateObj.column;
            formats = [1000, 1000, 1002, 1001, 1001];
          
            if (relateObj.codelist.indexOf($scope.shareObject.curCode) < 0)
                relateObj.codelist.push($scope.shareObject.curCode);
            console.log(relateObj);
            ipcRenderer.send(IPCMSG.BackendPoint, relateObj);
            if (frontListenerObj == null) {
                //console.log("hee456");
                frontListenerObj = new frontListener();
                relateObj.reqno = 1;// 第一次send，=1；非第一次，=-1，防止主程序创建多个监听回调
                reqObj.reqno = 1;
            }
           
            $scope.status.bopen=true;//相关性页面打开
            angular.element(document.getElementById("toplist_config")).removeClass("current").addClass("future");//相关信配置页面
            angular.element(document.getElementById("toplist_content")).removeClass("future").addClass("current");
            ipcRenderer.on(IPCMSG.FrontendPoint, frontListenerObj);
            $scope.saveConfig();
        };

         $scope.rowShow =  function(row){
            var item="";
            for (var it in row){
              item = row[it];
              break;
            }
            //console.log($scope.isRowShow[item] ,item);
            return  $scope.isRowShow[item];
        };
        

        $scope.btnRangeSelect = function(){
            console.log($scope.status.bopen);
           
            if(!$scope.status.bopen){
                reqObj.ranke = [parseInt($scope.shareObject.rankMin), parseInt($scope.shareObject.rankMax)]; 
                $scope.shareObject.header = baseHeader;
                $scope.shareObject.columns = reqObj.column;
                reqObj.ranke = [parseInt($scope.shareObject.rankMin), parseInt($scope.shareObject.rankMax)];
                reqObj.master = reqObj.column[0];
                $scope.predicate = reqObj.master;
                ipcRenderer.send(IPCMSG.BackendPoint, reqObj);
            }
            else{
                 
                relateObj.reqno = -1;
                reqObj.reqno = -1;
                //relateObj.codelist = [];
                //相关性排序
                relateObj.ranke = [parseInt($scope.shareObject.rankMin), parseInt($scope.shareObject.rankMax)];
                $scope.shareObject.header = ['相关系数', '代码', '名称', '现价', '涨幅', '涨速'];
                $scope.shareObject.columns = relateObj.column;
                formats = [1000, 1000, 1002, 1001, 1001];
                ipcRenderer.send(IPCMSG.BackendPoint, relateObj);
                console.log(relateObj);
            }
            
            //$scope.status.bopen=false;//相关性页面关闭
             if (frontListenerObj == null) {
                //console.log("hee456");
                frontListenerObj = new frontListener();
                relateObj.reqno = 1;// 第一次send，=1；非第一次，=-1，防止主程序创建多个监听回调
                reqObj.reqno = 1;
            }
        
            angular.element(document.getElementById("dlgRangeInput")).removeClass("current").addClass("future");
           // angular.element(document.getElementById("toplist_content")).removeClass("future").addClass("current");
            ipcRenderer.on(IPCMSG.FrontendPoint, frontListenerObj);
           // $scope.saveConfig();
        }

        var baseHeader = [];
        var formats =  [];
        var menuGroup = [];
        var intervals = [];

        ipcRenderer.once(IPCMSG.FrontendPoint, function (e, arg) {
            console.log( arg);
            reqObj.column.push(arg.toplisttype[0].option[0].fieldname);//for PreClose
            reqObj.column.push(arg.toplisttype[0].option[1].fieldname);
            formats.push(1000); //代码
            formats.push(1000); //名称
            baseHeader.push(arg.toplisttype[0].option[0].columnname);
            baseHeader.push(arg.toplisttype[0].option[1].columnname);
            arg.toplisttype[0].option.splice(0, 2);
            $scope.topArr = arg.toplisttype;

            for (var j = 0; j < $scope.topArr[0].option.length; ++j) {
                var topItem = $scope.topArr[0].option[j];
                //$scope.topArr[0].option[j].bCheck = true;
                $scope.menuShow[topItem.columnname]=true;
                reqObj.column.push($scope.topArr[0].option[j].fieldname);//for PreClose
                formats.push($scope.topArr[0].option[j].format);
                baseHeader.push($scope.topArr[0].option[j].columnname);//for  昨收 

                var p_interval = $scope.topArr[0].option[j].interval;
                if (p_interval > 0 && intervals.indexOf(p_interval) < 0) {
                    intervals.push(p_interval);
                } 
                
                var  menuItem = {
                    label:topItem.columnname,
                    type: 'checkbox',
                    checked: true,
                    click: function(item, focusedWindow) {
                        $scope.menuShow[item.label]=!$scope.menuShow[item.label];           
                    }
                }
                template[2].submenu.push(menuItem);      
            }       

            if (configContent != null) {
                $scope.shareObject.rankMin = configContent.reqObj.ranke[0];
                $scope.shareObject.rankMax = configContent.reqObj.ranke[1];
                relateObj = configContent.relateObj;

                if (configContent.curCode)
                    $scope.shareObject.curCode = configContent.curCode;
                if (configContent.bCurCheck)
                    $scope.shareObject.bCurCheck = configContent.bCurCheck;

                $scope.status = configContent.status;
            }
            

            var menu = remote.Menu.buildFromTemplate(template);
            var myTbHeader=document.getElementById("header")
             window.addEventListener('contextmenu', function(e) {
                    e.preventDefault();
                    menu.popup(remote.getCurrentWindow());
            }, false);
            
            $scope.$apply();

            $scope.reqToplist();
        });


        var frontListenerObj = null;
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
            reqObj.master = reqObj.column[0];
            console.log(reqObj);

            relateObj.reqno = -1;
            reqObj.reqno = -1;
            relateObj.codelist = [];
            //shareObject_bak = angular.copy($scope.shareObject);

            if (frontListenerObj == null) {
                frontListenerObj = new frontListener();
                relateObj.reqno = 1;// 第一次send，=1；非第一次，=-1，防止主程序创建多个监听回调
                reqObj.reqno = 1;
            }

             if ($scope.status.bopen) { //相关性排序
                $scope.shareObject.header = ['相关系数', '代码', '名称', '现价', '涨幅', '涨速'];
                $scope.shareObject.columns = relateObj.column;
                formats = [1000, 1000, 1002, 1001, 1001];
                //relateObj.codelist.length = 0;
                //console.log($scope.shareObject.curCode);
                if (relateObj.codelist.indexOf($scope.shareObject.curCode) < 0)
                    relateObj.codelist.push($scope.shareObject.curCode);
                console.log(relateObj);
                ipcRenderer.send(IPCMSG.BackendPoint, relateObj);
             } else{
                minInterval = intervals.sort(function (a, b) {
                    return parseInt(a) - parseInt(b);
                })[0];
                console.log(minInterval);
                //console.log(reqObj.column);
                //console.log(baseHeader);
                $scope.shareObject.header = baseHeader;
                $scope.shareObject.columns = reqObj.column;
                reqObj.ranke = [parseInt($scope.shareObject.rankMin), parseInt($scope.shareObject.rankMax)];
                reqObj.master = reqObj.column[0];
                $scope.predicate = reqObj.master;
                console.log(reqObj);
                ipcRenderer.send(IPCMSG.BackendPoint, reqObj);
            }

            angular.element(document.getElementById("toplist_content")).removeClass("future").addClass("current");

            ipcRenderer.on(IPCMSG.FrontendPoint, frontListenerObj);
            $scope.saveConfig();
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
            fs.writeFile(userDir + '/winconfig/' + configFileName, JSON.stringify(configContent), function (err) {
                if (err) {
                    console.log(err);
                }
            });
        };

       

        $scope.rows = [];
      
        var frontListener = function () {

            $scope.rows = [];
            //$scope.isRowShow={};
            var delIndex=[];

            return function (e, res) {

                //console.log(res);
                if (res.msgtype == QtpConstant.MSG_TYPE_TOPLIST_BASE) {
                    //console.log(res.data);
                    res.data.forEach(function (obj, index) {
                        // console.log(obj);
                        // console.log(index);
                        // var codeItem=obj[$scope.shareObject.columns[0]];

                        //  if(delCodeList.indexOf(codeItem)>-1){
                        //      delIndex.push(index);
                        //      console.log(index,codeItem);
                        //      //res.data.splice(index,1);
                        //      //return true;
                        //  }
                        // $scope.isRowShow[codeItem]=true;
                        $scope.rows[index] = new Array();
                        for (var col in $scope.shareObject.columns) {
                            //$scope.rows[index].push(eval("obj." + $scope.shareObject.columns[col]));
                            if (formats[col] == 1001) {
                                $scope.rows[index].push(parseFloat(obj[$scope.shareObject.columns[col]]) / 100 + '%');
                                continue;
                            }
                            if (formats[col] == 1002) {
                                $scope.rows[index].push(parseFloat(obj[$scope.shareObject.columns[col]]) / 10000);
                                continue;
                            }
                            $scope.rows[index].push(obj[$scope.shareObject.columns[col]]);
                        }

                    });
                  

                    //  var lth= delIndex.length;
                    //  for(var i=0 ;i<lth ; i++){
                    //      $scope.rows.splice(delIndex[i], 1);
                    //      console.log(delIndex[i],i);
                    //  }


                    $scope.$apply();
                    delIndex=[];
                    $scope.shareObject.normalTimer = setTimeout(function () {
                        ipcRenderer.send(IPCMSG.BackendPoint, reqObj);
                    }, minInterval * 1000);
                } else if (res.msgtype == QtpConstant.MSG_TYPE_TOPLIST_RELATE) {
                    res.data.forEach(function (obj, index) {
                        $scope.rows[index] = new Array();
                        //相关性系数列
                        $scope.rows[index].push(res.relevance[index]);
                        //
                        for (var col in $scope.shareObject.columns) {

                            if (formats[col] == 1001) {
                                $scope.rows[index].push(parseFloat(obj[$scope.shareObject.columns[col]]) / 100 + '%');
                                continue;
                            }
                            if (formats[col] == 1002) {
                                $scope.rows[index].push(parseFloat(obj[$scope.shareObject.columns[col]]) / 10000);
                                continue;
                            }
                            $scope.rows[index].push(obj[$scope.shareObject.columns[col]]);
                        }

                    });

                    //console.log("relateObj:", relateObj);
                    $scope.$apply();
                    $scope.shareObject.relateTimer = setTimeout(function () {
                        ipcRenderer.send(IPCMSG.BackendPoint, relateObj);
                    }, 3 * 1000);
                }
            }
        };

        var headerMap = new Object();

        $scope.predicate = '';
        $scope.reverse = false;

        $scope.setOption = function (colHeader, colIndex) {
            if ($scope.status.bopen) {

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
