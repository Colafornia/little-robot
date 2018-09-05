import axios from 'axios';
import service from './index';

class Base {
    login = params => {
        return service.get(
            `/login?name=${params.userName}&pwd=${params.pwd}`,
            params
        );
    }
    fetchSourceList = params => {
        return service.get(`/source`, params);
    }
    fetchPushHistory = (token) => {
        return service.get('/push/history/list', { token });
    }
    insertPushHistory = (params, token) => {
        return service.post(
            '/push/history/insert',
            JSON.stringify(params),
            {token},
        );
    }
    isHoliday = (today) => {
        return service.get(`http://api.goseek.cn/Tools/holiday?date=${today}`)
    }
    createIssue = (user, pwd, date, content) => {
        const data = JSON.stringify({
            title: '新鲜货 [ ' + date + ' ]',
            body: content,
            labels: ['Weekly']
        });
        const options = {
            headers: {
                'authorization': 'Basic ' + new Buffer(user + ':' + pwd, 'ascii').toString('base64'),
                'User-Agent': user
            },
            gzip: true
        }
        return axios.post(
            `https://api.github.com/repos/${user}/little-robot/issues`,
            data,
            options);
    }
}

export default new Base();
