package com.ba.ipmanage.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@TableName("pending_proxy_ip")
public class PendingProxyIp implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String ip;

    private Integer port;

    private String protocol;

    private String source;

    private Integer status;

    private LocalDateTime createdTime;
}
