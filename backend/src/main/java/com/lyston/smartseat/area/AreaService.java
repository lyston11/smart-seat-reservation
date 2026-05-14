package com.lyston.smartseat.area;

import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class AreaService {

    private final AreaMapper areaMapper;

    public AreaService(AreaMapper areaMapper) {
        this.areaMapper = areaMapper;
    }

    public List<AreaResponse> listAreas() {
        return areaMapper.findAllOrderById()
                .stream()
                .map(AreaResponse::from)
                .toList();
    }
}
