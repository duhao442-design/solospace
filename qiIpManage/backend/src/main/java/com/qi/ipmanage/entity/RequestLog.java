package com.qi.ipmanage.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@TableName("request_log")
public class RequestLog implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long proxyIpId;

    private String proxyIp;

    private String requesterIp;

    private String requesterDomain;

    private String targetUrl;

    private String requestPath;

    private String requestMethod;

    private Integer responseStatus;

    private Integer responseTime;

    private Integer success;

    private String errorMsg;

    private LocalDateTime createTime;
}
