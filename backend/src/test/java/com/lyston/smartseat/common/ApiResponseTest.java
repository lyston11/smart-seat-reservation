package com.lyston.smartseat.common;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class ApiResponseTest {

    @Test
    void okShouldWrapData() {
        ApiResponse<String> response = ApiResponse.ok("ready");

        assertThat(response.success()).isTrue();
        assertThat(response.code()).isEqualTo("OK");
        assertThat(response.data()).isEqualTo("ready");
    }
}
