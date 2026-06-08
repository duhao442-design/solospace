package com.qi.ipmanage.task;

import com.alibaba.fastjson2.JSONObject;
import com.qi.ipmanage.entity.PendingProxyIp;
import com.qi.ipmanage.entity.ProxyIp;
import com.qi.ipmanage.service.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.net.InetSocketAddress;
import java.net.Proxy;
import java.net.URL;
import java.net.HttpURLConnection;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

@Component
public class IpCheckTask {

    private static final Logger log = LoggerFactory.getLogger(IpCheckTask.class);

    @Autowired
    private ProxyIpService proxyIpService;

    @Autowired
    private PendingProxyIpService pendingProxyIpService;

    @Autowired
    private IpLocationApiService ipLocationApiService;

    @Autowired
    private IpGroupService ipGroupService;

    @Value("${ip.check.timeout:5000}")
    private int timeout;

    @Value("${ip.check.thread-pool-size:10}")
    private int threadPoolSize;

    @Scheduled(cron = "${ip.check.cron:0 */5 * * * ?}")
    public void checkProxyIps() {
        log.info("开始执行代理IP检查任务");
        long startTime = System.currentTimeMillis();

        List<ProxyIp> ipList = proxyIpService.list(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<ProxyIp>()
                        .in(ProxyIp::getStatus, 1, 2)
                        .orderByAsc(ProxyIp::getLastCheckTime)
                        .last("LIMIT 200"));

        if (ipList.isEmpty()) {
            log.info("没有需要检查的代理IP");
            return;
        }

        ExecutorService executor = Executors.newFixedThreadPool(threadPoolSize);
        int successCount = 0;
        int failCount = 0;

        for (ProxyIp proxyIp : ipList) {
            executor.submit(() -> {
                try {
                    boolean available = checkIp(proxyIp.getIp(), proxyIp.getPort(), proxyIp.getProtocol());
                    proxyIp.setLastCheckTime(LocalDateTime.now());
                    proxyIp.setResponseTime(null);

                    if (available) {
                        proxyIp.setStatus(1);
                        proxyIp.setLastSuccessTime(LocalDateTime.now());
                        if (proxyIp.getSurviveDate() == null) {
                            proxyIp.setSurviveDate(LocalDate.now());
                        }
                    } else {
                        proxyIp.setStatus(2);
                    }
                    proxyIpService.updateById(proxyIp);
                } catch (Exception e) {
                    log.error("检查IP {}:{} 失败: {}", proxyIp.getIp(), proxyIp.getPort(), e.getMessage());
                }
            });
        }

        executor.shutdown();
        try {
            executor.awaitTermination(5, TimeUnit.MINUTES);
        } catch (InterruptedException e) {
            log.error("IP检查任务被中断");
        }

        long cost = System.currentTimeMillis() - startTime;
        log.info("代理IP检查任务完成，耗时: {}ms", cost);
    }

    @Scheduled(fixedDelay = 60000)
    public void checkPendingIps() {
        List<PendingProxyIp> pendingList = pendingProxyIpService.getPendingList(50);
        if (pendingList.isEmpty()) {
            return;
        }

        log.info("开始检查待验证IP，数量: {}", pendingList.size());

        ExecutorService executor = Executors.newFixedThreadPool(threadPoolSize);

        for (PendingProxyIp pendingIp : pendingList) {
            executor.submit(() -> {
                try {
                    boolean available = checkIp(pendingIp.getIp(), pendingIp.getPort(), pendingIp.getProtocol());
                    pendingIpService.markVerified(pendingIp.getId(), available);

                    if (available) {
                        ProxyIp proxyIp = new ProxyIp();
                        proxyIp.setIp(pendingIp.getIp());
                        proxyIp.setPort(pendingIp.getPort());
                        proxyIp.setProtocol(pendingIp.getProtocol());
                        proxyIp.setStatus(1);
                        proxyIp.setSupplier(pendingIp.getSupplier());
                        proxyIp.setUseCount(0);
                        proxyIp.setSuccessCount(0);
                        proxyIp.setFailCount(0);
                        proxyIp.setAnonymityLevel(1);
                        proxyIp.setSurviveDate(LocalDate.now());
                        proxyIp.setLastCheckTime(LocalDateTime.now());
                        proxyIp.setLastSuccessTime(LocalDateTime.now());

                        try {
                            proxyIpService.save(proxyIp);

                            com.qi.ipmanage.entity.IpGroup defaultGroup = ipGroupService.getByCode("default");
                            if (defaultGroup != null) {
                                proxyIpService.batchAddToGroup(
                                        java.util.Collections.singletonList(proxyIp.getId()),
                                        java.util.Collections.singletonList(defaultGroup.getId()));
                            }

                            fillLocation(proxyIp);
                        } catch (Exception e) {
                            log.info("IP已存在: {}:{}", pendingIp.getIp(), pendingIp.getPort());
                        }
                    }
                } catch (Exception e) {
                    log.error("验证待验证IP {}:{} 失败: {}", pendingIp.getIp(), pendingIp.getPort(), e.getMessage());
                }
            });
        }

        executor.shutdown();
        try {
            executor.awaitTermination(5, TimeUnit.MINUTES);
        } catch (InterruptedException e) {
            log.error("待验证IP检查任务被中断");
        }
    }

    private boolean checkIp(String ip, int port, String protocol) {
        try {
            Proxy proxy = new Proxy(Proxy.Type.HTTP, new InetSocketAddress(ip, port));
            URL url = new URL("http://httpbin.org/ip");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection(proxy);
            conn.setConnectTimeout(timeout);
            conn.setReadTimeout(timeout);
            conn.setRequestMethod("GET");

            long startTime = System.currentTimeMillis();
            int responseCode = conn.getResponseCode();
            long responseTime = System.currentTimeMillis() - startTime;

            if (responseCode == 200) {
                BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                String line;
                StringBuilder response = new StringBuilder();
                while ((line = reader.readLine()) != null) {
                    response.append(line);
                }
                reader.close();

                String responseStr = response.toString();
                conn.disconnect();
                return responseStr.contains(ip);
            }

            conn.disconnect();
        } catch (Exception e) {
        }
        return false;
    }

    private void fillLocation(ProxyIp proxyIp) {
        try {
            JSONObject locationInfo = ipLocationApiService.getIpLocation(proxyIp.getIp());
            if (locationInfo != null) {
                if (locationInfo.containsKey("location")) {
                    proxyIp.setLocation(locationInfo.getString("location"));
                }
                if (locationInfo.containsKey("province")) {
                    proxyIp.setProvince(locationInfo.getString("province"));
                }
                if (locationInfo.containsKey("city")) {
                    proxyIp.setCity(locationInfo.getString("city"));
                }
                if (locationInfo.containsKey("isp")) {
                    proxyIp.setIsp(locationInfo.getString("isp"));
                }
                proxyIpService.updateById(proxyIp);
            }
        } catch (Exception e) {
            log.warn("获取IP归属地失败: {}", e.getMessage());
        }
    }
}
