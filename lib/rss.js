const parser = require('rss-parser');
const moment = require('moment');
const request = require('request');
const schedule = require('node-schedule');
const bunyan = require('bunyan');
const sourceList = require('../config/rssSource');

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
    schedule.scheduleJob('00 15 * * * *', function(){
        log.info('rss schedule fire at'+ new Date())
        launch();
    });
}

const parseFunction = function  (source) {
    return new Promise ((resolve) => {
        parser.parseURL(source.url, function(err, parsed) {
            if (parsed && parsed.feed && parsed.feed.entries.length &&
                updatedInLastWeek(parsed.feed.entries).length) {
                    log.info(`${source.titl} 本周有新文章 ${updatedInLastWeek(parsed.feed.entries).length} 篇`)
                    const result = Object.assign({}, source, {list: updatedInLastWeek(parsed.feed.entries)});
                    count = count + updatedInLastWeek(parsed.feed.entries).length;
                    pushList.push(result);
            }
            resolve('success');
        })
    })
}

const updatedInLastWeek = function (list) {
    return list.slice(0, 10).filter((item) => {
        return item.pubDate && moment(item.pubDate).startOf('week').isSame(moment().startOf('week'), 'week');
    })
}
const makeUpMessage = function () {
    let msg = '';
    if (!pushList.length) {
        msg = '暂时还没有新增文章~';
    } else {
        msg += `新鲜货${count}篇\n\n`;
        pushList.forEach((push, index) => {
            msg += `${index}.${push.title} ${push.list.length}篇 \n\n`;
            push.list.forEach((article) => {
                msg += `[${article.title}](${article.link})\n\n`;
            })
        })
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
    sourceList.forEach((source) => {
        parsePromises.push(parseFunction(source))
    })

    Promise.all(parsePromises)
        .then(() => {
            log.info('done');
            let message = makeUpMessage();
            log.info(message);
            sendToWeChat(message);
        })
}