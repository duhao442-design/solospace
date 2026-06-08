package com.qi.ipmanage.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.qi.ipmanage.common.PageResult;
import com.qi.ipmanage.entity.CrawlerSource;
import com.qi.ipmanage.mapper.CrawlerSourceMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import cn.hutool.http.HttpRequest;
import cn.hutool.http.HttpResponse;
import org.springframework.beans.factory.annotation.Autowired;

@Service
public class CrawlerSourceService extends ServiceImpl<CrawlerSourceMapper, CrawlerSource> {

    @Autowired
    private PendingProxyIpService pendingProxyIpService;

    public PageResult<CrawlerSource> page(Integer pageNum, Integer pageSize, String keyword, Integer status) {
        LambdaQueryWrapper<CrawlerSource> wrapper = new LambdaQueryWrapper<>();
        if (keyword != null && !keyword.isEmpty()) {
            wrapper.like(CrawlerSource::getSourceName, keyword);
        }
        if (status != null) {
            wrapper.eq(CrawlerSource::getStatus, status);
        }
        wrapper.orderByDesc(CrawlerSource::getCreateTime);
        IPage<CrawlerSource> page = this.page(new Page<>(pageNum, pageSize), wrapper);
        return PageResult.of(page);
    }

    public List<CrawlerSource> getEnabledList() {
        return this.list(new LambdaQueryWrapper<CrawlerSource>().eq(CrawlerSource::getStatus, 1));
    }

    public int crawlFromSource(CrawlerSource source) {
        int count = 0;
        try {
            HttpResponse response = HttpRequest.get(source.getSourceUrl())
                    .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                    .timeout(10000)
                    .execute();

            if (response.isOk()) {
                String html = response.body();
                List<String[]> ipList = parseIps(html, source.getParserType(), source.getParserRule());
                for (String[] ipPort : ipList) {
                    if (ipPort.length >= 2) {
                        String ip = ipPort[0];
                        int port = Integer.parseInt(ipPort[1]);
                        String protocol = ipPort.length > 2 ? ipPort[2] : "http";
                        if (pendingProxyIpService.addPendingIp(ip, port, protocol, source.getSourceName(), null)) {
                            count++;
                        }
                    }
                }
            }

            source.setLastCrawlTime(LocalDateTime.now());
            this.updateById(source);
        } catch (Exception e) {
            e.printStackTrace();
        }
        return count;
    }

    private List<String[]> parseIps(String content, String parserType, String parserRule) {
        if ("regex".equalsIgnoreCase(parserType)) {
            return parseByRegex(content, parserRule);
        }
        return java.util.Collections.emptyList();
    }

    private List<String[]> parseByRegex(String content, String regex) {
        List<String[]> result = new java.util.ArrayList<>();
        try {
            Pattern pattern = Pattern.compile(regex);
            Matcher matcher = pattern.matcher(content);
            while (matcher.find()) {
                String[] ipPort = new String[matcher.groupCount()];
                for (int i = 0; i < matcher.groupCount(); i++) {
                    ipPort[i] = matcher.group(i + 1);
                }
                result.add(ipPort);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return result;
    }
}
