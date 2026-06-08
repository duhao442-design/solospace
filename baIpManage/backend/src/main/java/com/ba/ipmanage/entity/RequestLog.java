package com.ba.ipmanage.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@TableName("request_log")
public class RequestLog implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String requesterIp;

    private String requesterDomain;

    private Long proxyIpId;

    private String proxyIp;

    private String apiType;

    private LocalDateTime requestTime;

    private Integer responseStatus;
}
