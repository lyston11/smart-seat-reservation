package com.lyston.smartseat.seat;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@TableName("seat_slots")
public class SeatSlot {

    @TableId
    private Long id;
    private Long seatId;
    @TableField(exist = false)
    private String seatNo;
    @TableField(exist = false)
    private Long tableId;
    @TableField(exist = false)
    private String tableNo;
    @TableField(exist = false)
    private Integer tableRowNo;
    @TableField(exist = false)
    private Integer tableColumnNo;
    @TableField(exist = false)
    private Integer tableDisplayOrder;
    @TableField(exist = false)
    private String seatLabel;
    @TableField(exist = false)
    private String seatSide;
    @TableField(exist = false)
    private Integer seatOrder;
    @TableField(exist = false)
    private Integer rowNo;
    @TableField(exist = false)
    private Integer columnNo;
    @TableField(exist = false)
    private Integer displayOrder;
    private Long areaId;
    private LocalDate slotDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String status;
    private Long reservedBy;
    private Long reservationId;
    private Integer version;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getSeatId() {
        return seatId;
    }

    public void setSeatId(Long seatId) {
        this.seatId = seatId;
    }

    public String getSeatNo() {
        return seatNo;
    }

    public void setSeatNo(String seatNo) {
        this.seatNo = seatNo;
    }

    public Long getTableId() {
        return tableId;
    }

    public void setTableId(Long tableId) {
        this.tableId = tableId;
    }

    public String getTableNo() {
        return tableNo;
    }

    public void setTableNo(String tableNo) {
        this.tableNo = tableNo;
    }

    public Integer getTableRowNo() {
        return tableRowNo;
    }

    public void setTableRowNo(Integer tableRowNo) {
        this.tableRowNo = tableRowNo;
    }

    public Integer getTableColumnNo() {
        return tableColumnNo;
    }

    public void setTableColumnNo(Integer tableColumnNo) {
        this.tableColumnNo = tableColumnNo;
    }

    public Integer getTableDisplayOrder() {
        return tableDisplayOrder;
    }

    public void setTableDisplayOrder(Integer tableDisplayOrder) {
        this.tableDisplayOrder = tableDisplayOrder;
    }

    public String getSeatLabel() {
        return seatLabel;
    }

    public void setSeatLabel(String seatLabel) {
        this.seatLabel = seatLabel;
    }

    public String getSeatSide() {
        return seatSide;
    }

    public void setSeatSide(String seatSide) {
        this.seatSide = seatSide;
    }

    public Integer getSeatOrder() {
        return seatOrder;
    }

    public void setSeatOrder(Integer seatOrder) {
        this.seatOrder = seatOrder;
    }

    public Integer getRowNo() {
        return rowNo;
    }

    public void setRowNo(Integer rowNo) {
        this.rowNo = rowNo;
    }

    public Integer getColumnNo() {
        return columnNo;
    }

    public void setColumnNo(Integer columnNo) {
        this.columnNo = columnNo;
    }

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
    }

    public Long getAreaId() {
        return areaId;
    }

    public void setAreaId(Long areaId) {
        this.areaId = areaId;
    }

    public LocalDate getSlotDate() {
        return slotDate;
    }

    public void setSlotDate(LocalDate slotDate) {
        this.slotDate = slotDate;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalTime endTime) {
        this.endTime = endTime;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Long getReservedBy() {
        return reservedBy;
    }

    public void setReservedBy(Long reservedBy) {
        this.reservedBy = reservedBy;
    }

    public Long getReservationId() {
        return reservationId;
    }

    public void setReservationId(Long reservationId) {
        this.reservationId = reservationId;
    }

    public Integer getVersion() {
        return version;
    }

    public void setVersion(Integer version) {
        this.version = version;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
