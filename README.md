# little-robot
一些练习、自用的脚本

每天由定时任务通过 [PushBear](https://pushbear.ftqq.com/admin/#/) 推送到微信

## RSS 新文章推送

<img src="https://s1.ax1x.com/2018/04/27/C3NaDA.md.jpg" width="320">

工作日每早十点，微信推送我订阅的 RSS源 24小时内的更新

目前将RSS源维护在 <del>`config` 文件</del> 服务器的数据库中

每周推送汇总位于 [issues](https://github.com/Colafornia/little-robot/issues)

目前订阅源主要为前端资讯，均为个人口味，欢迎新的订阅源推荐

**扫码即可获得推送服务：**

<img src="https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=gQFT8TwAAAAAAAAAAS5odHRwOi8vd2VpeGluLnFxLmNvbS9xLzAyek9QVU5JQ2ZlNjAxMDAwMDAwN1kAAgRGvR9aAwQAAAAA" width="200">

## TODO

- [x] RSS源维护到 MongoDB 中
- [x] 循环抓取，避免源不稳定引发的问题
- [x] 汇总历史到 issue
- [x] 简单的文章去重
- [x] 搭建 Koa Server
- [x] 精准设置 RSS 推送间隔时间
- [x] 法定假日，双休日均不推送
- [ ] 提供推送历史浏览页面
