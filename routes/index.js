import { fetchSource } from '../controllers/source';
import { fetchPushHistory, insertPushHistory } from '../controllers/pushHistory';
import { login } from '../controllers/auth';

const router = require('koa-router')();

router.get('/', (ctx, next) => {
        ctx.body = 'Hello World!';
    })
    .get('/api/login', login)
    .get('/api/source', fetchSource)
    .get('/api/push/history/list', fetchPushHistory)
    .post('/api/push/history/insert', insertPushHistory)

module.exports = router;
