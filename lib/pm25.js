var schedule = require('node-schedule');
var request = require('request');
var bunyan = require('bunyan');

module.exports = {
    setPushSchedule: setPushSchedule
}

var pmUrl = 'https://free-api.heweather.com/s6/air?location=beijing&key=5e1e3d5610cc45ad97f6049b72d5fd72';
var weatherUrl = 'https://free-api.heweather.com/s6/weather?location=beijing&key=5e1e3d5610cc45ad97f6049b72d5fd72';
var log = bunyan.createLogger({
    name: 'pm2.5 schedule'
});
var result = '';

var fetchData = async function () {
    result = '';
    result += await getWeatherData();
    result += await getPM25Data();
    await sendToWeChat(result);
}
var getPM25Data = function () {
    return new Promise ((resolve, reject) => {
        var msg = '';
        request(pmUrl, function (error, response, body) {
            var data = JSON.parse(response.body);
            if (data.HeWeather6 && data.HeWeather6.length) {
                try {
                    var target = data.HeWeather6[0];
                    if (target) {
                        var now = target.air_now_city;
                        msg += `空气质量：${now.qlty};\n\npm2.5指数：${now.pm25};`;
                        log.info(`fetch air data ${msg}------`);
                    }
                } catch (e) {
                    console.log(e);
                }
            }
            resolve(msg);
        })
    })
}

var getWeatherData = function () {
    return new Promise ((resolve, reject) => {
        var msg = '';
        request(weatherUrl, function (error, response, body) {
            var data = JSON.parse(response.body);
            if (data.HeWeather6 && data.HeWeather6.length) {
                try {
                    var target = data.HeWeather6[0];
                    if (target) {
                        var now = target.now;
                        var life = target.lifestyle;
                        msg += `今日天气：${now.cond_txt};\n\n温度：${now.tmp}摄氏度，${life[0].brf};\n\n`
                        log.info(`fetch weather data ${msg}------`);
                    }
                } catch (e) {
                    console.log(e)
                }
            }
            resolve(msg);
        })
    })
}

var sendToWeChat = function (msg) {
    request.post({
        url: 'https://pushbear.ftqq.com/sub?sendkey=1572-609a8a2b5316ddd4ba94a335cf91f711',
        form: {
            text: '今日天气',
            desp: msg
        }
    });
}

function setPushSchedule () {
    schedule.scheduleJob('00 30 09 * * *', function(){
        console.log('scheduleCronstyle:' + new Date());
        log.info('fire');
        fetchData();
    });
}
