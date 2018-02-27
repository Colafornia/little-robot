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
const dbOperate = require('../utils/rssDbOperate');
const issueOperate = require('../utils/createIssue');


module.exports = {
    setPushSchedule: setPushSchedule
}
const log = bunyan.createLogger({
    name: 'rss schedule'
});

// mongodb 中存储的 RSS 源列表
let sourceList = [];

// 初始值为 sourceList 的深拷贝版本，用于循环抓取中使用
// 存放待抓取的源列表
let toFetchList = [];

// 抓取次数
let fetchTimes = 0;

// 抓取定时器 ID
let fetchInterval = null;

// Boolean 抓取状态标志
let done = false;

// 筛选过，待发送的推送数据列表
let pushList = [];

// 文章数 count
let count = 0;

// 抓取的时间间隔
// TODO: 需要将时间间隔更精确
let hours = 24;

// 免扰日
let silentWeekDays = [6, 0];

// 周汇总 issue 地址
let weeklyUrl = '';

dbOperate.getRssSourceList()
    .then((res) => {
        sourceList = res;
        toFetchList = _.cloneDeep(sourceList);
    })

function setPushSchedule () {
    schedule.scheduleJob('00 30 09 * * *', () => {
        // 抓取任务
        log.info('rss schedule fetching fire at '+ new Date());
        log.info('rss源站共' + sourceList.length);
        hours = 24;
        if (moment().weekday() === 1) {
            hours = 72;
        }
        if (sourceList.length && !silentWeekDays.includes(moment().weekday())) {
            launch();
        }
    });

    schedule.scheduleJob('00 00 10 * * *', () => {
        if (sourceList.length && !silentWeekDays.includes(moment().weekday())) {
            // 发送任务
            log.info('rss schedule delivery fire at '+ new Date());
            if (pushList.length) {
                let message = makeUpMessage();
                log.info(message);
                sendToWeChat(message);
            }
        }
    });

    schedule.scheduleJob('00 00 09 * * 5', () => {
        if (sourceList.length) {
            // Weekly 抓取任务
            log.info('rss schedule weekly fire at '+ new Date());
            hours = 120;
            launch();
        }
    });
}

const fetchRSSUpdate = function () {
    fetchTimes++;
    if (fetchTimes > 1) {
        // 过滤掉抓取成功的源
        toFetchList = toFetchList.filter((item) => !_.isNull(item));
    }
    if (toFetchList.length && fetchTimes < 4) {
        // 若抓取次数少于三次，且仍存在未成功抓取的源
        log.info(`第${fetchTimes}次抓取，有 ${toFetchList.length} 篇`);
        // 最大并发数为10，超时时间设置为 5000ms
        return mapLimit(toFetchList, 10, (source, callback) =>{
            timeout(parseCheck(source, callback), 5000);
        })
    }
    log.info('fetching is done');
    clearInterval(fetchInterval);
    // 发送前以数据源的 url 为主键进行去重
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
                // 筛出更新时间满足条件的文章
                // RSS 源的文章限制最多五篇
                // 避免由于源不稳定造成的推送过多
                let articlesUpdatedInLastWeek = updatedInLastWeek(parsed.feed.entries).slice(0, 5);
                log.info(`${source.title} 今天有新文章 ${articlesUpdatedInLastWeek.length} 篇`)
                const result = Object.assign({}, source, {list: articlesUpdatedInLastWeek});
                count = count + articlesUpdatedInLastWeek.length;
                pushList.push(result);
        } else {
            log.info(`${source.title} 今天有新文章0篇`);
        }
        // 删掉 toFetchList 中已抓取成功的源
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
        msg += `新鲜货${count}篇\n\n`;
        if (moment().weekday() === 5 && weeklyUrl) {
            msg += `周末愉快~\n\n[本周推送汇总](${weeklyUrl})已生成\n\n`;
        }
        pushList.forEach((push, index) => {
            msg += `${index}.${push.title} | ${push.list.length}篇 \n\n`;
            push.list.forEach((article) => {
                msg += `[${article.title}](${article.link})\n\n`;
            })
        })
        msg += '历史推送可在[周推送汇总](https://github.com/MechanicianW/little-robot/issues)查看';
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
        dbOperate.getRssSourceList();
        log.error('error:', error);
        log.info('statusCode:', response && response.statusCode);
        log.info('body:', body);
    });
}


const fetchDataCb = (err, result) => {
    // 数据源抓取完成的回调函数
    if (done) {
        return;
    }
    done = true;
    clearInterval(fetchInterval);
    log.info('fetching callback');
    if (pushList.length) {
        // 抓取完成 推送日志
        // 按抓取源权重排序
        pushList = _.orderBy(pushList, 'weight', 'desc');
        let message = makeUpMessage();
        Helpers.sendLogs(message);
        dbOperate.insertPushHistory({
            time: moment().format('YYYY-MM-DD'),
            content: message
        });
        if (moment().weekday() === 5 && hours > 100) {
            issueOperate.createIssue(`${moment().subtract(hours, 'hours').format('YYYY-MM-DD')} ~ ${moment().format('YYYY-MM-DD')}`, message)
                .then((res) => {
                    console.log(res);
                    weeklyUrl = res || '';
                })
        }
    }
    if (err) {
        log.warn(err);
    }
}

const launch = function () {
    pushList = [];
    count = 0;
    // 重置循环抓取的相关变量
    toFetchList = _.cloneDeep(sourceList);
    done = false;
    fetchTimes = 0;
    jueJinCrawler.fetchAndFilterJueJinUpdate(hours)
        .then((res) => {
            log.info(`掘金 今天有新文章${res.list.length}篇`);
            pushList = pushList.concat(res);
            count += res.list.length;
            // 设置循环抓取定时器，每隔两分钟抓取一次
            fetchInterval = setInterval(fetchRSSUpdate, 120000);
            fetchRSSUpdate();
        })
}
