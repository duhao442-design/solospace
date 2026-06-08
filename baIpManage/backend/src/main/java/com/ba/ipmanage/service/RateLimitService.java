package com.ba.ipmanage.service;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class RateLimitService {

    private final Cache<String, RateLimitInfo> rateLimitCache = Caffeine.newBuilder()
            .maximumSize(10000)
            .expireAfterWrite(1, TimeUnit.MINUTES)
            .build();

    private final Cache<String, DailyLimitInfo> dailyLimitCache = Caffeine.newBuilder()
            .maximumSize(10000)
            .expireAfterWrite(24, TimeUnit.HOURS)
            .build();

    private final AtomicInteger globalCounter = new AtomicInteger(0);
    private final AtomicLong globalWindowStart = new AtomicLong(System.currentTimeMillis());
    private volatile int globalRateLimit = 1000;

    private static class RateLimitInfo {
        final AtomicInteger count;
        final long windowStart;

        RateLimitInfo(int count, long windowStart) {
            this.count = new AtomicInteger(count);
            this.windowStart = windowStart;
        }
    }

    private static class DailyLimitInfo {
        final AtomicInteger count;
        final long dayStart;

        DailyLimitInfo(int count, long dayStart) {
            this.count = new AtomicInteger(count);
            this.dayStart = dayStart;
        }
    }

    public void setGlobalRateLimit(int limit) {
        this.globalRateLimit = limit;
    }

    public boolean tryAcquireGlobal() {
        long now = System.currentTimeMillis();
        long windowStart = globalWindowStart.get();
        if (now - windowStart > 1000) {
            globalWindowStart.set(now);
            globalCounter.set(1);
            return true;
        }
        return globalCounter.incrementAndGet() <= globalRateLimit;
    }

    public boolean tryAcquire(String key, int limitPerSecond) {
        if (limitPerSecond <= 0) {
            return true;
        }
        long now = System.currentTimeMillis();
        RateLimitInfo info = rateLimitCache.get(key, k -> new RateLimitInfo(0, now));
        if (now - info.windowStart > 1000) {
            info = new RateLimitInfo(0, now);
            rateLimitCache.put(key, info);
        }
        return info.count.incrementAndGet() <= limitPerSecond;
    }

    public boolean tryAcquireDaily(String key, int limitPerDay) {
        if (limitPerDay <= 0) {
            return true;
        }
        long todayStart = getTodayStart();
        DailyLimitInfo info = dailyLimitCache.get(key, k -> new DailyLimitInfo(0, todayStart));
        if (info.dayStart < todayStart) {
            info = new DailyLimitInfo(0, todayStart);
            dailyLimitCache.put(key, info);
        }
        return info.count.incrementAndGet() <= limitPerDay;
    }

    private long getTodayStart() {
        long now = System.currentTimeMillis();
        long oneDay = 24 * 60 * 60 * 1000L;
        return (now / oneDay) * oneDay;
    }
}
