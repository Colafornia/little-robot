# little-robot
一些练习、自用的脚本

每天由定时任务通过 [PushBear](https://pushbear.ftqq.com/admin/#/) 推送到微信

## 朝阳群众的PM2.5数据推送

早九晚七，推送朝阳区PM2.5数据与天气，避免出门忘带、多带口罩

API 使用 [和风天气](https://www.heweather.com)

<img src="https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=gQEh8TwAAAAAAAAAAS5odHRwOi8vd2VpeGluLnFxLmNvbS9xLzAydEVvdk53Q2ZlNjAxMDAwMDAwN2cAAgTs3R9aAwQAAAAA" width="150" height="150">

## RSS 新文章推送

每早十点，推送我订阅的 RSS源 24小时内的更新

目前将RSS源维护在 <del>`config` 文件</del> 服务器的数据库中

<img src="https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=gQFT8TwAAAAAAAAAAS5odHRwOi8vd2VpeGluLnFxLmNvbS9xLzAyek9QVU5JQ2ZlNjAxMDAwMDAwN1kAAgRGvR9aAwQAAAAA" width="150" height="150">

## TODO

- [x] 一并推送天气信息
- [x] RSS源维护到 MongoDB 中
- [ ] 为推送时间的修改和订阅源的添加提供 API
- [ ] 精准设置 RSS 推送间隔时间
