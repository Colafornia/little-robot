const mongoose = require('mongoose')
const PushHistory = mongoose.model('PushHistory');

export const fetchPushHistory = async (ctx, next) => {
    const list = await PushHistory.find({}) // 数据查询
    if (list.length) {
        ctx.body = {
            success: true,
            info: list
        }
    } else {
        ctx.body = {
            success: false
        }
    }
}

export const insertPushHistory = async (ctx, next) => {
    const opts = ctx.request.body;
    const newRecord = new PushHistory(opts);
    const insertRecord = await newRecord.save();
    const list = await PushHistory.find({}) // 数据查询
    if (insertRecord) {
        ctx.body = {
            success: true,
            record: insertRecord
        }
    } else {
        ctx.body = {
            success: false
        }
    }
}
