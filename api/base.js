import axios from 'axios';
const config = require('../config');

class Base {
    fetchSourceList = params => {
        axios.get(`http://localhost:${config.port}/source`, params);
    }
    fetchPushHistory = params => {
        axios.get(`http://localhost:${config.port}/push/history/list`, params);
    }
    insertPushHistory = params => {
        axios.post(`http://localhost:${config.port}/push/history/insert`, params);
    }
}

export default new Base();
