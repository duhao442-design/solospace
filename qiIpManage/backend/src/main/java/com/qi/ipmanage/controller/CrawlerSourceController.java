package com.qi.ipmanage.controller;

import com.qi.ipmanage.common.PageResult;
import com.qi.ipmanage.common.Result;
import com.qi.ipmanage.entity.CrawlerSource;
import com.qi.ipmanage.service.CrawlerSourceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/crawler-source")
public class CrawlerSourceController {

    @Autowired
    private CrawlerSourceService crawlerSourceService;

    @GetMapping("/page")
    public Result<PageResult<CrawlerSource>> page(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "20") Integer pageSize,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer status) {
        return Result.success(crawlerSourceService.page(pageNum, pageSize, keyword, status));
    }

    @GetMapping("/{id}")
    public Result<CrawlerSource> getById(@PathVariable Long id) {
        return Result.success(crawlerSourceService.getById(id));
    }

    @PostMapping
    public Result<Boolean> save(@RequestBody CrawlerSource crawlerSource) {
        return Result.success(crawlerSourceService.saveOrUpdate(crawlerSource));
    }

    @DeleteMapping("/{id}")
    public Result<Boolean> delete(@PathVariable Long id) {
        return Result.success(crawlerSourceService.removeById(id));
    }

    @PutMapping("/status/{id}/{status}")
    public Result<Boolean> updateStatus(@PathVariable Long id, @PathVariable Integer status) {
        CrawlerSource source = new CrawlerSource();
        source.setId(id);
        source.setStatus(status);
        return Result.success(crawlerSourceService.updateById(source));
    }

    @PostMapping("/crawl/{id}")
    public Result<Integer> crawl(@PathVariable Long id) {
        CrawlerSource source = crawlerSourceService.getById(id);
        if (source == null) {
            return Result.error("爬取源不存在");
        }
        int count = crawlerSourceService.crawlFromSource(source);
        return Result.success("成功爬取 " + count + " 个IP", count);
    }
}
