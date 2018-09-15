const jwt = require('jsonwebtoken');
const config = require('../config');
const mongoose = require('mongoose');
const User = mongoose.model('User');

export const login = async (ctx, next) => {
    const params = ctx.query;
    const userInfo = await User.findOne({
        user: params.name,
        pwd: params.pwd,
    });
    if (userInfo) {
        const variableToken = {
            random: Math.random().toString().slice(2, 8),
        }
        const token = jwt.sign(variableToken, config.secretKey, {expiresIn: '2h'});
        ctx.body = {
            success: true,
            message: '获取token成功',
            code: 200,
            sendKey: userInfo.sendKey,
            token,
        }
    } else {
        ctx.body = {
            success: false,
            message: '登录失败',
            code: 401
        }
    }
}
