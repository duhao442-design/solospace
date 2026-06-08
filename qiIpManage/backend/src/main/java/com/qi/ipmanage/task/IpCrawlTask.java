package com.qi.ipmanage.task;

import com.qi.ipmanage.entity.CrawlerSource;
import com.qi.ipmanage.service.CrawlerSourceService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class IpCrawlTask {

    private static final Logger log = LoggerFactory.getLogger(IpCrawlTask.class);

    @Autowired
    private CrawlerSourceService crawlerSourceService;

    @Scheduled(cron = "${ip.crawl.cron:0 0 */1 * * ?}")
    public void crawlIps() {
        log.info("开始执行IP爬取任务");
        long startTime = System.currentTimeMillis();

        List<CrawlerSource> sources = crawlerSourceService.getEnabledList();
        int totalCount = 0;

        for (CrawlerSource source : sources) {
            try {
                int count = crawlerSourceService.crawlFromSource(source);
                totalCount += count;
                log.info("从 {} 爬取了 {} 个IP", source.getSourceName(), count);
            } catch (Exception e) {
                log.error("从 {} 爬取IP失败: {}", source.getSourceName(), e.getMessage());
            }
        }

        long cost = System.currentTimeMillis() - startTime;
        log.info("IP爬取任务完成，共爬取 {} 个IP，耗时: {}ms", totalCount, cost);
    }
}
