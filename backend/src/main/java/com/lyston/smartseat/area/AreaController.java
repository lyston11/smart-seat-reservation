package com.lyston.smartseat.area;

import com.lyston.smartseat.common.ApiResponse;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/areas")
public class AreaController {

    private final AreaService areaService;

    public AreaController(AreaService areaService) {
        this.areaService = areaService;
    }

    @GetMapping
    public ApiResponse<List<AreaResponse>> listAreas() {
        return ApiResponse.ok(areaService.listAreas());
    }
}
