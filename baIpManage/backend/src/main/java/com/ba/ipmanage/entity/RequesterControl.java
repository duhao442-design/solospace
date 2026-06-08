package com.ba.ipmanage.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@TableName("requester_control")
public class RequesterControl implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long requesterId;

    private Integer controlType;

    private Integer targetType;

    private String targetValue;

    private LocalDateTime createdTime;
}
