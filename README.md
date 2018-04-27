# little-robot
一些练习、自用的脚本

每天由定时任务通过 [PushBear](https://pushbear.ftqq.com/admin/#/) 推送到微信

## RSS 新文章推送

<img src="https://s1.ax1x.com/2018/04/27/C3NaDA.md.jpg" width="200">

每早十点，微信推送我订阅的 RSS源 24小时内的更新

目前将RSS源维护在 <del>`config` 文件</del> 服务器的数据库中

每周推送汇总位于 [issues](https://github.com/Colafornia/little-robot/issues)

扫码即可获得推送服务：

<img src="https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=gQFT8TwAAAAAAAAAAS5odHRwOi8vd2VpeGluLnFxLmNvbS9xLzAyek9QVU5JQ2ZlNjAxMDAwMDAwN1kAAgRGvR9aAwQAAAAA" width="150" height="150">

## TODO

- [x] 一并推送天气信息
- [x] RSS源维护到 MongoDB 中
- [x] 循环抓取，避免源不稳定引发的问题
- [x] 汇总历史到 issue
- [ ] 简单的文章去重
- [ ] 为推送时间的修改和订阅源的添加提供 API
- [ ] 精准设置 RSS 推送间隔时间
