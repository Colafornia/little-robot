const parser = require('rss-parser');
const moment = require('moment');
const request = require('request');
const schedule = require('node-schedule');
const bunyan = require('bunyan');
const mapLimit = require('async/mapLimit');
const timeout  = require('async/timeout');
const jueJinCrawler = require('./juejinCrawler');
const Helpers = require('../utils/helpers');
const _  = require('lodash');
const getSourceList = require('../utils/getRssSourceFormDB').getRssSourceList;

module.exports = {
    setPushSchedule: setPushSchedule
}
const log = bunyan.createLogger({
    name: 'rss schedule'
});
let sourceList = [];
let toFetchList = [];
let fetchTimes = 0;
let fetchInterval = null;
let done = false;
let pushList = [];
let parsePromises = [];
let count = 0;
let hours = 24;
let silentWeekDays = [6, 0];

getSourceList()
    .then((res) => {
        sourceList = res;
        toFetchList = res.concat([]);
    })

function setPushSchedule () {
    schedule.scheduleJob('00 30 09 * * *', () => {
        log.info('rss schedule fetching fire at '+ new Date());
        log.info('rss源站共' + sourceList.length);
        hours = 23;
        if (moment().weekday() === 1) {
            hours = 72;
        }
        if (sourceList.length && !silentWeekDays.includes(moment().weekday())) {
            launch();
        }
    });

    schedule.scheduleJob('00 00 10 * * *', () => {
        log.info('rss schedule delivery fire at '+ new Date());
        if (pushList.length) {
            let message = makeUpMessage();
            log.info(message);
            sendToWeChat(message);
            toFetchList = _.cloneDeep(sourceList);
            pushList = [];
            done = false;
            fetchTimes = 0;
        }
    });
}

const fetchRSSUpdate = function () {
    fetchTimes++;
    if (fetchTimes > 1) {
        toFetchList = toFetchList.filter((item) => !_.isNull(item));
    }
    if (toFetchList.length && fetchTimes < 4) {
        log.info(`第${fetchTimes}次抓取，有 ${toFetchList.length} 篇`);
        return mapLimit(toFetchList, 10, (source, callback) =>{
            timeout(parseCheck(source, callback), 5000);
        })
    }
    log.info('fetching is done');
    clearInterval(fetchInterval);
    pushList = _.uniqBy(pushList, 'url');
    return fetchDataCb();
}
const parseFunction = function  (source) {
    return new Promise ((resolve, reject) => {
        parser.parseURL(source.url, function(err, parsed) {
            if (err) {
                log.warn(`${source.title}出错：${err}`);
                reject(err);
            } else {
                resolve(parsed);
            }
        })
    })
}

async function parseCheck (source, callback) {
    let parsed = null;
    try {
        parsed = await parseFunction(source);
        if (parsed && parsed.feed && parsed.feed.entries.length &&
            updatedInLastWeek(parsed.feed.entries).length) {
                let articlesUpdatedInLastWeek = updatedInLastWeek(parsed.feed.entries).slice(0, 5);
                log.info(`${source.title} 今天有新文章 ${articlesUpdatedInLastWeek.length} 篇`)
                const result = Object.assign({}, source, {list: articlesUpdatedInLastWeek});
                count = count + articlesUpdatedInLastWeek.length;
                pushList.push(result);
        } else {
            log.info(`${source.title} 今天有新文章0篇`);
        }
        const index = _.findIndex(toFetchList, (item) =>  item && item.url === source.url);
        toFetchList[index] = null;
        callback();
    } catch (e) {
        callback();
    }
}

const updatedInLastWeek = function (entries) {
    let result = [];
    let list = entries.concat([]);
    while (list[0] && list[0].pubDate && moment(new Date (list[0].pubDate)).isAfter(moment().subtract(hours, 'hours'))) {
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
        msg += '最近添加了循环抓取的流程，还在试验中，如果有奇怪的推送结果，不要慌张~\n\n';
        pushList.forEach((push, index) => {
            msg += `${index}.${push.title} | ${push.list.length}篇 \n\n`;
            push.list.forEach((article) => {
                msg += `[${article.title}](${article.link})\n\n`;
            })
        })
        msg += '欢迎向[issue](https://github.com/MechanicianW/little-robot/issues/1)提供推荐的 RSS 订阅源';
    }
    return Helpers.filterEmoji(msg);
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


const sendLogs = function (message) {
    request.post({
        url: 'https://pushbear.ftqq.com/sub?sendkey=1577-30546f73bf47c4e3962382becf5f9ab8',
        form: {
            text: 'logs',
            desp: message
        }
    }, function (error, response, body) {
        log.error('error:', error);
        log.info('statusCode:', response && response.statusCode);
        log.info('body:', body);
    });
}

const fetchDataCb = (err, result) => {
    if (done) {
        return;
    }
    done = true;
    clearInterval(fetchInterval);
    log.info('fetching callback');
    if (pushList.length) {
        let message = makeUpMessage();
        sendLogs(message);
    }
    if (err) {
        log.warn(err);
    }
}

const launch = function () {
    pushList = [];
    parsePromises = [];
    count = 0;
    jueJinCrawler.fetchAndFilterJueJinUpdate(hours)
        .then((res) => {
            log.info(`掘金 今天有新文章${res.list.length}篇`);
            pushList = pushList.concat(res);
            count += res.list.length;
            fetchInterval = setInterval(fetchRSSUpdate, 120000);
            fetchRSSUpdate();
        })
}
