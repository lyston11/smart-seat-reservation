package com.lyston.smartseat.table;

import com.lyston.smartseat.auth.RequireRole;
import com.lyston.smartseat.common.ApiPaths;
import com.lyston.smartseat.common.ApiResponse;
import com.lyston.smartseat.user.UserRole;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(ApiPaths.TABLES)
public class StudyTableController {

    private final StudyTableService studyTableService;

    public StudyTableController(StudyTableService studyTableService) {
        this.studyTableService = studyTableService;
    }

    @GetMapping
    public ApiResponse<List<StudyTableResponse>> listTables(@RequestParam Long areaId) {
        return ApiResponse.ok(studyTableService.listTables(areaId));
    }

    @PostMapping
    @RequireRole(UserRole.ADMIN)
    public ApiResponse<StudyTableResponse> createTable(@Valid @RequestBody CreateStudyTableRequest request) {
        return ApiResponse.ok(studyTableService.createTable(request));
    }

    @PutMapping("/{tableId}")
    @RequireRole(UserRole.ADMIN)
    public ApiResponse<StudyTableResponse> updateTable(
            @PathVariable Long tableId,
            @Valid @RequestBody UpdateStudyTableRequest request
    ) {
        return ApiResponse.ok(studyTableService.updateTable(tableId, request));
    }

    @PatchMapping("/{tableId}/status")
    @RequireRole(UserRole.ADMIN)
    public ApiResponse<StudyTableResponse> updateTableStatus(
            @PathVariable Long tableId,
            @Valid @RequestBody UpdateStudyTableStatusRequest request
    ) {
        return ApiResponse.ok(studyTableService.updateTableStatus(tableId, request));
    }

    @GetMapping("/{tableId}/checkin-qr")
    @RequireRole(UserRole.ADMIN)
    public ApiResponse<StudyTableQrResponse> getCheckinQr(@PathVariable Long tableId) {
        return ApiResponse.ok(studyTableService.getCheckinQr(tableId));
    }
}
