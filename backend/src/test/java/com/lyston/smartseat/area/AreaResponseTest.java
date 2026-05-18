package com.lyston.smartseat.area;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalTime;
import org.junit.jupiter.api.Test;

class AreaResponseTest {

    @Test
    void fromShouldUseDefaultOpenHoursForLegacyAreasWithoutStoredHours() {
        Area area = new Area();
        area.setId(1L);
        area.setName("Library Area A");
        area.setFloor("1F");
        area.setDescription("Demo public study area");
        area.setStatus(AreaStatus.ACTIVE);

        AreaResponse response = AreaResponse.from(area);

        assertThat(response.openTime()).isEqualTo(LocalTime.of(8, 0));
        assertThat(response.closeTime()).isEqualTo(LocalTime.of(22, 0));
    }
}
