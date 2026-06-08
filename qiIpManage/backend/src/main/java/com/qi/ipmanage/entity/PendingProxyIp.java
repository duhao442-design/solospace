package com.qi.ipmanage.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@TableName("pending_proxy_ip")
public class PendingProxyIp implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(type = IdType.AUTO)
    private Long id;

    private String ip;

    private Integer port;

    private String protocol;

    private String source;

    private String supplier;

    private Integer status;

    private Integer verifyCount;

    private LocalDateTime lastVerifyTime;

    private LocalDateTime createTime;
}
