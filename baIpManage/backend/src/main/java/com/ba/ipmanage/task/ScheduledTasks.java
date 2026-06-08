package com.ba.ipmanage.task;

import com.ba.ipmanage.service.CrawlService;
import com.ba.ipmanage.service.IpCheckService;
import com.ba.ipmanage.service.SystemConfigService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ScheduledTasks {

    private static final Logger log = LoggerFactory.getLogger(ScheduledTasks.class);

    @Autowired
    private IpCheckService ipCheckService;

    @Autowired
    private CrawlService crawlService;

    @Autowired
    private SystemConfigService systemConfigService;

    @Scheduled(fixedDelayString = "${ip.check.interval:300000}")
    public void checkProxyIps() {
        try {
            log.info("执行定时任务: 检查代理IP可用性");
            ipCheckService.checkAllIps();
        } catch (Exception e) {
            log.error("IP检查任务执行异常", e);
        }
    }

    @Scheduled(cron = "0 0 1 * * ?")
    public void checkExpiredIps() {
        try {
            log.info("执行定时任务: 检查过期IP");
            ipCheckService.checkExpiredIps();
        } catch (Exception e) {
            log.error("过期IP检查任务执行异常", e);
        }
    }

    @Scheduled(fixedDelayString = "${ip.crawl.interval:3600000}")
    public void crawlProxyIps() {
        try {
            boolean enable = systemConfigService.getConfigBoolean("crawl.enable", true);
            if (!enable) {
                return;
            }
            log.info("执行定时任务: 爬取代理IP");
            crawlService.crawlFromAllSources();
        } catch (Exception e) {
            log.error("IP爬取任务执行异常", e);
        }
    }

    @Scheduled(fixedDelay = 120000)
    public void processPendingIps() {
        try {
            log.info("执行定时任务: 处理待验证IP");
            crawlService.processPendingIps(ipCheckService);
        } catch (Exception e) {
            log.error("待验证IP处理任务执行异常", e);
        }
    }
}
