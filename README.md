# koyeb-keepalive-bot

一个 **基于 Cloudflare Workers + Telegram Bot 的 Koyeb 保活方案**。  
**无需 Web 面板、无需账号密码**，直接在 Telegram 中管理保活站点，简单、安全、低维护。

---

## ✨ 特性

- 🚀 **直接给 Telegram 机器人发送 URL 即可添加保活站点**
- 🤖 Telegram 即管理面板，无需记命令、无需登录控制台
- ☁️ 基于 Cloudflare Workers，稳定、低成本
- 🗄️ 使用 Cloudflare KV 持久化保存站点列表
- ⏱️ Cron 定时自动检测（默认 20～30 分钟一次）
- 🔔 **仅在失败时通知**（成功保持静默）
- 🧑‍💻 支持 `/check` 手动立即检测
- 🔐 不保存任何平台账号或密码，攻击面极小

---

## 🧠 工作原理

```text
你（Telegram）
   ↓ 发送消息 / URL
Telegram Bot
   ↓ Webhook 推送
Cloudflare Worker
   ├─ 管理站点列表
   ├─ 定时检测
   ├─ 失败通知
   └─ KV 存储
````

> Telegram 既是 **管理入口**，也是 **通知中心**

---

## 🧰 使用前准备

* 一个 **Cloudflare 账号**
* 一个 **Telegram 账号**
* 至少一个 **Koyeb 服务访问地址**

  * 例如：`https://xxx.koyeb.app`

---

## 📦 部署步骤

### 1️⃣ 创建 Telegram 机器人

1. 在 Telegram 中搜索 **@BotFather**
2. 执行 `/start`
3. 执行 `/newbot` 创建机器人
4. 保存生成的 **Bot Token**

然后：

* 给你的机器人发送一条任意消息
* 使用 `@userinfobot` 获取你的 **Chat ID**

---

### 2️⃣ 创建 Cloudflare KV

在 Cloudflare 控制台中：

1. 进入 **Workers 和 Pages**
2. 打开 **KV**
3. 创建一个命名空间，例如：

```
KEEPALIVE_KV
```

---

### 3️⃣ 创建 Cloudflare Worker

1. 进入 **Workers 和 Pages**
2. 创建一个新的 Worker
3. 将下面的 **完整代码**粘贴进去
4. 保存并部署

---


---

## ⚙️ 环境变量配置

在 Worker 的 **设置 → 变量** 中添加：

### 必须变量

| 名称             | 类型 | 说明                  |
| -------------- | -- | ------------------- |
| `TG_BOT_TOKEN` | 机密 | Telegram Bot Token  |
| `TG_CHAT_ID`   | 机密 | 你的 Telegram Chat ID |

### KV 绑定

| 变量名  | 绑定           |
| ---- | ------------ |
| `KV` | KEEPALIVE_KV |

---

## ⏱️ 设置定时任务（Cron）

在 **触发器 → Cron 触发器** 中添加：

```text
*/20 * * * *
```

表示 **每 20 分钟检测一次**
（也可以改为 `*/30 * * * *`）

---

## 🔗 设置 Telegram Webhook

在浏览器中访问（替换占位符）：

```
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=<YOUR_WORKER_URL>
```

成功返回：

```json
{"ok":true,"result":true,"description":"Webhook was set"}
```

---

## 🧪 使用方式

### 添加保活站点（最简单）

直接给机器人发送：

```
https://xxx.koyeb.app
```

---

### 查看当前站点

```
/list
```

---

### 删除站点

```
/remove https://xxx.koyeb.app
```

---

### 手动立即检测

```
/check
```

---

## 🔔 通知策略说明

* ✅ **定时检测成功**：不发送任何通知
* ❌ **定时检测失败**：立即 Telegram 通知
* 🧑‍💻 **手动 `/check`**：始终返回检测结果

> **No news is good news.**

---

## 🔐 安全说明

* 不使用 Web 管理面板
* 不保存任何平台账号或密码
* Worker 地址为公网，但无管理 API
* 仅响应指定的 Telegram Chat ID
* 适合长期运行。

---
