const parser = require('rss-parser');
const moment = require('moment');
const request = require('request');
const schedule = require('node-schedule');
const bunyan = require('bunyan');
const sourceList = require('../config/rssSource');
const mapLimit = require('async/mapLimit');

module.exports = {
    setPushSchedule: setPushSchedule
}
const log = bunyan.createLogger({
    name: 'rss schedule'
});
let pushList = [];
let parsePromises = [];
let count = 0;

function setPushSchedule () {
    schedule.scheduleJob('00 00 10 * * *', function(){
        log.info('rss schedule fire at '+ new Date());
        log.info('rss源站共' + sourceList.length);
        launch();
    });
    schedule.scheduleJob('00 00 18 * * *', function(){
        log.info('rss schedule fire at '+ new Date());
        log.info('rss源站共' + sourceList.length);
        launch();
    });
}

const parseFunction = function  (source) {
    return new Promise ((resolve, reject) => {
        parser.parseURL(source.url, function(err, parsed) {
            resolve(parsed);
        })
    })
}

async function parseCheck (source, callback) {
    let parsed = null;
    try {
        parsed = await parseFunction(source);
        if (parsed && parsed.feed && parsed.feed.entries.length &&
            updatedInLastWeek(parsed.feed.entries).length) {
                log.info(`${source.title} 今天有新文章 ${updatedInLastWeek(parsed.feed.entries).length} 篇`)
                const result = Object.assign({}, source, {list: updatedInLastWeek(parsed.feed.entries)});
                count = count + updatedInLastWeek(parsed.feed.entries).length;
                pushList.push(result);
        } else {
            log.info(`${source.title} 今天有新文章0篇`)
        }
        callback();
    } catch (e) {
        log.warn(e);
    }
}

const updatedInLastWeek = function (entries) {
    let result = [];
    let list = entries.concat([]);
    while (list[0] && list[0].pubDate && moment(new Date (list[0].pubDate)).isAfter(moment().subtract(23, 'hours'))) {
        result.push(list[0]);
        list.shift();
    }
    return result;
}
const makeUpMessage = function () {
    let msg = '';
    if (!pushList.length) {
        msg = '暂时还没有新增文章~';
    } else {
        msg += `今日新鲜货${count}篇\n\n`;
        pushList.forEach((push, index) => {
            msg += `${index}.${push.title} | ${push.list.length}篇 \n\n`;
            push.list.forEach((article) => {
                msg += `[${article.title}](${article.link})\n\n`;
            })
        })
        msg += '欢迎向[issue](https://github.com/MechanicianW/little-robot/issues/1)提供推荐的 RSS 订阅源';
    }
    return msg;
}

const sendToWeChat = function (message) {
    request.post({
        url: 'https://pushbear.ftqq.com/sub?sendkey=1569-b7bcd67b825bb46ece65ce8ed68d045f',
        form: {
            text: '今日推送',
            desp: message
        }
    }, function (error, response, body) {
        log.error('error:', error);
        log.info('statusCode:', response && response.statusCode);
        log.info('body:', body);
    });
}

const launch = function () {
    mapLimit(sourceList, 10, (source, callback) =>{
        parseCheck(source, callback);
    }, (err, result) => {
        if (err) {
            log.warn(err);
        }
        if (pushList.length) {
            let message = makeUpMessage();
            log.info(message);
            sendToWeChat(message);
        }
    })
}

