(function () {
    /**
     * Constants for Qtpmessage.
     */
    var QtpConstant = {
        MSG_TYPE_LOGIN: 1,
        MSG_TYPE_LOGIN_ANSWER: 2,
        MSG_TYPE_LOGOUT: 3,
        MSG_TYPE_ALERT_TYPE: 4,
        MSG_TYPE_ALERT_TYPE_ANSER: 5,
        MSG_TYPE_ALERT_SUB: 6,
        MSG_TYPE_ALERT_RESULT: 7,
        MSG_TYPE_ALERT_ANSWER: 8,
        MSG_TYPE_ALERT_CANCLE: 9,
        MSG_TYPE_TOPLIST: 10,
        MSG_TYPE_TOPLIST_ANSWER: 11,
        MSG_TYPE_HEARTBEAT: 12,
        MSG_TYPE_NONE: -1
    };
    
    module.exports = QtpConstant;
}).call(this);