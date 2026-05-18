package com.lyston.smartseat.table;

public record StudyTableQrResponse(
        Long tableId,
        String tableNo,
        String qrToken,
        String checkinPath
) {

    public static StudyTableQrResponse from(StudyTable table) {
        return new StudyTableQrResponse(
                table.getId(),
                table.getTableNo(),
                table.getQrToken(),
                "/student/table-checkin?token=" + table.getQrToken()
        );
    }
}
