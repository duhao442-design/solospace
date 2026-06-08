-- 创建数据库
CREATE DATABASE IF NOT EXISTS qi_ip_manage DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE qi_ip_manage;

-- 1. 代理IP主表
CREATE TABLE IF NOT EXISTS proxy_ip (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    ip VARCHAR(50) NOT NULL COMMENT 'IP地址',
    port INT NOT NULL COMMENT '端口',
    protocol VARCHAR(10) DEFAULT 'http' COMMENT '协议类型: http, https, socks5',
    `status` TINYINT DEFAULT 0 COMMENT '状态: 0-待验证, 1-可用, 2-不可用, 3-已禁用',
    supplier VARCHAR(100) DEFAULT NULL COMMENT '供应商',
    location VARCHAR(200) DEFAULT NULL COMMENT '归属地',
    province VARCHAR(50) DEFAULT NULL COMMENT '省份',
    city VARCHAR(50) DEFAULT NULL COMMENT '城市',
    isp VARCHAR(50) DEFAULT NULL COMMENT '运营商',
    use_count INT DEFAULT 0 COMMENT '使用次数',
    success_count INT DEFAULT 0 COMMENT '成功次数',
    fail_count INT DEFAULT 0 COMMENT '失败次数',
    response_time INT DEFAULT NULL COMMENT '响应时间(毫秒)',
    anonymity_level TINYINT DEFAULT 1 COMMENT '匿名等级: 1-透明, 2-普匿, 3-高匿',
    remark VARCHAR(500) DEFAULT NULL COMMENT '备注',
    survive_date DATE DEFAULT NULL COMMENT '存活日期',
    last_check_time DATETIME DEFAULT NULL COMMENT '最后检查时间',
    last_success_time DATETIME DEFAULT NULL COMMENT '最后成功时间',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_ip_port (ip, port),
    KEY idx_status (`status`),
    KEY idx_location (location),
    KEY idx_supplier (supplier)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='代理IP主表';

-- 2. IP分组表
CREATE TABLE IF NOT EXISTS ip_group (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    group_name VARCHAR(100) NOT NULL COMMENT '分组名称',
    group_code VARCHAR(50) NOT NULL COMMENT '分组编码',
    description VARCHAR(500) DEFAULT NULL COMMENT '分组描述',
    sort_order INT DEFAULT 0 COMMENT '排序',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_group_code (group_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='IP分组表';

-- 3. IP与分组关联表
CREATE TABLE IF NOT EXISTS proxy_ip_group (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    proxy_ip_id BIGINT NOT NULL COMMENT '代理IPID',
    group_id BIGINT NOT NULL COMMENT '分组ID',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UNIQUE KEY uk_ip_group (proxy_ip_id, group_id),
    KEY idx_group_id (group_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='IP与分组关联表';

-- 4. 请求方控制表（对请求方的限制）
CREATE TABLE IF NOT EXISTS requester_control (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    requester_type TINYINT NOT NULL COMMENT '请求方类型: 1-IP, 2-域名',
    requester_value VARCHAR(200) NOT NULL COMMENT '请求方值: IP地址或域名',
    control_type TINYINT DEFAULT 1 COMMENT '控制类型: 1-黑名单(禁止), 2-白名单(仅允许)',
    rate_limit INT DEFAULT NULL COMMENT '限流: 每秒请求数',
    daily_limit INT DEFAULT NULL COMMENT '每日请求次数限制',
    `status` TINYINT DEFAULT 1 COMMENT '状态: 0-禁用, 1-启用',
    remark VARCHAR(500) DEFAULT NULL COMMENT '备注',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    KEY idx_requester (requester_type, requester_value)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='请求方控制表';

-- 5. 请求方-IP池关联表（控制请求方能访问哪些IP组）
CREATE TABLE IF NOT EXISTS requester_group_access (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    requester_id BIGINT NOT NULL COMMENT '请求方控制ID',
    group_id BIGINT NOT NULL COMMENT 'IP分组ID',
    access_type TINYINT DEFAULT 1 COMMENT '访问类型: 1-允许访问, 2-禁止访问',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UNIQUE KEY uk_requester_group (requester_id, group_id),
    KEY idx_group_id (group_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='请求方-IP池关联表';

-- 6. IP访问控制表（对单个代理IP的请求方限制）
CREATE TABLE IF NOT EXISTS ip_access_control (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    proxy_ip_id BIGINT NOT NULL COMMENT '代理IPID',
    control_target_type TINYINT NOT NULL COMMENT '控制目标类型: 1-IP, 2-域名',
    control_target_value VARCHAR(200) NOT NULL COMMENT '控制目标值',
    control_type TINYINT DEFAULT 1 COMMENT '控制类型: 1-禁止访问, 2-仅允许访问',
    `status` TINYINT DEFAULT 1 COMMENT '状态: 0-禁用, 1-启用',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    KEY idx_proxy_ip_id (proxy_ip_id),
    KEY idx_target (control_target_type, control_target_value)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='IP访问控制表';

-- 7. 请求日志表
CREATE TABLE IF NOT EXISTS request_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    proxy_ip_id BIGINT DEFAULT NULL COMMENT '使用的代理IPID',
    proxy_ip VARCHAR(50) DEFAULT NULL COMMENT '代理IP地址',
    requester_ip VARCHAR(50) DEFAULT NULL COMMENT '请求方IP',
    requester_domain VARCHAR(200) DEFAULT NULL COMMENT '请求方域名',
    target_url VARCHAR(500) DEFAULT NULL COMMENT '目标地址',
    request_path VARCHAR(500) DEFAULT NULL COMMENT '请求路径',
    request_method VARCHAR(10) DEFAULT NULL COMMENT '请求方法',
    response_status INT DEFAULT NULL COMMENT '响应状态码',
    response_time INT DEFAULT NULL COMMENT '响应时间(毫秒)',
    success TINYINT DEFAULT 1 COMMENT '是否成功: 0-失败, 1-成功',
    error_msg VARCHAR(500) DEFAULT NULL COMMENT '错误信息',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    KEY idx_create_time (create_time),
    KEY idx_proxy_ip (proxy_ip),
    KEY idx_requester_ip (requester_ip),
    KEY idx_requester_domain (requester_domain)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='请求日志表';

-- 8. IP归属地API配置表
CREATE TABLE IF NOT EXISTS ip_location_api (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    api_name VARCHAR(100) NOT NULL COMMENT 'API名称',
    api_url VARCHAR(500) NOT NULL COMMENT 'API地址',
    request_method VARCHAR(10) DEFAULT 'GET' COMMENT '请求方法: GET, POST',
    request_params TEXT DEFAULT NULL COMMENT '请求参数(JSON格式, 支持{ip}占位符)',
    request_headers TEXT DEFAULT NULL COMMENT '请求头(JSON格式)',
    response_type VARCHAR(20) DEFAULT 'json' COMMENT '响应类型: json, text, xml',
    location_path VARCHAR(200) DEFAULT NULL COMMENT '归属地提取路径(如JSONPath)',
    province_path VARCHAR(200) DEFAULT NULL COMMENT '省份提取路径',
    city_path VARCHAR(200) DEFAULT NULL COMMENT '城市提取路径',
    isp_path VARCHAR(200) DEFAULT NULL COMMENT '运营商提取路径',
    daily_limit INT DEFAULT 1000 COMMENT '每日额度',
    today_used INT DEFAULT 0 COMMENT '今日已用',
    last_reset_date DATE DEFAULT NULL COMMENT '最后重置日期',
    priority INT DEFAULT 0 COMMENT '优先级: 数字越大优先级越高',
    `status` TINYINT DEFAULT 1 COMMENT '状态: 0-禁用, 1-启用',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='IP归属地API配置表';

-- 9. 待验证代理IP表
CREATE TABLE IF NOT EXISTS pending_proxy_ip (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    ip VARCHAR(50) NOT NULL COMMENT 'IP地址',
    port INT NOT NULL COMMENT '端口',
    protocol VARCHAR(10) DEFAULT 'http' COMMENT '协议类型',
    source VARCHAR(100) DEFAULT NULL COMMENT '来源',
    supplier VARCHAR(100) DEFAULT NULL COMMENT '供应商',
    `status` TINYINT DEFAULT 0 COMMENT '状态: 0-待验证, 1-验证通过, 2-验证失败',
    verify_count INT DEFAULT 0 COMMENT '验证次数',
    last_verify_time DATETIME DEFAULT NULL COMMENT '最后验证时间',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UNIQUE KEY uk_ip_port (ip, port),
    KEY idx_status (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='待验证代理IP表';

-- 10. IP爬取源配置表
CREATE TABLE IF NOT EXISTS crawler_source (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    source_name VARCHAR(100) NOT NULL COMMENT '源名称',
    source_url VARCHAR(500) NOT NULL COMMENT '源地址',
    parser_type VARCHAR(50) DEFAULT 'regex' COMMENT '解析方式: regex, xpath, json',
    parser_rule TEXT DEFAULT NULL COMMENT '解析规则',
    crawl_interval INT DEFAULT 3600 COMMENT '爬取间隔(秒)',
    last_crawl_time DATETIME DEFAULT NULL COMMENT '最后爬取时间',
    `status` TINYINT DEFAULT 1 COMMENT '状态: 0-禁用, 1-启用',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='IP爬取源配置表';

-- 11. 系统配置表
CREATE TABLE IF NOT EXISTS sys_config (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    config_key VARCHAR(100) NOT NULL COMMENT '配置键',
    config_value TEXT DEFAULT NULL COMMENT '配置值',
    description VARCHAR(500) DEFAULT NULL COMMENT '配置描述',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_config_key (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统配置表';

-- 初始化数据
INSERT IGNORE INTO sys_config (config_key, config_value, description) VALUES
('ip.check.interval', '300', 'IP可用性检查间隔(秒)'),
('ip.check.thread.pool.size', '10', 'IP检查线程池大小'),
('ip.crawl.interval', '3600', 'IP爬取间隔(秒)'),
('ip.verify.timeout', '5000', 'IP验证超时时间(毫秒)'),
('ip.max.batch.get', '100', '批量获取IP最大数量'),
('api.rate.limit.default', '10', 'API默认限流(每秒请求数)');

-- 初始化默认IP分组
INSERT IGNORE INTO ip_group (group_name, group_code, description, sort_order) VALUES
('默认分组', 'default', '默认IP分组', 0),
('高匿代理', 'high_anonymity', '高匿代理IP分组', 1),
('国内代理', 'domestic', '国内代理IP分组', 2),
('国外代理', 'foreign', '国外代理IP分组', 3);

-- 初始化示例IP归属地API
INSERT IGNORE INTO ip_location_api (api_name, api_url, request_method, response_type, location_path, province_path, city_path, isp_path, daily_limit, priority, status) VALUES
('IP查询网', 'http://ip-api.com/json/{ip}?lang=zh-CN', 'GET', 'json', '$.country+$.regionName+$.city', '$.regionName', '$.city', '$.isp', 1000, 10, 1),
('ipinfo.io', 'https://ipinfo.io/{ip}/json', 'GET', 'json', '$.country+$.region+$.city', '$.region', '$.city', '$.org', 50000, 5, 0);

-- 初始化示例爬取源
INSERT IGNORE INTO crawler_source (source_name, source_url, parser_type, parser_rule, status) VALUES
('西刺代理', 'https://www.xicidaili.com/nn/', 'regex', '<td>(\\d+\\.\\d+\\.\\d+\\.\\d+)</td>\\s*<td>(\\d+)</td>', 0),
('快代理', 'https://www.kuaidaili.com/free/inha/', 'regex', '<td data-title="IP">(\\d+\\.\\d+\\.\\d+\\.\\d+)</td>\\s*<td data-title="PORT">(\\d+)</td>', 0);
