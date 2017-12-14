const request = require('request');
const bunyan = require('bunyan');
const moment = require('moment');

module.exports = {
    fetchAndFilterJueJinUpdate: fetchData
}

const apiUrl = 'https://timeline-merger-ms.juejin.im/v1/get_entry_by_timeline?src=web&category=5562b415e4b00c57d9b94ac8&limit=50';
let articles = [];
async function fetchData (hours) {
    let results = [];
    results = await requestApi(hours);
    return results;
}

function requestApi (hours) {
    return new Promise ((resolve, reject) => {
        let results = [];
        request(apiUrl, function (error, response, body) {
            const data = JSON.parse(response.body);
            if (data.d && data.d.entrylist) {
                articles = data.d.entrylist;
                if (articles.length) {
                    results = makeUpResults(hours);
                }
                console.log(results);
                resolve({
                    title: '掘金前端',
                    link: 'https://juejin.im/timeline',
                    list: results
                });
            }
        })
    })
}

function filterArticlesByDateAndCollection (hours) {
    return articles.filter((article) => {
        // 偏移值五小时，避免筛掉质量好但是由于刚刚发布收藏较少的文章
        return moment(article.createdAt).isAfter(moment().subtract(hours + 5, 'hours'))
            && moment(article.createdAt).isBefore(moment().subtract(5, 'hours'))
            && article.collectionCount > 30;
    });
}

function makeUpResults (hours) {
    let results = [];
    let originResults = filterArticlesByDateAndCollection(hours) || [];
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
