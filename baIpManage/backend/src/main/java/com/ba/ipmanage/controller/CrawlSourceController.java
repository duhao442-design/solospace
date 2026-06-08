package com.ba.ipmanage.controller;

import com.ba.ipmanage.common.Result;
import com.ba.ipmanage.entity.CrawlSource;
import com.ba.ipmanage.service.CrawlService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/crawlSource")
@CrossOrigin
public class CrawlSourceController {

    @Autowired
    private CrawlService crawlService;

    @GetMapping("/list")
    public Result<List<CrawlSource>> list() {
        return Result.success(crawlService.listSources());
    }

    @PostMapping
    public Result<?> save(@RequestBody CrawlSource source) {
        boolean success = crawlService.saveSource(source);
        return success ? Result.success() : Result.error("保存失败");
    }

    @DeleteMapping("/{id}")
    public Result<?> delete(@PathVariable Long id) {
        boolean success = crawlService.deleteSource(id);
        return success ? Result.success() : Result.error("删除失败");
    }

    @PostMapping("/runNow")
    public Result<?> runNow() {
        new Thread(() -> crawlService.crawlFromAllSources()).start();
        return Result.success("已开始爬取");
    }
}
