package com.ba.ipmanage.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@TableName("crawl_source")
public class CrawlSource implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String sourceName;

    private String sourceUrl;

    private String parseRule;

    private Integer status;

    private Integer crawlInterval;

    private LocalDateTime lastCrawlTime;

    private LocalDateTime createdTime;

    private LocalDateTime updatedTime;
}
