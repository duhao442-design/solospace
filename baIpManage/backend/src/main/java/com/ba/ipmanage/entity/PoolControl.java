package com.ba.ipmanage.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@TableName("pool_control")
public class PoolControl implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long requesterId;

    private Integer controlType;

    private Long groupId;

    private LocalDateTime createdTime;
}
