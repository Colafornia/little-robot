const request = require('request');
const bunyan = require('bunyan');
const moment = require('moment');
const _ = require('lodash');

module.exports = {
    fetchAndFilterJueJinUpdate: fetchData
}

const apiUrl = 'https://timeline-merger-ms.juejin.im/v1/get_entry_by_timeline?src=web&category=5562b415e4b00c57d9b94ac8&limit=200';
let articles = [];
async function fetchData (hours) {
    let results = [];
    results = await requestApi(hours);
    return results;
}

async function requestApi (hours) {
    let results = [];
    try {
        articles = await requestFunc(apiUrl);
        if (hours > 100) {
            const lastTime = articles[articles.length - 1].createdAt;
            let moreAtricles = await requestFunc(`${apiUrl}&before=${encodeURIComponent(lastTime)}`);
            articles = articles.concat(moreAtricles);
        }
    } catch (e) {
        console.log('error' + e);
    }
    if (articles.length) {
        results = makeUpResults(hours);
        console.log(results);
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

function filterArticlesByDateAndCollection (hours) {
    const threshold = hours > 100 ? 150 : 70;
    return articles.filter((article) => {
        // 偏移值五小时，避免筛掉质量好但是由于刚刚发布收藏较少的文章
        return moment(article.createdAt).isAfter(moment().subtract(hours + 5, 'hours'))
            && moment(article.createdAt).isBefore(moment().subtract(5, 'hours'))
            && article.collectionCount > threshold;
    });
}

function makeUpResults (hours) {
    let results = [];
    let originResults = _.orderBy(filterArticlesByDateAndCollection(hours), 'collectionCount', 'desc') || [];
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
