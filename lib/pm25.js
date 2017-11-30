var schedule = require('node-schedule');
var request = require('request');
var bunyan = require('bunyan');
var moment = require('moment');

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
        try {
            var target = data.find((item) => item.station_code === '1005A');
            if (target) {
                var time = moment(target.time_point).format('YYYY-MM-DD HH:mm:ss');
                var messageMakeUp = `空气质量：${target.quality};\n\n 当前颗粒物平均： ${target.pm2_5}; \n\n数据发布的时间：${time}; \n\n 观测点：北京${target.position_name}`;
                sendToWeChat(messageMakeUp);
            }
            log.info('fetch data');
        } catch (e) {
            console.log(e);
        }
    })
}

var sendToWeChat = function (msg) {
    request.post({
        url: 'https://pushbear.ftqq.com/sub?sendkey=1572-609a8a2b5316ddd4ba94a335cf91f711',
        form: {
            text: 'PM2.5推送~',
            desp: msg
        }
    });
}

function setPushSchedule () {
    schedule.scheduleJob('00 00 * * * *', function(){
        console.log('scheduleCronstyle:' + new Date());
        log.info('fire');
        getPM25Data();
    });
}