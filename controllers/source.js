const mongoose = require('mongoose')
const Source = mongoose.model('Source');

export const fetchSource = async (ctx, next) => {
    const sourceList = await Source.find({}) // 数据查询
    if (sourceList.length) {
        ctx.body = {
            success: true,
            list: sourceList
        }
    } else {
        ctx.body = {
            success: false
        }
    }
}
