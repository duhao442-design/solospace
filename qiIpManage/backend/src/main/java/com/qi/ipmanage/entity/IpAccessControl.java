package com.qi.ipmanage.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@TableName("ip_access_control")
public class IpAccessControl implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long proxyIpId;

    private Integer controlTargetType;

    private String controlTargetValue;

    private Integer controlType;

    private Integer status;

    private LocalDateTime createTime;
}
