const MongoClient = require('mongodb').MongoClient;
const bunyan = require('bunyan');

const log = bunyan.createLogger({
    name: 'mongo db operate'
});

module.exports = {
    getRssSourceList: getSourceList
}
async function getSourceList () {
    let result = await connectAndQueryRssSource();
    return result;
}

const connectAndQueryRssSource = function () {
    return new Promise ((resolve, reject) => {
        MongoClient.connect('mongodb://admin:admin@localhost:27017/little-robot-rss', function(err, client) {
            console.log("Connected successfully to server");
            const db = client.db('little-robot-rss');
            const collection = db.collection('source');
            let sourceList = [];
            collection.find({}).toArray(function(err, docs) {
                sourceList = docs;
                if (sourceList.length) {
                    log.info(`rss 源读取完毕，共 ${sourceList.length} 个条目-------`);
                }
                resolve(sourceList);
            })
        })
    })
}
