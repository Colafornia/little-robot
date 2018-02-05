const request = require('request');
const dbOperate = require('../utils/rssDbOperate');

module.exports = {
    createIssue: createIssue
}

let info = null;

async function createIssue (date, content) {
    info = await dbOperate.fetchGithubInfo();
    return await requestApi(date, content);
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
            labels: ['Weekly']
        }),
        gzip: true
    }
    return new Promise ((resolve, reject) => {
        request.post(options, function (error, response, body) {
            if (!error) {
                console.log('Created issue done!');
                const resp = JSON.parse(response.body);
                resolve(resp.url);
            }
            resolve(null);
        })
    })
}
