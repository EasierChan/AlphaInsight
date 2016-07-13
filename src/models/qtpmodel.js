(function () {
    /**
     * Constants for Qtpmessage.
     */
    var QtpConstant = {
        MSG_TYPE_LOGIN: 1,
        MSG_TYPE_LOGOUT: 2,
        MSG_TYPE_HEARTBEAT: 3,
        MSG_TYPE_CODETABLE: 4,
        MSG_TYPE_ALERT: 10,
        MSG_TYPE_ALERT_TYPE: 11,
        MSG_TYPE_ALERT_SUB: 12,
        MSG_TYPE_ALERT_ADD: 13,
        MSG_TYPE_ALERT_CANCEL: 14,
        MSG_TYPE_TOPLIST: 20,
        MSG_TYPE_NONE: -1
    };

    var IPCMSG = {
        BackendPoint: "to-backend",
        FrontendPoint: "to-frontend"
    };
    
    module.exports.QtpConstant = QtpConstant;
    module.exports.IPCMSG = IPCMSG;
}).call(this);