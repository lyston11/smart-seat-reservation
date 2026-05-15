package com.lyston.smartseat.reservation;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;

@TableName("reservation_rules")
public class ReservationRule {

    @TableId
    private Long id;
    private Integer checkinGraceMinutes;
    private Integer maxAdvanceDays;
    private Integer dailyActiveReservationLimit;
    private Long updatedBy;
    private LocalDateTime updatedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Integer getCheckinGraceMinutes() {
        return checkinGraceMinutes;
    }

    public void setCheckinGraceMinutes(Integer checkinGraceMinutes) {
        this.checkinGraceMinutes = checkinGraceMinutes;
    }

    public Integer getMaxAdvanceDays() {
        return maxAdvanceDays;
    }

    public void setMaxAdvanceDays(Integer maxAdvanceDays) {
        this.maxAdvanceDays = maxAdvanceDays;
    }

    public Integer getDailyActiveReservationLimit() {
        return dailyActiveReservationLimit;
    }

    public void setDailyActiveReservationLimit(Integer dailyActiveReservationLimit) {
        this.dailyActiveReservationLimit = dailyActiveReservationLimit;
    }

    public Long getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(Long updatedBy) {
        this.updatedBy = updatedBy;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
