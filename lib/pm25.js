var schedule = require('node-schedule');
var request = require('request');
var bunyan = require('bunyan');

module.exports = {
    setPushSchedule: setPushSchedule
}

var url = 'http://www.pm25.in/api/querys/pm2_5.json?city=beijing&token=5j1znBVAsnSf5xQyNQyq';
var log = bunyan.createLogger({
    name: 'pm2.5 schedule'
});
var getPM25Data = function () {
    request(url, function (error, response, body) {
        var data = JSON.parse(response.body);
        var target = data.find((item) => item.station_code === '1005A');
        if (target) {
            var messageMakeUp = `空气质量：${target.quality}; 当前颗粒物平均： ${target.pm2_5}; 数据发布的时间：${target.time_point}`;
            sendToWeChat(messageMakeUp);
        }
        log.info('fetch data');
    })
}

var sendToWeChat = function (msg) {
    request.post({
        url: `https://sc.ftqq.com/SCU9075T8ffb92bb9ec6c704501005b3db930992593ac45a3e156.send`,
        form: {
            text: 'PM2.5推送~',
            desp: msg
        }
    });
}

function setPushSchedule () {
    schedule.scheduleJob('00 30 09 * * *', function(){
        console.log('scheduleCronstyle:' + new Date());
        log.info('fire');
        getPM25Data();
    });
}