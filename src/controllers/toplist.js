/**
 * controller for toplist
 */

var app = angular.module('app_toplist', []);
app.controller('c_toplist', function($scope) {
    $scope.headers = ['cid','name','latestprice','growth'];
    var codes = [
      {
          'cid': '000001',
          'name': '平安银行'
      },
      {
          'cid': '600446',
          'name': '金证股份'
      }  
    ];
    
    for(var i = 10; i< 30; ++i){
        codes.push({'cid':'0000'+i, 'name': '神秘涨停票'});
    }
    
    
    $scope.codes = codes;
});