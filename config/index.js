
module.exports = {
    dbPath: `mongodb://admin:admin@${process.argv[5]}:27017/little-robot`,
    port: 3001,
    secretKey: process.argv[2],
}
