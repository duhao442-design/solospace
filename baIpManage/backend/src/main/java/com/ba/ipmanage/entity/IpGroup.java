package com.ba.ipmanage.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@TableName("ip_group")
public class IpGroup implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String groupName;

    private String groupCode;

    private String description;

    private LocalDateTime createdTime;

    private LocalDateTime updatedTime;
}
