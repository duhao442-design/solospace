package com.ba.ipmanage.entity;

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

    @TableId(type = IdType.AUTO)
    private Long id;

    private String ip;

    private Integer port;

    private String protocol;

    private Integer status;

    private String supplier;

    private String location;

    private String country;

    private String province;

    private String city;

    private Integer useCount;

    private String remark;

    private LocalDate survivalDate;

    private LocalDateTime lastCheckTime;

    private Integer responseTime;

    private Integer anonymityLevel;

    private LocalDateTime createdTime;

    private LocalDateTime updatedTime;
}
