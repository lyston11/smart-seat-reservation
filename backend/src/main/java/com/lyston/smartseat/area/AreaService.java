package com.lyston.smartseat.area;

import com.lyston.smartseat.audit.AuditAction;
import com.lyston.smartseat.audit.AuditService;
import com.lyston.smartseat.common.BusinessException;
import com.lyston.smartseat.network.IpRangeMatcher;
import com.lyston.smartseat.network.ResolvedClientIp;
import com.lyston.smartseat.seat.SeatMapper;
import com.lyston.smartseat.seat.SeatSlotMapper;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AreaService {

    private static final LocalTime DEFAULT_OPEN_TIME = LocalTime.of(8, 0);
    private static final LocalTime DEFAULT_CLOSE_TIME = LocalTime.of(22, 0);
    private static final String DEFAULT_CHECKIN_IP_CIDRS = "127.0.0.1/32,::1/128";

    private final AreaMapper areaMapper;
    private final SeatMapper seatMapper;
    private final SeatSlotMapper seatSlotMapper;
    private final AuditService auditService;
    private final IpRangeMatcher ipRangeMatcher;

    public AreaService(
            AreaMapper areaMapper,
            SeatMapper seatMapper,
            SeatSlotMapper seatSlotMapper,
            AuditService auditService,
            IpRangeMatcher ipRangeMatcher
    ) {
        this.areaMapper = areaMapper;
        this.seatMapper = seatMapper;
        this.seatSlotMapper = seatSlotMapper;
        this.auditService = auditService;
        this.ipRangeMatcher = ipRangeMatcher;
    }

    public List<AreaResponse> listAreas() {
        return areaMapper.findAllOrderById()
                .stream()
                .map(AreaResponse::from)
                .toList();
    }

    @Transactional
    public AreaResponse createArea(CreateAreaRequest request, Long actorUserId) {
        String name = normalizeName(request.name());
        ensureAreaNameAvailable(name, null);

        LocalDateTime now = LocalDateTime.now();
        Area area = new Area();
        area.setName(name);
        area.setFloor(normalizeNullable(request.floor()));
        area.setDescription(normalizeNullable(request.description()));
        area.setStatus(AreaStatus.ACTIVE);
        area.setOpenTime(resolveOpenTime(request.openTime()));
        area.setCloseTime(resolveCloseTime(request.closeTime()));
        ensureOpeningWindow(area.getOpenTime(), area.getCloseTime());
        area.setCheckinIpCidrs(normalizeCheckinIpCidrs(request.checkinIpCidrs()));
        area.setCreatedAt(now);
        area.setUpdatedAt(now);
        areaMapper.insert(area);
        auditService.record(actorUserId, AuditAction.AREA_CREATE, "AREA", area.getId(), "create area");
        return AreaResponse.from(area);
    }

    @Transactional
    public AreaResponse updateArea(Long areaId, UpdateAreaRequest request, Long actorUserId) {
        Area area = requireArea(areaId);
        String name = normalizeName(request.name());
        String status = normalizeStatus(request.status());

        ensureAreaNameAvailable(name, areaId);
        ensureAreaCanUseStatus(area, status);

        area.setName(name);
        area.setFloor(normalizeNullable(request.floor()));
        area.setDescription(normalizeNullable(request.description()));
        area.setStatus(status);
        area.setOpenTime(resolveOpenTime(request.openTime()));
        area.setCloseTime(resolveCloseTime(request.closeTime()));
        ensureOpeningWindow(area.getOpenTime(), area.getCloseTime());
        area.setCheckinIpCidrs(normalizeCheckinIpCidrs(request.checkinIpCidrs()));
        area.setUpdatedAt(LocalDateTime.now());
        areaMapper.updateById(area);
        auditService.record(actorUserId, AuditAction.AREA_UPDATE, "AREA", area.getId(), "update area");
        return AreaResponse.from(requireArea(areaId));
    }

    public CheckinIpTestResponse testCheckinIp(String checkinIpCidrs, ResolvedClientIp resolvedClientIp) {
        String normalizedCidrs = normalizeCheckinIpCidrs(checkinIpCidrs);
        boolean matched = ipRangeMatcher.matches(resolvedClientIp.clientIp(), normalizedCidrs);
        return new CheckinIpTestResponse(
                resolvedClientIp.clientIp(),
                resolvedClientIp.remoteAddr(),
                resolvedClientIp.forwardedFor(),
                resolvedClientIp.trustedProxy(),
                matched,
                normalizedCidrs
        );
    }

    @Transactional
    public AreaResponse updateAreaStatus(Long areaId, UpdateAreaStatusRequest request, Long actorUserId) {
        Area area = requireArea(areaId);
        String status = normalizeStatus(request.status());
        ensureAreaCanUseStatus(area, status);

        area.setStatus(status);
        area.setUpdatedAt(LocalDateTime.now());
        areaMapper.updateById(area);
        auditService.record(actorUserId, AuditAction.AREA_STATUS_UPDATE, "AREA", area.getId(), "update area status");
        return AreaResponse.from(requireArea(areaId));
    }

    private String normalizeName(String name) {
        return name.trim();
    }

    private String normalizeNullable(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private String normalizeStatus(String status) {
        String normalizedStatus = status.trim().toUpperCase();
        if (!AreaStatus.isAllowed(normalizedStatus)) {
            throw new BusinessException("INVALID_AREA_STATUS", "Area status is invalid");
        }
        return normalizedStatus;
    }

    private LocalTime resolveOpenTime(LocalTime openTime) {
        return openTime == null ? DEFAULT_OPEN_TIME : openTime;
    }

    private LocalTime resolveCloseTime(LocalTime closeTime) {
        return closeTime == null ? DEFAULT_CLOSE_TIME : closeTime;
    }

    private void ensureOpeningWindow(LocalTime openTime, LocalTime closeTime) {
        if (!openTime.isBefore(closeTime)) {
            throw new BusinessException("INVALID_AREA_OPENING_WINDOW", "Area open time must be before close time");
        }
    }

    private String normalizeCheckinIpCidrs(String value) {
        if (value == null || value.isBlank()) {
            return validateCheckinIpCidrs(DEFAULT_CHECKIN_IP_CIDRS);
        }
        return validateCheckinIpCidrs(value.trim().replaceAll("\\s+", ""));
    }

    private String validateCheckinIpCidrs(String value) {
        ipRangeMatcher.validateCidrList(value);
        return value;
    }

    private Area requireArea(Long areaId) {
        Area area = areaMapper.selectById(areaId);
        if (area == null) {
            throw new BusinessException("AREA_NOT_FOUND", "Area not found");
        }
        return area;
    }

    private void ensureAreaNameAvailable(String name, Long excludedAreaId) {
        if (areaMapper.countDuplicateName(name, excludedAreaId) > 0) {
            throw new BusinessException("AREA_NAME_ALREADY_EXISTS", "Area name already exists");
        }
    }

    private void ensureAreaCanUseStatus(Area area, String status) {
        if (AreaStatus.ACTIVE.equals(status)) {
            return;
        }
        if (seatSlotMapper.countBusySlotsByAreaId(area.getId()) > 0) {
            throw new BusinessException("AREA_HAS_ACTIVE_RESERVATION", "Area has active reservations");
        }
        if (seatMapper.countByAreaId(area.getId()) == 0) {
            return;
        }
    }
}
