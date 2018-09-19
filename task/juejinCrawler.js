const request = require('request');
const bunyan = require('bunyan');
const moment = require('moment');
const _ = require('lodash');

module.exports = {
    fetchAndFilterJueJinUpdate: fetchData
}

const apiUrl = 'https://timeline-merger-ms.juejin.im/v1/get_entry_by_timeline?src=web&category=5562b415e4b00c57d9b94ac8&limit=200';
let articles = [];
let isWeeklyTask = false;
let endTime = null;
let startTime = null;
async function fetchData (now, lastTaskTime) {
    let results = [];
    endTime = now;
    startTime = lastTaskTime;
    results = await requestApi();
    return results;
}

async function requestApi () {
    let results = [];
    const diff = moment(endTime).diff(startTime);
    const gapDays = moment.utc(1036800000).format('DD');
    isWeeklyTask = Number(gapDays) > 5;
    try {
        articles = await requestFunc(apiUrl);
        if (isWeeklyTask) {
            const lastTime = articles[articles.length - 1].createdAt;
            let moreArticles = await requestFunc(`${apiUrl}&before=${encodeURIComponent(lastTime)}`);
            articles = articles.concat(moreArticles);
        }
    } catch (e) {
        console.log('error' + e);
    }
    if (articles.length) {
        results = makeUpResults();
        return {
            title: '掘金前端',
            link: 'https://juejin.im/timeline',
            weight: 1,
            list: results
        };
    }
}

async function requestFunc (url) {
    return new Promise ((resolve, reject) => {
        request(url, function (error, response, body) {
            const moreData = JSON.parse(response.body);
            if (moreData.d && moreData.d.entrylist) {
                resolve(moreData.d.entrylist);
            }
            resolve(null);
        })
    })
}

function filterArticlesByDateAndCollection () {
    const threshold = isWeeklyTask ? 150 : 70;
    let results = articles.filter((article) => {
        // 偏移值五小时，避免筛掉质量好但是由于刚刚发布收藏较少的文章
        return moment(article.createdAt).isAfter(moment(startTime).subtract(5, 'hours'))
            && moment(article.createdAt).isBefore(moment(endTime).subtract(5, 'hours'))
            && article.collectionCount > threshold;
    });
    if (isWeeklyTask) {
        return results.slice(0, 10);
    }
    return results.slice(0, 8);
}

function makeUpResults () {
    let results = [];
    let originResults = _.orderBy(filterArticlesByDateAndCollection(), 'collectionCount', 'desc') || [];
    if (originResults.length) {
        originResults.forEach((article) => {
            results.push({
                title: article.title,
                link: article.originalUrl,
                createTime: article.createdAt,
                collection: article.collectionCount
            })
        })
    }
    return results;
}
