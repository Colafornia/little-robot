const request = require('request');
module.exports = {
    filterEmoji: function (text) {
        return text.replace(/([\uE000-\uF8FF]|\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF])/g, '');
    },
    sendLogs: function (message) {
        request.post({
            url: 'https://pushbear.ftqq.com/sub?sendkey=1577-30546f73bf47c4e3962382becf5f9ab8',
            form: {
                text: 'logs',
                desp: message
            }
        })
    }
}