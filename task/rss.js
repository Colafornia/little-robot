const parser = require('rss-parser');
const moment = require('moment');
const axios = require('axios');
const request = require('request');
const schedule = require('node-schedule');
const bunyan = require('bunyan');
const mapLimit = require('async/mapLimit');
const timeout = require('async/timeout');
const jueJinCrawler = require('./juejinCrawler');
const Helpers = require('../utils/helpers');
const _ = require('lodash');
const dbOperate = require('../utils/rssDbOperate');
const issueOperate = require('../utils/createIssue');

import Base from '../api/base';


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

// 抓取时间
let fetchStartTime = null;

// 记录中的上次抓取时间
let lastFetchTime = null;

// 抓取次数
let fetchTimes = 0;

// 抓取定时器 ID
let fetchInterval = null;

// Boolean 是否为周汇总推送
let isWeeklyTask = false;

// Boolean 抓取状态标志
let done = false;

// 筛选过，待发送的推送数据列表
let pushList = [];

// 近期推送文章数据，用于去重
let historyArticles = [];

// 文章数 count
let count = 0;

// 是否为休息日，节假日
let isHoliday = false;

// 周汇总 issue 地址
let weeklyUrl = '';

// jwt token
let token = '';

function setPushSchedule () {
    // TODO 正式上线前恢复为 09:30
    schedule.scheduleJob('00 15 09 * * *', () => {
        // 抓取任务
        log.info('rss schedule fetching fire at ' + new Date());
        isWeeklyTask = false;
        activateFetchTask();
    });

    schedule.scheduleJob('00 00 10 * * *', () => {
        if (sourceList.length && !isHoliday) {
            // 发送任务
            log.info('rss schedule delivery fire at ' + new Date());
            isWeeklyTask = false;
            if (pushList.length) {
                let message = makeUpMessage();
                log.info(message);
                // TODO 正式上线前恢复
                // sendToWeChat(message);
                Helpers.sendLogs('Koa 版本正式发送' + message);
            }
        }
    });

    schedule.scheduleJob('00 00 09 * * 5', () => {
        if (sourceList.length) {
            // Weekly 抓取任务
            log.info('rss schedule weekly fire at ' + new Date());
            isWeeklyTask = true;
            activateFetchTask();
        }
    });
}

async function activateFetchTask () {
    await isTodayHoliday();
    if (isHoliday) {
        Helpers.sendLogs('今日休息');
        return;
    }
    // 登录获取 token
    Base.login({
        userName: process.argv[3],
        pwd: process.argv[4],
    })
    .then((res) => {
        if (res && res.data && res.data.success) {
            token = res.data.token;
            fetchData();
        }
    })
}

const fetchData = () => {
    axios.all([Base.fetchSourceList(), Base.fetchPushHistory(token)])
        .then(axios.spread((source, history) => {
            // 获取历史信息
            // 得到上次推送的具体时间与一周内的文章数据
            if (history && history.data && history.data.list) {
                handlePushHistory(history.data.list);
            } else {
                // 获取出错则默认设置昨天为上次推送时间，历史文章数据为空
                lastFetchTime = moment().subtract(1, 'days');
                historyArticles = [];
            }
            if (source.data && source.data.list && source.data.list.length) {
                handleSourceList(source.data.list);
            }
        }));
}

const isTodayHoliday = () => {
    const today = moment().format('YYYYMMDD');
    return Base.isHoliday(today)
        .then(({data}) => {
            // 工作日对应结果为 0, 休息日对应结果为 1, 节假日对应的结果为 2
            isHoliday = Boolean(data && data.data);
            return isHoliday;
        })
}

const handlePushHistory = (list) => {
    let lastPushItem = null;
    lastPushItem = list[0];
    historyArticles = _.map(_.flatMap(list, 'articles'), 'title');
    log.info('近期推送文章题目', historyArticles);
    if (isWeeklyTask) {
        historyArticles = []; // 周汇总无需统计历史，无需去重
        lastPushItem = list.find((item) => item.type === 'weekly');
    }
    lastFetchTime = lastPushItem ?
        lastPushItem.time :
        moment().subtract(1, 'days');
}

const handleSourceList = (list) => {
    sourceList = list;
    toFetchList = _.cloneDeep(sourceList);
    log.info('rss源站共' + sourceList.length);
    if (sourceList.length && !isHoliday) {
        fetchStartTime = moment().format('YYYY-MM-DD HH:mm:ss');
        log.info('rss real fetching time is' + fetchStartTime);
        launch();
    }
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
        // 原最大并发数为20，超时时间设置为 5000ms
        return mapLimit(toFetchList, 15, (source, callback) => {
            timeout(parseCheck(source, callback), 8000);
        })
    }
    log.info('fetching is done');
    clearInterval(fetchInterval);
    // 发送前以数据源的 url 为主键进行去重
    pushList = _.uniqBy(pushList, 'url');
    return fetchDataCb();
}

const parseFunction = function (source) {
    return new Promise((resolve, reject) => {
        parser.parseURL(source.url, function (err, parsed) {
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
            UpdateAfterLastPush(parsed.feed.entries).length) {
            // 筛出更新时间满足条件的文章
            // RSS 源的文章限制最多五篇
            // 避免由于源不稳定造成的推送过多
            let articlesUpdateAfterLastPush = UpdateAfterLastPush(parsed.feed.entries).slice(0, 5);
            log.info(`${source.title} 今天有新文章 ${articlesUpdateAfterLastPush.length} 篇`)
            const result = Object.assign({}, source, { list: articlesUpdateAfterLastPush });
            count = count + articlesUpdateAfterLastPush.length;
            pushList.push(result);
        } else {
            log.info(`${source.title} 今天有新文章0篇`);
        }
        // 删掉 toFetchList 中已抓取成功的源
        const index = _.findIndex(toFetchList, (item) => item && item.url === source.url);
        toFetchList[index] = null;
        callback();
    } catch (e) {
        callback();
    }
}

const UpdateAfterLastPush = function (entries) {
    let result = [];
    let list = entries.concat([]);
    const allArticles = _.flatMap(pushList, 'list');
    const allArticlesTitle = _.map(allArticles, 'title');
    while (list[0] && list[0].pubDate && isPubDateMatch(list[0].pubDate)) {
        result.push(list[0]);
        list.shift();
    }
    // 去重，历史数据查重，本次抓取数据查重
    if (_.find(result, (art) => historyArticles.includes(art.title) ||
        allArticlesTitle.includes(art.title))) {
        let hit = _.find(result, (art) => historyArticles.includes(art.title) ||
        allArticlesTitle.includes(art.title));
        log.info('发现重复文章', hit.title);
    }
    result = _.filter(result, (art) => !historyArticles.includes(art.title) &&
    !allArticlesTitle.includes(art.title));
    return result;
}

const isPubDateMatch = (pubDate) => {
    const timestamp = Date.parse(pubDate);
    return moment(timestamp).isAfter(lastFetchTime);
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
        msg += '历史推送可在[周推送汇总](https://github.com/Colafornia/little-robot/issues)查看';
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
        // TODO 上线前恢复
        // if (isWeeklyTask) {
        //     issueOperate.createIssue(`${moment().subtract(7, 'days').format('YYYY-MM-DD')} ~ ${moment().format('YYYY-MM-DD')}`, message)
        //         .then((res) => {
        //             weeklyUrl = res || '';
        //         })
        // }
        Helpers.sendLogs('Koa 版本 log' + message);
        const allArticles = _.flatMap(pushList, 'list');
        Base.insertPushHistory({
            type: isWeeklyTask ? 'weekly' : 'daily',
            time: fetchStartTime,
            content: message,
            articles: _.map(allArticles, (article) => _.pick(article, ['title', 'link']))
        }, token);
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
    jueJinCrawler.fetchAndFilterJueJinUpdate(fetchStartTime, lastFetchTime)
        .then((res) => {
            if (res.list && res.list.length) {
                let result = res;
                let articles = res.list;
                // 掘金数据查重过滤
                articles = _.filter(articles, (art) => !historyArticles.includes(art.title));
                result.list = articles;
                log.info(`掘金 今天有新文章${articles.length}篇`);
                pushList = pushList.concat(result);
                count += articles.length;
            }
            // 设置循环抓取定时器，每隔两分钟抓取一次
            fetchInterval = setInterval(fetchRSSUpdate, 120000);
            fetchRSSUpdate();
        })
}
