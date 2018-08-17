const mongoose = require('mongoose');
const Helpers = require('../utils/helpers');
const PushHistory = mongoose.model('PushHistory');

export const fetchPushHistory = async (ctx, next) => {
    // 数据查询
    // 倒序查找最近 10 条
    const list = await PushHistory.find({}).sort({_id:-1}).limit(10);
    if (list.length) {
        ctx.body = {
            success: true,
            list,
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
