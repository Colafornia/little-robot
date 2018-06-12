const mongoose = require('mongoose')
const Source = mongoose.model('Source');

// 获取所有的 RSS 数据源
export const fetchSource = async (ctx, next) => {
    const sourceList = await Source.find({}, 'title link') // 数据查询
    if (sourceList.length) {
        ctx.body = {
            success: true,
            info: sourceList
        }
    } else {
        ctx.body = {
            success: false
        }
    }
}
