(function() {
    'use strict';
    
    var extension = {
        windowsMap: [],
        /**
         * windIdentifier: id
         * createInstanceMethod: a method to create a instance.
         *  
         * */ 
        registerWindow: (windIdentifier, createInstanceMethod, []) => {
            var obj = new Object();
            obj.name = windIdentifier;
            obj.getInstance = createInstanceMethod;
            this.windowsMap.push(obj);
        }    
    }
    
    module.exports = extension;
}).call(this);