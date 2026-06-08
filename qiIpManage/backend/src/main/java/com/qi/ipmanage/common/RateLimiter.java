package com.qi.ipmanage.common;

import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class RateLimiter {

    private static final long WINDOW_SIZE = 1000;

    private final Map<String, RateLimitInfo> limitMap = new HashMap<>();

    public synchronized boolean tryAcquire(String key, int limit) {
        long now = System.currentTimeMillis();
        RateLimitInfo info = limitMap.get(key);

        if (info == null || now - info.windowStart > WINDOW_SIZE) {
            info = new RateLimitInfo();
            info.windowStart = now;
            info.count = new AtomicInteger(0);
            limitMap.put(key, info);
        }

        return info.count.incrementAndGet() <= limit;
    }

    private static class RateLimitInfo {
        long windowStart;
        AtomicInteger count;
    }
}
