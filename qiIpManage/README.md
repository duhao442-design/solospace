# 代理IP管理系统

基于 Spring Boot + MySQL + Vue 3 的前后端分离代理IP管理系统。

## 功能特性

### 后端功能
- 代理IP的增删改查、状态管理
- IP分组管理
- IP可用性定时检查
- IP爬取定时任务（支持多种爬取源）
- IP归属地查询（可配置多个API，自动切换）
- 请求方控制（黑名单/白名单、限流）
- IP访问控制
- 请求日志记录
- 对外API接口（带限流）
  - 随机获取单个代理IP
  - 批量获取代理IP（最多100个）
  - 查询IP归属地信息

### 前端功能
- 数据概览（图表统计）
- 代理IP维护（增删改查、批量操作、批量分组）
- 待验证IP管理
- IP分组管理
- 请求方控制（IP/域名黑白名单、限流、IP池控制）
- IP访问控制
- IP归属地API配置
- 爬取源管理
- 请求日志查询
- 系统配置

## 技术栈

### 后端
- Spring Boot 2.7.18
- MyBatis-Plus 3.5.3.2
- MySQL 8.0
- Druid 连接池
- Hutool 工具库
- Fastjson2
- Lombok
- JsonPath

### 前端
- Vue 3
- Vue Router 4
- Pinia
- Element Plus
- ECharts
- Axios
- Vite

## 项目结构

```
qiIpManage/
├── sql/                    # 数据库脚本
│   └── init.sql           # 数据库初始化脚本
├── backend/                # 后端项目
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/qi/ipmanage/
│       │   ├── IpManageApplication.java    # 启动类
│       │   ├── common/                     # 通用类
│       │   ├── config/                     # 配置类
│       │   ├── controller/                 # 控制器
│       │   ├── entity/                     # 实体类
│       │   ├── mapper/                     # Mapper接口
│       │   ├── service/                    # 服务层
│       │   └── task/                       # 定时任务
│       └── resources/
│           └── application.yml              # 配置文件
└── frontend/               # 前端项目
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── api/            # API接口
        ├── views/          # 页面组件
        ├── router/         # 路由
        ├── styles/         # 样式
        ├── utils/          # 工具函数
        ├── App.vue
        └── main.js
```

## 快速开始

### 1. 初始化数据库

```bash
mysql -u root -p < sql/init.sql
```

### 2. 启动后端

```bash
cd backend
mvn spring-boot:run
```

后端默认端口：8080

### 3. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端默认端口：5173

## 对外API接口

### 随机获取单个代理IP
```
GET /public-api/proxy/random
```

### 批量获取代理IP
```
GET /public-api/proxy/batch?count=10&groupCode=default
```
- count: 获取数量，最大100
- groupCode: 分组编码（可选）

### 查询IP详情（归属地）
```
GET /public-api/ip/info/{ip}
```

## 管理后台

打开前端页面即可使用全部功能，无需登录。

主要页面：
- 数据概览：查看IP池统计和请求趋势
- 代理IP列表：管理所有代理IP
- 待验证IP：管理待验证的IP
- IP分组：管理IP分组
- 请求方控制：管理请求方的访问权限和限流
- IP访问控制：管理单个IP的访问控制
- 归属地API：配置IP归属地查询API
- 爬取源管理：配置IP爬取源
- 请求日志：查看API调用日志
- 系统配置：配置系统参数

## 定时任务

- IP可用性检查：每5分钟执行一次，检查已有IP和待验证IP
- IP爬取：每1小时执行一次，从配置的爬取源获取新IP

## 配置说明

### 数据库配置
修改 `backend/src/main/resources/application.yml` 中的数据库连接信息。

### 定时任务配置
在 `application.yml` 中配置：
- `ip.check.cron`: IP检查任务cron表达式
- `ip.crawl.cron`: IP爬取任务cron表达式
- `ip.check.timeout`: IP验证超时时间
- `ip.check.thread-pool-size`: 检查线程池大小

### 系统配置
可在管理后台的"系统配置"页面修改：
- `ip.check.interval`: 检查间隔
- `ip.max.batch.get`: 批量获取最大数量
- `api.rate.limit.default`: API默认限流
