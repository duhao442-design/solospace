package com.ba.ipmanage.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@TableName("ip_group_relation")
public class IpGroupRelation implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long groupId;

    private Long proxyIpId;

    private LocalDateTime createdTime;
}
