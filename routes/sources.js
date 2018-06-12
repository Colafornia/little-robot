const Koa = require('koa');
const Router = require('koa-router');
const app = new Koa();
const router = new Router();
const Source = require('../models/sources');

const sourceList = async function () {
    this.body = await Source.find({}).toArray
}

router.get('/', (ctx, next) => { sourceList });

module.exports = router;
