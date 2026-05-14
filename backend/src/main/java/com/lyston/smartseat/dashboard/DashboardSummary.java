package com.lyston.smartseat.dashboard;

public class DashboardSummary {

    private long totalSlots;
    private long availableSlots;
    private long reservedSlots;
    private long usingSlots;
    private long abnormalSlots;
    private long activeReservations;
    private long checkedInReservations;

    public long getTotalSlots() {
        return totalSlots;
    }

    public void setTotalSlots(long totalSlots) {
        this.totalSlots = totalSlots;
    }

    public long getAvailableSlots() {
        return availableSlots;
    }

    public void setAvailableSlots(long availableSlots) {
        this.availableSlots = availableSlots;
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

    public long getActiveReservations() {
        return activeReservations;
    }

    public void setActiveReservations(long activeReservations) {
        this.activeReservations = activeReservations;
    }

    public long getCheckedInReservations() {
        return checkedInReservations;
    }

    public void setCheckedInReservations(long checkedInReservations) {
        this.checkedInReservations = checkedInReservations;
    }
}
