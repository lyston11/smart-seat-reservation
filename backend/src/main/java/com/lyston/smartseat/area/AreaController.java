package com.lyston.smartseat.area;

import com.lyston.smartseat.auth.CurrentUser;
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
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(ApiPaths.AREAS)
public class AreaController {

    private final AreaService areaService;

    public AreaController(AreaService areaService) {
        this.areaService = areaService;
    }

    @GetMapping
    public ApiResponse<List<AreaResponse>> listAreas() {
        return ApiResponse.ok(areaService.listAreas());
    }

    @PostMapping
    @RequireRole(UserRole.ADMIN)
    public ApiResponse<AreaResponse> createArea(
            @Valid @RequestBody CreateAreaRequest request,
            CurrentUser currentUser
    ) {
        return ApiResponse.ok(areaService.createArea(request, currentUser.id()));
    }

    @PutMapping("/{areaId}")
    @RequireRole(UserRole.ADMIN)
    public ApiResponse<AreaResponse> updateArea(
            @PathVariable Long areaId,
            @Valid @RequestBody UpdateAreaRequest request,
            CurrentUser currentUser
    ) {
        return ApiResponse.ok(areaService.updateArea(areaId, request, currentUser.id()));
    }

    @PatchMapping("/{areaId}/status")
    @RequireRole(UserRole.ADMIN)
    public ApiResponse<AreaResponse> updateAreaStatus(
            @PathVariable Long areaId,
            @Valid @RequestBody UpdateAreaStatusRequest request,
            CurrentUser currentUser
    ) {
        return ApiResponse.ok(areaService.updateAreaStatus(areaId, request, currentUser.id()));
    }
}
