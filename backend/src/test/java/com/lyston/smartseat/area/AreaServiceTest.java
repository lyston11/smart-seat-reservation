package com.lyston.smartseat.area;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.lyston.smartseat.audit.AuditAction;
import com.lyston.smartseat.audit.AuditService;
import com.lyston.smartseat.common.BusinessException;
import com.lyston.smartseat.network.IpRangeMatcher;
import com.lyston.smartseat.seat.SeatMapper;
import com.lyston.smartseat.seat.SeatSlotMapper;
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Proxy;
import java.time.LocalDateTime;
import java.time.LocalTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class AreaServiceTest {

    private AreaMapperFake areaMapper;
    private AuditServiceFake auditService;
    private AreaService areaService;

    @BeforeEach
    void setUp() {
        areaMapper = new AreaMapperFake();
        auditService = new AuditServiceFake();
        areaService = new AreaService(
                areaMapper.proxy(),
                proxy(SeatMapper.class, (unused, method, args) -> defaultValue(method.getReturnType())),
                proxy(SeatSlotMapper.class, (unused, method, args) -> defaultValue(method.getReturnType())),
                auditService,
                new IpRangeMatcher()
        );
    }

    @Test
    void createAreaShouldNormalizeMapMetadataAndFallbackFloorCode() {
        AreaResponse response = areaService.createArea(
                new CreateAreaRequest(
                        " A-B Study ",
                        " 3F ",
                        " Connector seats ",
                        LocalTime.of(8, 30),
                        LocalTime.of(21, 0),
                        "10.10.0.0/16",
                        " connector ",
                        null,
                        " corridor ",
                        42,
                        8
                ),
                2L
        );

        assertThat(response.id()).isEqualTo(10L);
        assertThat(response.name()).isEqualTo("A-B Study");
        assertThat(response.floor()).isEqualTo("3F");
        assertThat(response.buildingCode()).isEqualTo("CONNECTOR");
        assertThat(response.floorCode()).isEqualTo("3F");
        assertThat(response.areaType()).isEqualTo("CORRIDOR");
        assertThat(response.mapX()).isEqualTo(42);
        assertThat(response.mapY()).isEqualTo(8);
        assertThat(areaMapper.insertedArea.getBuildingCode()).isEqualTo("CONNECTOR");
        assertThat(areaMapper.insertedArea.getFloorCode()).isEqualTo("3F");
        assertThat(areaMapper.insertedArea.getAreaType()).isEqualTo("CORRIDOR");
        assertThat(areaMapper.insertedArea.getMapX()).isEqualTo(42);
        assertThat(areaMapper.insertedArea.getMapY()).isEqualTo(8);
        assertThat(auditService.action).isEqualTo(AuditAction.AREA_CREATE);
    }

    @Test
    void updateAreaShouldNormalizeExplicitMapMetadata() {
        areaMapper.area = existingArea();

        AreaResponse response = areaService.updateArea(
                10L,
                new UpdateAreaRequest(
                        " B Hall ",
                        " 2F ",
                        " South public hall ",
                        " active ",
                        LocalTime.of(8, 0),
                        LocalTime.of(22, 0),
                        "127.0.0.1/32",
                        " b ",
                        " B2 ",
                        " hall ",
                        75,
                        35
                ),
                2L
        );

        assertThat(response.buildingCode()).isEqualTo("B");
        assertThat(response.floorCode()).isEqualTo("B2");
        assertThat(response.areaType()).isEqualTo("HALL");
        assertThat(response.mapX()).isEqualTo(75);
        assertThat(response.mapY()).isEqualTo(35);
        assertThat(areaMapper.updatedArea.getBuildingCode()).isEqualTo("B");
        assertThat(areaMapper.updatedArea.getFloorCode()).isEqualTo("B2");
        assertThat(areaMapper.updatedArea.getAreaType()).isEqualTo("HALL");
        assertThat(auditService.action).isEqualTo(AuditAction.AREA_UPDATE);
    }

    @Test
    void createAreaShouldRejectInvalidBuildingCode() {
        assertThatThrownBy(() -> areaService.createArea(
                new CreateAreaRequest(
                        "Area",
                        "1F",
                        null,
                        null,
                        null,
                        null,
                        "C",
                        "1F",
                        "STUDY_ROOM",
                        null,
                        null
                ),
                2L
        ))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Area building code is invalid")
                .extracting("code")
                .isEqualTo("INVALID_AREA_BUILDING_CODE");
    }

    @Test
    void createAreaShouldRejectInvalidAreaType() {
        assertThatThrownBy(() -> areaService.createArea(
                new CreateAreaRequest(
                        "Area",
                        "1F",
                        null,
                        null,
                        null,
                        null,
                        "A",
                        "1F",
                        "LAB",
                        null,
                        null
                ),
                2L
        ))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Area type is invalid")
                .extracting("code")
                .isEqualTo("INVALID_AREA_TYPE");
    }

    @Test
    void createAreaShouldRejectMapCoordinateOutsidePercentRange() {
        assertThatThrownBy(() -> areaService.createArea(
                new CreateAreaRequest(
                        "Area",
                        "1F",
                        null,
                        null,
                        null,
                        null,
                        "A",
                        "1F",
                        "STUDY_ROOM",
                        101,
                        50
                ),
                2L
        ))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Area map coordinate must be between 0 and 100")
                .extracting("code")
                .isEqualTo("INVALID_AREA_MAP_COORDINATE");
    }

    private Area existingArea() {
        Area area = new Area();
        area.setId(10L);
        area.setName("Old Area");
        area.setFloor("1F");
        area.setStatus(AreaStatus.ACTIVE);
        area.setOpenTime(LocalTime.of(8, 0));
        area.setCloseTime(LocalTime.of(22, 0));
        area.setCheckinIpCidrs("127.0.0.1/32");
        area.setCreatedAt(LocalDateTime.of(2026, 5, 22, 8, 0));
        area.setUpdatedAt(LocalDateTime.of(2026, 5, 22, 8, 0));
        return area;
    }

    private static final class AreaMapperFake {
        private Area area;
        private Area insertedArea;
        private Area updatedArea;

        AreaMapper proxy() {
            return AreaServiceTest.proxy(AreaMapper.class, (unused, method, args) -> switch (method.getName()) {
                case "insert" -> {
                    insertedArea = (Area) args[0];
                    insertedArea.setId(10L);
                    yield 1;
                }
                case "selectById" -> area;
                case "updateById" -> {
                    updatedArea = (Area) args[0];
                    area = updatedArea;
                    yield 1;
                }
                case "countDuplicateName" -> 0;
                default -> defaultValue(method.getReturnType());
            });
        }
    }

    private static final class AuditServiceFake extends AuditService {
        private String action;

        AuditServiceFake() {
            super(null);
        }

        @Override
        public void record(Long actorUserId, String action, String targetType, Long targetId, String reason) {
            this.action = action;
        }
    }

    @SuppressWarnings("unchecked")
    private static <T> T proxy(Class<T> type, InvocationHandler handler) {
        return (T) Proxy.newProxyInstance(type.getClassLoader(), new Class<?>[] {type}, handler);
    }

    private static Object defaultValue(Class<?> returnType) {
        if (returnType.equals(int.class)) {
            return 0;
        }
        if (returnType.equals(boolean.class)) {
            return false;
        }
        return null;
    }
}
