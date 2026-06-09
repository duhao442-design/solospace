CREATE DATABASE IF NOT EXISTS ba_ip_manage DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE ba_ip_manage;

DROP TABLE IF EXISTS proxy_ip;
CREATE TABLE proxy_ip (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ip VARCHAR(45) NOT NULL COMMENT 'IP地址',
    port INT NOT NULL COMMENT '端口',
    protocol VARCHAR(10) DEFAULT 'http' COMMENT '协议:http,https,socks5',
    status TINYINT DEFAULT 0 COMMENT '状态:0待验证,1可用,2不可用,3已过期',
    supplier VARCHAR(100) DEFAULT NULL COMMENT '供应商',
    location VARCHAR(255) DEFAULT NULL COMMENT '归属地',
    country VARCHAR(100) DEFAULT NULL COMMENT '国家',
    province VARCHAR(100) DEFAULT NULL COMMENT '省份',
    city VARCHAR(100) DEFAULT NULL COMMENT '城市',
    use_count INT DEFAULT 0 COMMENT '使用次数',
    remark VARCHAR(500) DEFAULT NULL COMMENT '备注',
    survival_date DATE DEFAULT NULL COMMENT '存活日期/到期日期',
    last_check_time DATETIME DEFAULT NULL COMMENT '最后检查时间',
    response_time INT DEFAULT NULL COMMENT '响应时间(毫秒)',
    anonymity_level TINYINT DEFAULT 0 COMMENT '匿名度:0透明,1匿名,2高匿',
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_ip_port (ip, port),
    INDEX idx_status (status),
    INDEX idx_location (location),
    INDEX idx_survival_date (survival_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='代理IP主表';

DROP TABLE IF EXISTS ip_group;
CREATE TABLE ip_group (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    group_name VARCHAR(100) NOT NULL COMMENT '分组名称',
    group_code VARCHAR(50) NOT NULL COMMENT '分组编码',
    description VARCHAR(500) DEFAULT NULL COMMENT '描述',
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_group_code (group_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='IP分组表';

DROP TABLE IF EXISTS ip_group_relation;
CREATE TABLE ip_group_relation (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    group_id BIGINT NOT NULL COMMENT '分组ID',
    proxy_ip_id BIGINT NOT NULL COMMENT '代理IP ID',
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_group_ip (group_id, proxy_ip_id),
    INDEX idx_proxy_ip_id (proxy_ip_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='IP与分组关联表';

DROP TABLE IF EXISTS requester;
CREATE TABLE requester (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    requester_key VARCHAR(100) NOT NULL COMMENT '请求方标识(IP或域名)',
    requester_type TINYINT NOT NULL COMMENT '类型:1IP,2域名',
    name VARCHAR(100) DEFAULT NULL COMMENT '名称/备注',
    status TINYINT DEFAULT 1 COMMENT '状态:0禁用,1启用',
    rate_limit INT DEFAULT 0 COMMENT '限流:每秒请求数,0表示不限',
    rate_limit_day INT DEFAULT 0 COMMENT '每日请求数限制,0表示不限',
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_requester_key (requester_key),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='请求方表';

DROP TABLE IF EXISTS requester_control;
CREATE TABLE requester_control (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    requester_id BIGINT NOT NULL COMMENT '请求方ID',
    control_type TINYINT NOT NULL COMMENT '控制类型:1黑名单(禁止访问的目标),2白名单(仅允许访问的目标)',
    target_type TINYINT NOT NULL COMMENT '目标类型:1IP,2域名',
    target_value VARCHAR(255) NOT NULL COMMENT '目标IP或域名',
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_requester_id (requester_id),
    INDEX idx_control_type (control_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='请求方访问控制表';

DROP TABLE IF EXISTS pool_control;
CREATE TABLE pool_control (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    requester_id BIGINT NOT NULL COMMENT '请求方ID',
    control_type TINYINT NOT NULL COMMENT '控制类型:1允许访问的分组,2禁止访问的分组',
    group_id BIGINT NOT NULL COMMENT '分组ID',
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_requester_group (requester_id, group_id, control_type),
    INDEX idx_group_id (group_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='请求方IP池控制表';

DROP TABLE IF EXISTS ip_location_api;
CREATE TABLE ip_location_api (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    api_name VARCHAR(100) NOT NULL COMMENT 'API名称',
    api_url VARCHAR(500) NOT NULL COMMENT 'API地址',
    request_method VARCHAR(10) DEFAULT 'GET' COMMENT '请求方式:GET,POST',
    request_params TEXT DEFAULT NULL COMMENT '请求参数(JSON格式,支持{ip}占位符)',
    response_parse_path VARCHAR(500) DEFAULT NULL COMMENT '返回数据解析路径(JSONPath)',
    location_field VARCHAR(100) DEFAULT NULL COMMENT '归属地字段名',
    country_field VARCHAR(100) DEFAULT NULL COMMENT '国家字段名',
    province_field VARCHAR(100) DEFAULT NULL COMMENT '省份字段名',
    city_field VARCHAR(100) DEFAULT NULL COMMENT '城市字段名',
    daily_quota INT DEFAULT 0 COMMENT '每日额度',
    used_count_today INT DEFAULT 0 COMMENT '今日已使用次数',
    last_reset_date DATE DEFAULT NULL COMMENT '最后重置日期',
    status TINYINT DEFAULT 1 COMMENT '状态:0禁用,1启用',
    priority INT DEFAULT 0 COMMENT '优先级,数字越大优先级越高',
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='IP归属地API配置表';

DROP TABLE IF EXISTS request_log;
CREATE TABLE request_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    requester_ip VARCHAR(45) DEFAULT NULL COMMENT '请求方IP',
    requester_domain VARCHAR(255) DEFAULT NULL COMMENT '请求方域名',
    proxy_ip_id BIGINT DEFAULT NULL COMMENT '返回的代理IP ID',
    proxy_ip VARCHAR(45) DEFAULT NULL COMMENT '返回的代理IP',
    api_type VARCHAR(50) DEFAULT NULL COMMENT 'API类型:batch,single,detail',
    request_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    response_status TINYINT DEFAULT 1 COMMENT '响应状态:1成功,0失败',
    INDEX idx_request_time (request_time),
    INDEX idx_requester_ip (requester_ip),
    INDEX idx_proxy_ip_id (proxy_ip_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='请求日志表';

DROP TABLE IF EXISTS crawl_source;
CREATE TABLE crawl_source (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    source_name VARCHAR(100) NOT NULL COMMENT '来源名称',
    source_url VARCHAR(500) NOT NULL COMMENT '来源URL',
    parse_rule TEXT DEFAULT NULL COMMENT '解析规则(JSON格式)',
    status TINYINT DEFAULT 1 COMMENT '状态:0禁用,1启用',
    crawl_interval INT DEFAULT 3600 COMMENT '爬取间隔(秒)',
    last_crawl_time DATETIME DEFAULT NULL COMMENT '最后爬取时间',
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='爬取源配置表';

DROP TABLE IF EXISTS pending_proxy_ip;
CREATE TABLE pending_proxy_ip (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ip VARCHAR(45) NOT NULL,
    port INT NOT NULL,
    protocol VARCHAR(10) DEFAULT 'http',
    source VARCHAR(100) DEFAULT NULL COMMENT '来源',
    status TINYINT DEFAULT 0 COMMENT '状态:0待验证,1验证中,2验证完成',
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_ip_port (ip, port),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='待验证IP表';

DROP TABLE IF EXISTS system_config;
CREATE TABLE system_config (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL COMMENT '配置键',
    config_value TEXT DEFAULT NULL COMMENT '配置值',
    description VARCHAR(500) DEFAULT NULL COMMENT '描述',
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_config_key (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统配置表';

INSERT INTO system_config (config_key, config_value, description) VALUES
('check.interval', '300', 'IP可用性检查间隔(秒)'),
('check.timeout', '5000', 'IP检查超时时间(毫秒)'),
('crawl.enable', 'true', '是否启用IP爬取'),
('crawl.interval', '3600', 'IP爬取间隔(秒)'),
('batch.max.count', '100', '批量获取IP最大数量'),
('global.rate.limit', '1000', '全局每秒限流'),
('location.api.switch.threshold', '0.8', '归属地API切换阈值(使用率)');

INSERT INTO ip_location_api (api_name, api_url, request_method, request_params, response_parse_path, location_field, country_field, province_field, city_field, daily_quota, status, priority) VALUES
('ip-api.com', 'http://ip-api.com/json/{ip}', 'GET', NULL, NULL, 'country,city', 'country', 'regionName', 'city', 45, 1, 10),
('ipinfo.io', 'https://ipinfo.io/{ip}/json', 'GET', NULL, NULL, 'country,region,city', 'country', 'region', 'city', 50000, 0, 5),
('太平洋电脑网', 'http://whois.pconline.com.cn/ipJson.jsp', 'GET', '{"ip":"{ip}","json":"true"}', NULL, 'addr', 'country', 'pro', 'city', 0, 1, 20),
('百度开放平台', 'https://opendata.baidu.com/api.php', 'GET', '{"query":"{ip}","co":"","resource_id":"6006","oe":"utf8"}', NULL, 'location', NULL, NULL, NULL, 0, 0, 15),
('ip-api.cn', 'http://ip-api.cn/api/{ip}', 'GET', NULL, NULL, 'address', 'country', 'province', 'city', 0, 0, 8),
('免费IP查询', 'https://api.vore.top/api/IPdata', 'GET', '{"ip":"{ip}"}', NULL, 'ipinfo.location', 'ipinfo.gj', 'ipinfo.province', 'ipinfo.city', 0, 0, 3);

INSERT INTO crawl_source (source_name, source_url, parse_rule, status, crawl_interval) VALUES
('西刺代理', 'https://www.xicidaili.com/nn/', '{"type":"html","ipSelector":"td:nth-child(2)","portSelector":"td:nth-child(3)","protocolSelector":"td:nth-child(6)"}', 1, 3600),
('快代理', 'https://www.kuaidaili.com/free/inha/', '{"type":"html","ipSelector":"td[data-title=IP]","portSelector":"td[data-title=PORT]","protocolSelector":"td[data-title=类型]"}', 1, 3600);
