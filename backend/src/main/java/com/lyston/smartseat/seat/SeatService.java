package com.lyston.smartseat.seat;

import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class SeatService {

    private final SeatMapper seatMapper;

    public SeatService(SeatMapper seatMapper) {
        this.seatMapper = seatMapper;
    }

    public List<SeatResponse> listSeats(Long areaId) {
        return seatMapper.findByAreaId(areaId)
                .stream()
                .map(SeatResponse::from)
                .toList();
    }
}
