package com.lyston.smartseat.seat;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;

@TableName("seats")
public class Seat {

    @TableId
    private Long id;
    private Long areaId;
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
    private Integer tablePositionX;
    @TableField(exist = false)
    private Integer tablePositionY;
    @TableField(exist = false)
    private Integer tableWidthPx;
    @TableField(exist = false)
    private Integer tableHeightPx;
    @TableField(exist = false)
    private Integer tableRotationDeg;
    private String seatNo;
    private String seatLabel;
    private String seatSide;
    private Integer seatOrder;
    private Integer rowNo;
    private Integer columnNo;
    private Integer displayOrder;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getAreaId() {
        return areaId;
    }

    public void setAreaId(Long areaId) {
        this.areaId = areaId;
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

    public Integer getTablePositionX() {
        return tablePositionX;
    }

    public void setTablePositionX(Integer tablePositionX) {
        this.tablePositionX = tablePositionX;
    }

    public Integer getTablePositionY() {
        return tablePositionY;
    }

    public void setTablePositionY(Integer tablePositionY) {
        this.tablePositionY = tablePositionY;
    }

    public Integer getTableWidthPx() {
        return tableWidthPx;
    }

    public void setTableWidthPx(Integer tableWidthPx) {
        this.tableWidthPx = tableWidthPx;
    }

    public Integer getTableHeightPx() {
        return tableHeightPx;
    }

    public void setTableHeightPx(Integer tableHeightPx) {
        this.tableHeightPx = tableHeightPx;
    }

    public Integer getTableRotationDeg() {
        return tableRotationDeg;
    }

    public void setTableRotationDeg(Integer tableRotationDeg) {
        this.tableRotationDeg = tableRotationDeg;
    }

    public String getSeatNo() {
        return seatNo;
    }

    public void setSeatNo(String seatNo) {
        this.seatNo = seatNo;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
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
