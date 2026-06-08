package com.ba.ipmanage.service;

import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONObject;
import com.ba.ipmanage.entity.CrawlSource;
import com.ba.ipmanage.entity.PendingProxyIp;
import com.ba.ipmanage.entity.ProxyIp;
import com.ba.ipmanage.mapper.CrawlSourceMapper;
import com.ba.ipmanage.mapper.PendingProxyIpMapper;
import com.ba.ipmanage.mapper.ProxyIpMapper;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
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

@Service
public class CrawlService {

    private static final Logger log = LoggerFactory.getLogger(CrawlService.class);

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
        String url = source.getSourceUrl();
        String parseRuleStr = source.getParseRule();
        if (parseRuleStr == null || parseRuleStr.isEmpty()) {
            return crawlDefaultXicidaili(source.getSourceName(), url);
        }

        JSONObject parseRule = JSON.parseObject(parseRuleStr);
        String type = parseRule.getString("type");

        if ("html".equalsIgnoreCase(type)) {
            return crawlHtmlSource(source.getSourceName(), url, parseRule);
        }

        return 0;
    }

    private int crawlHtmlSource(String sourceName, String url, JSONObject parseRule) {
        int count = 0;
        try {
            Document doc = Jsoup.connect(url)
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                    .timeout(10000)
                    .get();

            String ipSelector = parseRule.getString("ipSelector");
            String portSelector = parseRule.getString("portSelector");
            String protocolSelector = parseRule.getString("protocolSelector");

            Elements rows = doc.select("tr");
            for (Element row : rows) {
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

    private int crawlDefaultXicidaili(String sourceName, String url) {
        int count = 0;
        try {
            Document doc = Jsoup.connect(url)
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                    .timeout(10000)
                    .get();

            Elements rows = doc.select("#ip_list tr");
            for (int i = 1; i < rows.size(); i++) {
                Element row = rows.get(i);
                Elements tds = row.select("td");
                if (tds.size() < 3) continue;

                String ip = tds.get(1).text().trim();
                String portStr = tds.get(2).text().trim();

                try {
                    int port = Integer.parseInt(portStr);
                    if (isValidIpPort(ip, port)) {
                        String protocol = tds.size() > 5 ? tds.get(5).text().trim().toLowerCase() : "http";
                        boolean added = addPendingIp(ip, port, protocol, sourceName);
                        if (added) {
                            count++;
                        }
                    }
                } catch (NumberFormatException e) {
                    continue;
                }
            }
        } catch (Exception e) {
            log.error("爬取西刺代理失败", e);
        }
        return count;
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
