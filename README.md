# little-robot
一些练习、自用的脚本

每天由定时任务通过 [PushBear](https://pushbear.ftqq.com/admin/#/) 推送到微信

更多关于本项目的信息可参考[博客](https://blog.colafornia.me/post/2018/the-beginning-of-little-robot/)

## RSS 新文章推送

<img src="https://s1.ax1x.com/2018/04/27/C3NaDA.md.jpg" width="300" >

工作日每早十点，微信/Telegram 推送我订阅的 RSS源 24小时内的更新

目前将RSS源维护在 <del>`config` 文件</del> 服务器的数据库中

每周推送汇总位于 [issues](https://github.com/Colafornia/little-robot/issues)

目前订阅源主要为前端资讯，均为个人口味，欢迎新的订阅源推荐

**扫码即可获得推送服务：**

<img src="https://i.loli.net/2018/09/05/5b8fa082db070.png" width="250">

Telegram channel: https://t.me/fedailypush

## TODO

- [x] RSS源维护到 MongoDB 中
- [x] 循环抓取，避免源不稳定引发的问题
- [x] 汇总历史到 issue
- [x] 简单的文章去重
- [x] 搭建 Koa Server
- [x] 精准设置 RSS 推送间隔时间
- [x] 法定假日，双休日均不推送
- [x] 使用 Docker 镜像进行部署
- [x] Telegram 推送
- [ ] 提供推送历史浏览页面
