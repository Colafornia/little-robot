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
}

export default new Base();
