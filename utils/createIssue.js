const request = require('request');
const dbOperate = require('../utils/rssDbOperate');

module.exports = {
    createIssue: createIssue
}

let info = null;
function createIssue (date, content) {
    dbOperate.fetchGithubInfo()
        .then((res) => {
            if (res) {
                info = res;
                requestApi(date, content);
            }
        })
}

function requestApi (date, content) {
    const options = {
        url: 'https://api.github.com/repos/' + info.user + '/' + info.repo+ '/issues',
        headers: {
            'authorization': 'Basic ' + new Buffer(info.user + ':' + info.pwd, 'ascii').toString('base64'),
            'User-Agent': info.user
        },
        body: JSON.stringify({
            title: '新鲜货 [ ' + date + ' ]',
            body: content,
            labels: ['每日推送']
        }),
        gzip: true
    }
    request.post(options, function (error, response, body) {
        if (!error) {
            console.log('Created issue done!')
        }
    })
}
