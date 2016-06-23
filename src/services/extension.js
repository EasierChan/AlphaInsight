(function() {
    'use strict';
    
    var extension = {
        windowsMap: [],
        /**
         * type: type
         * createInstanceMethod: a method to create a instance.
         * ancestorIdxArr: indexs of its ancestors, and it'll be inserted to the specified index.
         * nickname
         * isSingleton
         * */ 
        registerWindow: function(type, createInstanceMethod, ancestorIdxArr, nickname, isSingleton){
            
            if(!type || !createInstanceMethod || !ancestorIdxArr){
                console.error('three params is required.');
                return;
            }
            
            var obj = new Object();
            obj.type = type;
            if(createInstanceMethod && !(createInstanceMethod instanceof Function)){
                console.error("createInstanceMethod should be a Function!");
                return;
            }
            obj.getInstance = createInstanceMethod;
            
            if(ancestorIdxArr && !(ancestorIdxArr instanceof Array)){
                console.error("ancestorIdxArr should be a Array!");
                return;
            }
            
            obj.ancestorIdxArr = ancestorIdxArr;
            obj.nickname = nickname;
            obj.isSingleton = isSingleton;
            extension.windowsMap.push(obj);
            obj = null;
        }    
    }
    
    module.exports = extension;
}).call(this);