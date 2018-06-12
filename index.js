const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const config = require('./config');
import { setPushSchedule } from './task/rss';
import { database } from './mongodb';
import router from './routes';

// connect db and init model
database();

const app = new Koa();

app.use(bodyParser());
app.on('error', function (err) {
    console.error(err.stack);
    console.log(err.message);
});


app
    .use(router.routes())
    .use(router.allowedMethods())
    .listen(config.port, () => {
        console.log(`Server started, please visit: http://127.0.0.1:${config.port}`);
        setPushSchedule();
    });
