package com.qi.ipmanage.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.time.LocalDate;

@Data
@TableName("ip_location_api")
public class IpLocationApi implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(type = IdType.AUTO)
    private Long id;

    private String apiName;

    private String apiUrl;

    private String requestMethod;

    private String requestParams;

    private String requestHeaders;

    private String responseType;

    private String locationPath;

    private String provincePath;

    private String cityPath;

    private String ispPath;

    private Integer dailyLimit;

    private Integer todayUsed;

    private LocalDate lastResetDate;

    private Integer priority;

    private Integer status;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;
}
