package com.lyston.smartseat.network;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.lyston.smartseat.common.BusinessException;
import org.junit.jupiter.api.Test;

class IpRangeMatcherTest {

    private final IpRangeMatcher matcher = new IpRangeMatcher();

    @Test
    void matchesShouldSupportIpv4AndIpv6CidrList() {
        assertThat(matcher.matches("10.10.1.20", "10.10.0.0/16,::1/128")).isTrue();
        assertThat(matcher.matches("::1", "10.10.0.0/16,::1/128")).isTrue();
        assertThat(matcher.matches("10.20.1.20", "10.10.0.0/16,::1/128")).isFalse();
    }

    @Test
    void validateCidrListShouldRejectInvalidCidr() {
        assertThatThrownBy(() -> matcher.validateCidrList("10.10.0.0,172.16.0.0/16"))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Area check-in IP range is invalid");
    }
}
