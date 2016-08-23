'use strict';

const ipcRenderer = require('electron').ipcRenderer;
const remote = require('electron').remote;
const QtpConstant = require('../models/qtpmodel').QtpConstant;
const IPCMSG = require('../models/qtpmodel').IPCMSG;
const fs = require('fs');
const userDir = remote.app.getPath("userData");
const StringDecoder = require('string_decoder').StringDecoder;
const BrowserWindow = remote.BrowserWindow;

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

        $scope.headers = ['股票代码', '股票名称'];
        $scope.bAllSelect = false;
        $scope.codes = [];
        var pattern = /^[0-9]{6}$/;
        var bself=false;
       
         

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
            filter: [],
            codelist:[],
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
                    reqObj.codelist = [];
                    $scope.predicate = reqObj.master;
                    ipcRenderer.send(IPCMSG.BackendPoint, reqObj);
                    ipcRenderer.on(IPCMSG.FrontendPoint, frontListenerObj);
                    $scope.status.bopen=false;
                    $scope.saveConfig();
                }
            },
            {
                label: '自选股',
                click: function(item, focusedWindow) {
                        angular.element(document.getElementById("toplist_content")).removeClass("current").addClass("future");
                        angular.element(document.getElementById("self_select")).removeClass("future").addClass("current");
                        ipcRenderer.removeListener(IPCMSG.FrontendPoint, frontListenerObj);
                        $scope.rows = [];
                        clearTimeout($scope.shareObject.normalTimer);
                        clearTimeout($scope.shareObject.relateTimer);    
                    }
            },
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

                        relateFormats = [1000, 1000, 1002, 1001, 1001];
                        $scope.status.bopen=true;
                        delRowIndex =-1;
                        ipcRenderer.send(IPCMSG.BackendPoint, relateObj);
                        //angular.element(document.getElementById("toplist_content")).removeClass("future").addClass("current");
                        ipcRenderer.on(IPCMSG.FrontendPoint, frontListenerObj);
                    }
            },
            {
                label: '加入自选股',
                click: function(item, focusedWindow) {
                    if(delRowIndex==-1){
                        alert("未选中行！");
                        return ;
                    }
                    if($scope.status.bopen){
                       alert("代码相关页面不支持删除操作！");
                        return ;
                    }

                    if(!bself){
                       alert("自选股未先导入！");
                        return ;

                    }

                     if (!pattern.test(delcodeId)) {
                          console.log('股票代码格式不合法!',delcodeId);
                           // $scope.newcode = null;
                             return;
                    }

                    for (var idx in $scope.codes) {
                      if ($scope.codes[idx][0] === delcodeId) {
                          return;
                     }
                    }
                    //$scope.importFromFile();
                    
                    var newCodes = [delcodeId, delcodeName];
                    console.log(newCodes);
                    $scope.codes.unshift(newCodes);
                    //delcodeId='';
                    //delcodeName='';
                    $scope.$apply();

                    saveToFile();
                 
                }
            },

            {
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
            ,{
                label: '删除行',
                click: function(item, focusedWindow) {
                    if(delRowIndex==-1){
                        alert("未选中行！");
                        return ;
                    }
                    if($scope.status.bopen){
                       alert("代码相关页面不支持删除操作！");
                        return ;
                    }
                   // $scope.rows.splice(delRowIndex,1);
                   // $scope.$apply();
                    if(delCodeList.indexOf(delcodeId)<0){
                       delCodeList.push(delcodeId);
                    }
                    delRowIndex=-1;
                }
            }

        ];

        var selectCol='';

        $scope.setSelCol = function(hdr){
             selectCol=hdr;
        };
        var filterGroup=[];
        var delRowIndex=-1;
        var delCodeList=[];
        var delcodeId='';
        var delcodeName='';

         $scope.selectRow = function (row,index){
             var filterItem={
               szWindCode: row[0],//代码
               szCNName: row[1] ,//名称
             }
             if((filterGroup.indexOf(filterItem))<0){
                filterGroup.push(filterItem);
             }
            
             delRowIndex=index;
             delcodeId=row[0].strValue;
             delcodeName = row[1].strValue; 
             //selectRow=row;
             console.log(delcodeId,delcodeName);
        };

        $scope.relaseWinShow = function(){
            
            relateObj.reqno = -1;
            reqObj.reqno = -1;
            relateObj.codelist = [];
           //相关性排序
            $scope.shareObject.header = ['相关系数', '代码', '名称', '现价', '涨幅', '涨速'];
            $scope.shareObject.columns = relateObj.column;
            relateFormats = [1000, 1000, 1002, 1001, 1001];
          
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

        $scope.selfWinShow = function(){
            
            angular.element(document.getElementById("self_select")).removeClass("current").addClass("future");
            angular.element(document.getElementById("toplist_content")).removeClass("future").addClass("current");
           
            $scope.shareObject.header = baseHeader;
            $scope.shareObject.columns = reqObj.column;
            reqObj.ranke = [parseInt($scope.shareObject.rankMin), parseInt($scope.shareObject.rankMax)];
            reqObj.master = '';
            for(var i=0; i<$scope.codes.length;i++){
                reqObj.codelist[i]=$scope.codes[i][0];
            }
            $scope.predicate = reqObj.master;
            ipcRenderer.send(IPCMSG.BackendPoint, reqObj);
            ipcRenderer.on(IPCMSG.FrontendPoint, frontListenerObj);
            //$scope.status.bopen=false;
            
            $scope.saveConfig();
        };

        $scope.btnRangeSelect = function(){
            console.log($scope.status.bopen);
           
            if(!$scope.status.bopen){
                reqObj.ranke = [parseInt($scope.shareObject.rankMin), parseInt($scope.shareObject.rankMax)]; 
                $scope.shareObject.header = baseHeader;
                $scope.shareObject.columns = reqObj.column;
                reqObj.ranke = [parseInt($scope.shareObject.rankMin), parseInt($scope.shareObject.rankMax)];
                reqObj.master = reqObj.column[0];
                reqObj.codelist=[];
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
                relateFormats = [1000, 1000, 1002, 1001, 1001];
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
        var baseFormats =  [];
        var relateFormats =  [];

        var menuGroup = [];
        var intervals = [];

        ipcRenderer.once(IPCMSG.FrontendPoint, function (e, arg) {
            console.log( arg);
            reqObj.column.push(arg.toplisttype[0].option[0].fieldname);//for PreClose
            reqObj.column.push(arg.toplisttype[0].option[1].fieldname);
            baseFormats.push(1000); //代码
            baseFormats.push(1000); //名称
            baseHeader.push(arg.toplisttype[0].option[0].columnname);
            baseHeader.push(arg.toplisttype[0].option[1].columnname);
            arg.toplisttype[0].option.splice(0, 2);
            $scope.topArr = arg.toplisttype;

            for (var j = 0; j < $scope.topArr[0].option.length; ++j) {
                var topItem = $scope.topArr[0].option[j];
                //$scope.topArr[0].option[j].bCheck = true;
                $scope.menuShow[topItem.columnname]=true;
                reqObj.column.push($scope.topArr[0].option[j].fieldname);//for PreClose
                baseFormats.push($scope.topArr[0].option[j].format);
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
            reqObj.codelist = [];
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
                relateFormats = [1000, 1000, 1002, 1001, 1001];
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
                reqObj.codelist=[];
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
                    var addIndex=0;
                    //console.log(res.data);
                    res.data.forEach(function (obj, index) {
                        var bAdd=false;
                        $scope.rows[addIndex] = new Array();  
                        for (var col in $scope.shareObject.columns) {
                            var insertObj= {};
                            if (baseFormats[col] == 1001) {
                                insertObj.strValue =((parseFloat(obj[$scope.shareObject.columns[col]]) / 100) + '%');
                            }
                            else if (baseFormats[col] == 1002) {
                                insertObj.strValue = parseFloat(obj[$scope.shareObject.columns[col]])/10000;   
                            }
                            else {
                                insertObj.strValue = obj[$scope.shareObject.columns[col]];
                            }
                                   
                            if($scope.shareObject.columns[col]=="szCNName")//股票名称
                                insertObj.infoColor= 'flowerblue'; 
                            else if($scope.shareObject.columns[col]=="szWindCode")//代码
                                insertObj.infoColor= 'yellow'; 
                            else if($scope.shareObject.columns[col]=="nPreClose")//代码
                                insertObj.infoColor= 'green'; 
                            else if($scope.shareObject.columns[col]=="nChg")//涨幅
                                insertObj.infoColor=(insertObj.strValue>0)?'red':'green';
                            else{
                                insertObj.infoColor=(col%2==0)?'green':'red';
                            }
                           
                            $scope.rows[addIndex].push(insertObj);
                            if(delCodeList.indexOf($scope.shareObject.columns[0])<0){//不在删除表内
                                  bAdd=true;  
                            }
                           
                            insertObj= {};
                         }//for
                         if(bAdd){
                           
                           addIndex++;                            
                         }
                         else{
                               $scope.rows.splice(addIndex,1);
                                  return;
                         }
                    });

                    $scope.$apply();
                    delIndex=[];
                    $scope.shareObject.normalTimer = setTimeout(function () {
                        ipcRenderer.send(IPCMSG.BackendPoint, reqObj);
                    }, minInterval * 1000);
                } else if (res.msgtype == QtpConstant.MSG_TYPE_TOPLIST_RELATE) {
                    res.data.forEach(function (obj, index) {
                        $scope.rows[index] = new Array();
                        //相关性系数列
                        var insertObj2= {};
                        insertObj2.strValue=res.relevance[index];
                        insertObj2.infoColor='green';
                        $scope.rows[index].push(insertObj2);

                        for (var col in $scope.shareObject.columns) {
                            var insertObj1= {};
                            if (baseFormats[col] == 1001) {
                                insertObj1.strValue =((parseFloat(obj[$scope.shareObject.columns[col]]) / 100) + '%');
                            }
                            else if (baseFormats[col] == 1002) {
                                insertObj1.strValue = parseFloat(obj[$scope.shareObject.columns[col]])/10000;   
                            }
                            else {
                                insertObj1.strValue = obj[$scope.shareObject.columns[col]];
                            }

                            insertObj1.infoColor= 'green';              
                            $scope.rows[index].push(insertObj1);
                            insertObj1= {}                            
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
////////////////////处理自选股////////////////////////////
       {
         
       
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
                        bself=true;
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
        };

       } 


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
                reqObj.codelist=[];
                reqObj.sort = $scope.reverse ? -1 : 1;

                console.log(reqObj);
                ipcRenderer.send(IPCMSG.BackendPoint, reqObj);
                //obj = null;
            }
        }
    }]);
