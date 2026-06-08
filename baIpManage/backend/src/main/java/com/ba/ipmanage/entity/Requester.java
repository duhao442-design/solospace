package com.ba.ipmanage.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@TableName("requester")
public class Requester implements Serializable {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String requesterKey;

    private Integer requesterType;

    private String name;

    private Integer status;

    private Integer rateLimit;

    private Integer rateLimitDay;

    private LocalDateTime createdTime;

    private LocalDateTime updatedTime;
}
