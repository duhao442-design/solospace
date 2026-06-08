# 代理IP管理系统

基于 SpringBoot + MySQL + Vue 的前后端分离代理IP管理系统。

## 功能特性

### 前端功能
1. **代理IP维护** - 手动维护IP池，支持状态、供应商、归属地、使用次数、备注、存活日期等
2. **IP请求方控制** - 支持黑白名单机制，限制请求方可访问的目标IP/域名
3. **请求方IP池控制** - 控制请求方能访问/禁止访问的IP分组，支持限流
4. **IP分组管理** - 批量分组管理，支持按分组进行访问控制
5. **数据可视化** - IP池地理分布、请求次数统计、请求来源分布等图表展示
6. **归属地API配置** - 可配置多个IP归属地API，支持占位符解析、自动切换
7. **爬取源管理** - 配置免费IP爬取源，支持自定义解析规则
8. **系统配置** - 灵活的系统参数配置

### 对外API
- `GET /api/public/ip/batch` - 批量获取代理IP（最多100个，限流）
- `GET /api/public/ip/random` - 随机获取单个代理IP
- `GET /api/public/ip/detail/{ip}` - 查询IP详情（归属地）

### 后端定时任务
- **IP可用性检查** - 定期检查IP连通性，更新状态和响应时间
- **IP归属地补充** - 通过在线API获取IP归属地，额度用尽自动切换
- **IP爬取** - 从免费代理网站爬取新IP加入待验证队列
- **待验证IP处理** - 自动验证新爬取的IP并加入IP池

## 技术栈

### 后端
- Spring Boot 2.7.x
- MyBatis-Plus 3.5.x
- MySQL 8.x
- Hutool 工具库
- FastJSON2
- Jsoup (HTML解析)
- Caffeine (本地缓存)
- Lombok

### 前端
- Vue 3
- Element Plus
- Vue Router
- Pinia
- Axios
- ECharts
- Vite

## 项目结构

```
baIpManage/
├── sql/
│   └── init.sql              # 数据库初始化脚本
├── backend/                   # 后端项目 (SpringBoot)
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/ba/ipmanage/
│       │   ├── BaIpManageApplication.java
│       │   ├── common/        # 通用类
│       │   ├── config/        # 配置类
│       │   ├── controller/    # 控制器
│       │   ├── entity/        # 实体类
│       │   ├── mapper/        # 数据访问层
│       │   ├── service/       # 业务逻辑层
│       │   └── task/          # 定时任务
│       └── resources/
│           └── application.yml
└── frontend/                  # 前端项目 (Vue3)
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── api/               # API接口
        ├── components/        # 组件
        ├── router/            # 路由
        ├── utils/             # 工具类
        ├── views/             # 页面
        ├── App.vue
        └── main.js
```

## 快速开始

### 1. 环境要求
- JDK 8+
- Node.js 14+
- MySQL 5.7+ 或 8.x
- Maven 3.6+

### 2. 数据库初始化

```bash
# 进入sql目录
cd sql

# 执行初始化脚本
mysql -u root -p < init.sql
```

或者在 MySQL 客户端中执行 `sql/init.sql` 文件。

### 3. 后端启动

```bash
cd backend

# 修改数据库配置 (src/main/resources/application.yml)
# spring.datasource.username=your_username
# spring.datasource.password=your_password

# 编译并启动
mvn clean package
java -jar target/ba-ip-manage-1.0.0.jar
```

或者使用 Maven 直接运行：
```bash
mvn spring-boot:run
```

后端服务默认端口：8080

### 4. 前端启动

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端服务默认端口：3000

访问地址：http://localhost:3000

### 5. 对外API使用

#### 批量获取IP
```bash
curl "http://localhost:8080/api/public/ip/batch?count=10"
```

#### 随机获取单个IP
```bash
curl "http://localhost:8080/api/public/ip/random"
```

#### 查询IP详情
```bash
curl "http://localhost:8080/api/public/ip/detail/8.8.8.8"
```

## 管理后台API列表

### IP管理
- `GET /api/admin/ip/page` - IP列表（分页）
- `GET /api/admin/ip/{id}` - IP详情
- `POST /api/admin/ip` - 新增/编辑IP
- `DELETE /api/admin/ip/{id}` - 删除IP
- `POST /api/admin/ip/check/{id}` - 检查单个IP
- `POST /api/admin/ip/checkAll` - 批量检查所有IP
- `GET /api/admin/ip/distribution/country` - 国家分布
- `GET /api/admin/ip/distribution/province` - 省份分布

### 分组管理
- `GET /api/admin/group/list` - 分组列表
- `GET /api/admin/group/page` - 分组分页
- `POST /api/admin/group` - 新增/编辑分组
- `DELETE /api/admin/group/{id}` - 删除分组
- `POST /api/admin/group/{groupId}/addIp/{ipId}` - 添加IP到分组
- `POST /api/admin/group/{groupId}/batchAdd` - 批量添加IP
- `DELETE /api/admin/group/{groupId}/removeIp/{ipId}` - 从分组移除IP
- `GET /api/admin/group/{groupId}/ips` - 获取分组下的IP

### 请求方管理
- `GET /api/admin/requester/page` - 请求方列表
- `POST /api/admin/requester` - 新增/编辑请求方
- `DELETE /api/admin/requester/{id}` - 删除请求方
- `GET /api/admin/requester/{id}/controls` - 访问控制列表
- `POST /api/admin/requester/control` - 添加访问控制
- `DELETE /api/admin/requester/control/{id}` - 删除访问控制
- `GET /api/admin/requester/{id}/poolControls` - IP池控制列表
- `POST /api/admin/requester/poolControl` - 添加IP池控制
- `DELETE /api/admin/requester/poolControl/{id}` - 删除IP池控制

### 系统设置
- `GET /api/admin/locationApi/list` - 归属地API列表
- `POST /api/admin/locationApi` - 新增/编辑归属地API
- `DELETE /api/admin/locationApi/{id}` - 删除归属地API
- `GET /api/admin/crawlSource/list` - 爬取源列表
- `POST /api/admin/crawlSource` - 新增/编辑爬取源
- `DELETE /api/admin/crawlSource/{id}` - 删除爬取源
- `POST /api/admin/crawlSource/runNow` - 立即执行爬取
- `GET /api/admin/config/list` - 系统配置列表
- `POST /api/admin/config` - 更新系统配置

### 数据统计
- `GET /api/admin/statistics/dailyRequestCount` - 每日请求次数
- `GET /api/admin/statistics/requesterDistribution` - 请求来源分布
- `GET /api/admin/statistics/proxyIpDistribution` - IP使用分布

## 数据库表说明

| 表名 | 说明 |
|------|------|
| proxy_ip | 代理IP主表 |
| ip_group | IP分组表 |
| ip_group_relation | IP与分组关联表 |
| requester | 请求方表 |
| requester_control | 请求方访问控制表（黑白名单） |
| pool_control | 请求方IP池控制表 |
| ip_location_api | IP归属地API配置表 |
| request_log | 请求日志表 |
| crawl_source | 爬取源配置表 |
| pending_proxy_ip | 待验证IP表 |
| system_config | 系统配置表 |

## 注意事项

1. 本系统为个人私用，未做登录认证，请勿直接部署到公网
2. 免费代理IP质量参差不齐，爬取和验证可能需要较长时间
3. IP归属地API有每日额度限制，系统会自动切换使用
4. 首次启动建议先手动添加一些IP，或配置好爬取源等待自动爬取
5. 可通过系统配置调整各项参数

## License

MIT
