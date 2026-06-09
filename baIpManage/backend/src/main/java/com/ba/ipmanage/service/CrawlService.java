package com.ba.ipmanage.service;

import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONArray;
import com.alibaba.fastjson2.JSONObject;
import com.ba.ipmanage.entity.CrawlSource;
import com.ba.ipmanage.entity.PendingProxyIp;
import com.ba.ipmanage.entity.ProxyIp;
import com.ba.ipmanage.mapper.CrawlSourceMapper;
import com.ba.ipmanage.mapper.PendingProxyIpMapper;
import com.ba.ipmanage.mapper.ProxyIpMapper;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import cn.hutool.http.HttpRequest;
import cn.hutool.http.HttpResponse;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

@Service
public class CrawlService {

    private static final Logger log = LoggerFactory.getLogger(CrawlService.class);

    private static final String[] USER_AGENTS = {
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15"
    };

    private static final Random RANDOM = new Random();

    @Autowired
    private CrawlSourceMapper crawlSourceMapper;

    @Autowired
    private PendingProxyIpMapper pendingProxyIpMapper;

    @Autowired
    private ProxyIpMapper proxyIpMapper;

    public void crawlFromAllSources() {
        log.info("开始从所有源爬取代理IP...");
        LambdaQueryWrapper<CrawlSource> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(CrawlSource::getStatus, 1);
        List<CrawlSource> sources = crawlSourceMapper.selectList(wrapper);

        int totalNew = 0;
        for (CrawlSource source : sources) {
            try {
                int count = crawlFromSource(source);
                totalNew += count;
                source.setLastCrawlTime(LocalDateTime.now());
                crawlSourceMapper.updateById(source);
                log.info("从 {} 爬取完成, 新增 {} 个IP", source.getSourceName(), count);
            } catch (Exception e) {
                log.error("从 {} 爬取失败", source.getSourceName(), e);
            }
        }

        log.info("所有源爬取完成, 共新增 {} 个待验证IP", totalNew);
    }

    private int crawlFromSource(CrawlSource source) {
        String parseRuleStr = source.getParseRule();
        if (parseRuleStr == null || parseRuleStr.isEmpty()) {
            return 0;
        }

        JSONObject parseRule;
        try {
            parseRule = JSON.parseObject(parseRuleStr);
        } catch (Exception e) {
            log.warn("解析规则格式错误: {}", parseRuleStr);
            return 0;
        }

        String type = parseRule.getString("type", "html");

        switch (type.toLowerCase()) {
            case "text":
                return crawlTextSource(source.getSourceName(), source.getSourceUrl(), parseRule);
            case "json":
                return crawlJsonSource(source.getSourceName(), source.getSourceUrl(), parseRule);
            case "html":
            default:
                return crawlHtmlSource(source.getSourceName(), source.getSourceUrl(), parseRule);
        }
    }

    private int crawlTextSource(String sourceName, String url, JSONObject parseRule) {
        int count = 0;
        try {
            String body = httpGet(url);
            if (body == null || body.isEmpty()) {
                return 0;
            }

            String lineSplit = parseRule.getString("lineSplit", "\n");
            String ipPortSplit = parseRule.getString("ipPortSplit", ":");
            String defaultProtocol = parseRule.getString("defaultProtocol", "http");

            String[] lines = body.split(lineSplit);
            for (String line : lines) {
                line = line.trim();
                if (line.isEmpty()) {
                    continue;
                }

                String[] parts = line.split(ipPortSplit);
                if (parts.length < 2) {
                    continue;
                }

                String ip = parts[0].trim();
                String portStr = parts[1].trim();

                try {
                    int port = Integer.parseInt(portStr);
                    if (isValidIpPort(ip, port)) {
                        boolean added = addPendingIp(ip, port, defaultProtocol, sourceName);
                        if (added) {
                            count++;
                        }
                    }
                } catch (NumberFormatException e) {
                    continue;
                }
            }
        } catch (Exception e) {
            log.error("爬取文本源失败: {}", url, e);
        }
        return count;
    }

    private int crawlJsonSource(String sourceName, String url, JSONObject parseRule) {
        int count = 0;
        try {
            String body = httpGet(url);
            if (body == null || body.isEmpty()) {
                return 0;
            }

            JSONObject json = JSON.parseObject(body);
            String listPath = parseRule.getString("listPath", "data");
            String ipField = parseRule.getString("ipField", "ip");
            String portField = parseRule.getString("portField", "port");
            String protocolField = parseRule.getString("protocolField", "protocol");
            String defaultProtocol = parseRule.getString("defaultProtocol", "http");

            JSONArray list = getNestedJsonArray(json, listPath);
            if (list == null || list.isEmpty()) {
                return 0;
            }

            for (int i = 0; i < list.size(); i++) {
                try {
                    JSONObject item = list.getJSONObject(i);
                    if (item == null) continue;

                    String ip = item.getString(ipField);
                    String portStr = item.getString(portField);
                    if (ip == null || portStr == null) continue;

                    int port = Integer.parseInt(portStr.trim());
                    String protocol = protocolField != null ?
                            item.getString(protocolField) : defaultProtocol;
                    if (protocol == null) protocol = defaultProtocol;

                    if (isValidIpPort(ip.trim(), port)) {
                        boolean added = addPendingIp(ip.trim(), port, protocol.toLowerCase(), sourceName);
                        if (added) {
                            count++;
                        }
                    }
                } catch (Exception e) {
                    continue;
                }
            }
        } catch (Exception e) {
            log.error("爬取JSON源失败: {}", url, e);
        }
        return count;
    }

    private JSONArray getNestedJsonArray(JSONObject json, String path) {
        if (path == null || path.isEmpty()) {
            return json.getJSONArray("data");
        }
        String[] keys = path.split("\\.");
        Object current = json;
        for (String key : keys) {
            if (current instanceof JSONObject) {
                current = ((JSONObject) current).get(key);
            } else if (current instanceof JSONArray) {
                return (JSONArray) current;
            } else {
                return null;
            }
        }
        if (current instanceof JSONArray) {
            return (JSONArray) current;
        }
        return null;
    }

    private int crawlHtmlSource(String sourceName, String url, JSONObject parseRule) {
        int count = 0;
        try {
            String html = httpGet(url);
            if (html == null || html.isEmpty()) {
                return 0;
            }

            Document doc = Jsoup.parse(html);

            String tableSelector = parseRule.getString("tableSelector", "tr");
            String ipSelector = parseRule.getString("ipSelector", "td:nth-child(1)");
            String portSelector = parseRule.getString("portSelector", "td:nth-child(2)");
            String protocolSelector = parseRule.getString("protocolSelector");
            boolean skipHeader = parseRule.getBooleanValue("skipHeader");

            Elements rows = doc.select(tableSelector);
            int startIndex = skipHeader ? 1 : 0;

            for (int i = startIndex; i < rows.size(); i++) {
                Element row = rows.get(i);
                try {
                    Element ipEl = row.selectFirst(ipSelector);
                    Element portEl = row.selectFirst(portSelector);
                    if (ipEl == null || portEl == null) {
                        continue;
                    }

                    String ip = ipEl.text().trim();
                    String portStr = portEl.text().trim();
                    if (ip.isEmpty() || portStr.isEmpty()) {
                        continue;
                    }

                    int port;
                    try {
                        port = Integer.parseInt(portStr);
                    } catch (NumberFormatException e) {
                        continue;
                    }

                    String protocol = "http";
                    if (protocolSelector != null) {
                        Element protoEl = row.selectFirst(protocolSelector);
                        if (protoEl != null) {
                            protocol = protoEl.text().trim().toLowerCase();
                        }
                    }

                    if (isValidIpPort(ip, port)) {
                        boolean added = addPendingIp(ip, port, protocol, sourceName);
                        if (added) {
                            count++;
                        }
                    }
                } catch (Exception e) {
                    continue;
                }
            }
        } catch (Exception e) {
            log.error("爬取HTML源失败: {}", url, e);
        }
        return count;
    }

    private String httpGet(String url) {
        try {
            HttpResponse response = HttpRequest.get(url)
                    .header("User-Agent", getRandomUserAgent())
                    .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
                    .header("Accept-Language", "zh-CN,zh;q=0.9,en;q=0.8")
                    .header("Accept-Encoding", "gzip, deflate")
                    .header("Connection", "keep-alive")
                    .header("Upgrade-Insecure-Requests", "1")
                    .timeout(15000)
                    .execute();

            if (!response.isOk()) {
                log.debug("HTTP请求失败: {} - {}", url, response.getStatus());
                return null;
            }

            return response.body();
        } catch (Exception e) {
            log.debug("HTTP请求异常: {} - {}", url, e.getMessage());
            return null;
        }
    }

    private String getRandomUserAgent() {
        return USER_AGENTS[RANDOM.nextInt(USER_AGENTS.length)];
    }

    private boolean isValidIpPort(String ip, int port) {
        if (ip == null || ip.isEmpty()) return false;
        if (port < 1 || port > 65535) return false;
        String[] parts = ip.split("\\.");
        if (parts.length != 4) return false;
        for (String part : parts) {
            try {
                int num = Integer.parseInt(part);
                if (num < 0 || num > 255) return false;
            } catch (NumberFormatException e) {
                return false;
            }
        }
        return true;
    }

    private boolean addPendingIp(String ip, int port, String protocol, String source) {
        LambdaQueryWrapper<PendingProxyIp> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(PendingProxyIp::getIp, ip).eq(PendingProxyIp::getPort, port);
        if (pendingProxyIpMapper.selectCount(wrapper) > 0) {
            return false;
        }

        PendingProxyIp pending = new PendingProxyIp();
        pending.setIp(ip);
        pending.setPort(port);
        pending.setProtocol(protocol);
        pending.setSource(source);
        pending.setStatus(0);
        pending.setCreatedTime(LocalDateTime.now());
        return pendingProxyIpMapper.insert(pending) > 0;
    }

    public List<CrawlSource> listSources() {
        return crawlSourceMapper.selectList(null);
    }

    public boolean saveSource(CrawlSource source) {
        if (source.getId() == null) {
            source.setCreatedTime(LocalDateTime.now());
            source.setUpdatedTime(LocalDateTime.now());
            return crawlSourceMapper.insert(source) > 0;
        } else {
            source.setUpdatedTime(LocalDateTime.now());
            return crawlSourceMapper.updateById(source) > 0;
        }
    }

    public boolean deleteSource(Long id) {
        return crawlSourceMapper.deleteById(id) > 0;
    }

    public void processPendingIps(IpCheckService ipCheckService) {
        log.info("开始处理待验证IP...");
        List<PendingProxyIp> pendingList = pendingProxyIpMapper.selectPendingList(50);

        int newCount = 0;
        for (PendingProxyIp pending : pendingList) {
            try {
                pendingProxyIpMapper.updateStatusValidating(pending.getId());

                ProxyIp proxyIp = new ProxyIp();
                proxyIp.setIp(pending.getIp());
                proxyIp.setPort(pending.getPort());
                proxyIp.setProtocol(pending.getProtocol());
                proxyIp.setSupplier(pending.getSource());
                proxyIp.setStatus(0);
                proxyIp.setUseCount(0);

                boolean available = ipCheckService.checkProxyIp(proxyIp);

                if (available) {
                    LambdaQueryWrapper<ProxyIp> wrapper = new LambdaQueryWrapper<>();
                    wrapper.eq(ProxyIp::getIp, pending.getIp())
                            .eq(ProxyIp::getPort, pending.getPort());
                    if (proxyIpMapper.selectCount(wrapper) == 0) {
                        proxyIp.setCreatedTime(LocalDateTime.now());
                        proxyIpMapper.insert(proxyIp);
                        newCount++;
                    }
                }

                pendingProxyIpMapper.updateStatusCompleted(pending.getId());
            } catch (Exception e) {
                log.error("处理待验证IP失败: {}:{}", pending.getIp(), pending.getPort(), e);
                try {
                    pendingProxyIpMapper.updateStatusCompleted(pending.getId());
                } catch (Exception ex) {
                    // ignore
                }
            }
        }

        log.info("待验证IP处理完成, 新增可用IP: {}", newCount);
    }
}
