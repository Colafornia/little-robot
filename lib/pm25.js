var schedule = require('node-schedule');
var request = require('request');
var bunyan = require('bunyan');
var moment = require('moment');

module.exports = {
    setPushSchedule: setPushSchedule
}

var pmUrl = 'http://www.pm25.in/api/querys/pm2_5.json?city=beijing&token=5j1znBVAsnSf5xQyNQyq';
var weatherUrl = 'https://api.seniverse.com/v3/robot/talk.json?key=wv6xzeos5gd97ry8&q=%E5%8C%97%E4%BA%AC%E4%BB%8A%E5%A4%A9%E5%A4%A9%E6%B0%94%E6%80%8E%E4%B9%88%E6%A0%B7%EF%BC%9F';
var log = bunyan.createLogger({
    name: 'pm2.5 schedule'
});
var getPM25Data = function () {
    request(pmUrl, function (error, response, body) {
        var data = JSON.parse(response.body);
        try {
            var target = data.find((item) => item.station_code === '1005A');
            if (target) {
                var time = moment(target.time_point).format('YYYY-MM-DD HH:mm:ss');
                var messageMakeUp = `空气质量：${target.quality};\n\n 当前颗粒物平均： ${target.pm2_5}; \n\n数据发布的时间：${time}; \n\n 观测点：北京${target.position_name}`;
                sendToWeChat(messageMakeUp);
                log.info(`fetch data ${messageMakeUp}------`);
            }
        } catch (e) {
            console.log(e);
        }
    })
}

var getWeatherData = function () {
    request(weatherUrl, function (error, response, body) {
        var data = JSON.parse(response.body);
        try {
            var results = data.results;
            if (results && results.length) {
                var target = results[0].reply;
                if (target) {
                    sendToWeChat('早上好~', target.plain);
                    log.info(`fetch data ${target.plain}------`);
                }
            }
        } catch (e) {
            console.log(e)
        }
    })
}

var sendToWeChat = function (text, msg) {
    request.post({
        url: 'https://pushbear.ftqq.com/sub?sendkey=1572-609a8a2b5316ddd4ba94a335cf91f711',
        form: {
            text: text || '晚间PM2.5推送~',
            desp: msg
        }
    });
}

function setPushSchedule () {
    schedule.scheduleJob('00 30 09 * * *', function(){
        console.log('scheduleCronstyle:' + new Date());
        log.info('fire');
        getWeatherData();
    });
    schedule.scheduleJob('00 30 19 * * *', function(){
        console.log('scheduleCronstyle:' + new Date());
        log.info('fire');
        getPM25Data();
    });
}
