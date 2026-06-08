package com.ba.ipmanage.service;

import com.ba.ipmanage.entity.ProxyIp;
import com.ba.ipmanage.mapper.ProxyIpMapper;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import cn.hutool.http.HttpRequest;
import cn.hutool.http.HttpResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.net.InetSocketAddress;
import java.net.Proxy;
import java.net.Socket;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;

@Service
public class IpCheckService {

    private static final Logger log = LoggerFactory.getLogger(IpCheckService.class);

    @Autowired
    private ProxyIpMapper proxyIpMapper;

    @Autowired
    private IpLocationService ipLocationService;

    @Autowired
    private SystemConfigService systemConfigService;

    public boolean checkProxyIp(ProxyIp proxyIp) {
        String ip = proxyIp.getIp();
        int port = proxyIp.getPort();
        String protocol = proxyIp.getProtocol() != null ? proxyIp.getProtocol() : "http";
        int timeout = systemConfigService.getConfigInt("check.timeout", 5000);

        long startTime = System.currentTimeMillis();
        boolean available = false;
        int responseTime = 0;

        try {
            if ("socks5".equalsIgnoreCase(protocol)) {
                available = checkSocks5(ip, port, timeout);
            } else {
                available = checkHttpProxy(ip, port, timeout);
            }
            responseTime = (int) (System.currentTimeMillis() - startTime);
        } catch (Exception e) {
            log.debug("检查代理IP失败: {}:{} - {}", ip, port, e.getMessage());
        }

        proxyIp.setLastCheckTime(LocalDateTime.now());
        proxyIp.setResponseTime(available ? responseTime : null);
        proxyIp.setStatus(available ? 1 : 2);
        proxyIp.setUpdatedTime(LocalDateTime.now());

        if (available && (proxyIp.getLocation() == null || proxyIp.getLocation().isEmpty())) {
            ipLocationService.fillIpLocation(proxyIp);
        }

        if (proxyIp.getSurvivalDate() != null && proxyIp.getSurvivalDate().isBefore(LocalDate.now())) {
            proxyIp.setStatus(3);
        }

        proxyIpMapper.updateById(proxyIp);

        return available;
    }

    private boolean checkHttpProxy(String ip, int port, int timeout) {
        try {
            String testUrl = "http://httpbin.org/ip";
            Proxy proxy = new Proxy(Proxy.Type.HTTP, new InetSocketAddress(ip, port));
            HttpRequest request = HttpRequest.get(testUrl)
                    .setProxy(proxy)
                    .timeout(timeout);
            HttpResponse response = request.execute();
            return response.isOk() && response.body().contains("origin");
        } catch (Exception e) {
            return false;
        }
    }

    private boolean checkSocks5(String ip, int port, int timeout) {
        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress(ip, port), timeout);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public void checkAllIps() {
        log.info("开始批量检查代理IP可用性...");
        LambdaQueryWrapper<ProxyIp> wrapper = new LambdaQueryWrapper<>();
        wrapper.in(ProxyIp::getStatus, 0, 1);
        List<ProxyIp> ipList = proxyIpMapper.selectList(wrapper);

        int availableCount = 0;
        int total = ipList.size();

        for (ProxyIp ip : ipList) {
            if (checkProxyIp(ip)) {
                availableCount++;
            }
        }

        log.info("IP可用性检查完成, 总数: {}, 可用: {}, 不可用: {}", total, availableCount, total - availableCount);
    }

    public void checkExpiredIps() {
        log.info("检查已过期的IP...");
        LambdaQueryWrapper<ProxyIp> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ProxyIp::getStatus, 1)
                .lt(ProxyIp::getSurvivalDate, LocalDate.now())
                .isNotNull(ProxyIp::getSurvivalDate);
        List<ProxyIp> expiredIps = proxyIpMapper.selectList(wrapper);

        for (ProxyIp ip : expiredIps) {
            ip.setStatus(3);
            ip.setUpdatedTime(LocalDateTime.now());
            proxyIpMapper.updateById(ip);
        }

        log.info("已处理 {} 个过期IP", expiredIps.size());
    }
}
