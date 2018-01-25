const MongoClient = require('mongodb').MongoClient;
const bunyan = require('bunyan');

const log = bunyan.createLogger({
    name: 'mongo db operate'
});

module.exports = {
    getRssSourceList: getSourceList,
    insertPushHistory: insertPushHistory
}
async function getSourceList () {
    let result = await queryRssSource();
    return result;
}

let db = null;
const connect = function () {
    return new Promise ((resolve, reject) => {
        MongoClient.connect('mongodb://admin:admin@localhost:27017/little-robot-rss', function(err, client) {
            console.log("Connected successfully to server");
            db = client.db('little-robot-rss');
            resolve();
        })
    })
}

const queryRssSource = function () {
    return new Promise ((resolve, reject) => {
        let sourceList = [];
        connect()
            .then(() => {
                const collection = db.collection('source');
                collection.find({}).toArray(function (err, docs) {
                    sourceList = docs;
                    if (sourceList.length) {
                        log.info(`rss 源读取完毕，共 ${sourceList.length} 个条目-------`);
                    }
                    resolve(sourceList);
                })
            })
    })
}

function insertPushHistory (obj) {
    connect()
        .then(() => {
            if (db) {
                const collection = db.collection('historyByDay');
                collection.insert(obj);
            }
        })
}
