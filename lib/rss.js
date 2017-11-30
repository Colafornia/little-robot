const parser = require('rss-parser');
const moment = require('moment');
const request = require('request');
const schedule = require('node-schedule');
const sourceList = require('../config/rssSource');

module.exports = {
    setPushSchedule: setPushSchedule
}

let pushList = [];
let parsePromises = [];
let count = 0;

function setPushSchedule () {
    schedule.scheduleJob('00 00 * * * *', function(){
        console.log('scheduleCronstyle:' + new Date());
        launch();
    });
}

const parseFunction = function  (source) {
    return new Promise ((resolve) => {
        parser.parseURL(source.url, function(err, parsed) {
            if (parsed && parsed.feed && parsed.feed.entries.length &&
                updatedInLastWeek(parsed.feed.entries).length) {
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
    });
}

const launch = function () {
    sourceList.forEach((source) => {
        parsePromises.push(parseFunction(source))
    })

    Promise.all(parsePromises)
        .then(() => {
            console.log('done');
            let message = makeUpMessage();
            console.log(message)
            sendToWeChat(message);
        })
}