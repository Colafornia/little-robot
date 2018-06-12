import { fetchSource } from '../controllers/source';
import { fetchPushHistory, insertPushHistory } from '../controllers/pushHistory';

const router = require('koa-router')();

router.get('/', (ctx, next) => {
        ctx.body = 'Hello World!';
    })
    .get('/source', fetchSource)
    .get('/push/history/list', fetchPushHistory)
    .post('/push/history/insert', insertPushHistory)

module.exports = router;
