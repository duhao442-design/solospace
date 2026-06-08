package com.qi.ipmanage.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@TableName("crawler_source")
public class CrawlerSource implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(type = IdType.AUTO)
    private Long id;

    private String sourceName;

    private String sourceUrl;

    private String parserType;

    private String parserRule;

    private Integer crawlInterval;

    private LocalDateTime lastCrawlTime;

    private Integer status;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;
}
