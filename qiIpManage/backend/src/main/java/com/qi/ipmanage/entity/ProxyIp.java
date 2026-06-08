package com.qi.ipmanage.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.time.LocalDate;

@Data
@TableName("proxy_ip")
public class ProxyIp implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(type = IdType.AUTO)
    private Long id;

    private String ip;

    private Integer port;

    private String protocol;

    private Integer status;

    private String supplier;

    private String location;

    private String province;

    private String city;

    private String isp;

    private Integer useCount;

    private Integer successCount;

    private Integer failCount;

    private Integer responseTime;

    private Integer anonymityLevel;

    private String remark;

    private LocalDate surviveDate;

    private LocalDateTime lastCheckTime;

    private LocalDateTime lastSuccessTime;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;
}
