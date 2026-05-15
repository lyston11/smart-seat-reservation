package com.lyston.smartseat.dashboard;

public class AreaUsageSummary {

    private Long areaId;
    private String areaName;
    private long totalSlots;
    private long reservedSlots;
    private long usingSlots;
    private long abnormalSlots;
    private double usageRate;

    public Long getAreaId() {
        return areaId;
    }

    public void setAreaId(Long areaId) {
        this.areaId = areaId;
    }

    public String getAreaName() {
        return areaName;
    }

    public void setAreaName(String areaName) {
        this.areaName = areaName;
    }

    public long getTotalSlots() {
        return totalSlots;
    }

    public void setTotalSlots(long totalSlots) {
        this.totalSlots = totalSlots;
    }

    public long getReservedSlots() {
        return reservedSlots;
    }

    public void setReservedSlots(long reservedSlots) {
        this.reservedSlots = reservedSlots;
    }

    public long getUsingSlots() {
        return usingSlots;
    }

    public void setUsingSlots(long usingSlots) {
        this.usingSlots = usingSlots;
    }

    public long getAbnormalSlots() {
        return abnormalSlots;
    }

    public void setAbnormalSlots(long abnormalSlots) {
        this.abnormalSlots = abnormalSlots;
    }

    public double getUsageRate() {
        return usageRate;
    }

    public void setUsageRate(double usageRate) {
        this.usageRate = usageRate;
    }
}
