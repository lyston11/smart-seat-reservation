package com.lyston.smartseat.network;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

class ClientIpResolverTest {

    @Test
    void resolveShouldTrustForwardedForOnlyFromTrustedProxy() {
        NetworkProperties properties = new NetworkProperties();
        properties.setTrustedProxyCidrs(java.util.List.of("10.0.0.0/8"));
        ClientIpResolver resolver = new ClientIpResolver(new IpRangeMatcher(), properties);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("10.1.1.10");
        request.addHeader("X-Forwarded-For", "172.16.20.5, 10.1.1.10");

        ResolvedClientIp result = resolver.resolveDetailed(request);

        assertThat(result.clientIp()).isEqualTo("172.16.20.5");
        assertThat(result.remoteAddr()).isEqualTo("10.1.1.10");
        assertThat(result.forwardedFor()).isEqualTo("172.16.20.5");
        assertThat(result.trustedProxy()).isTrue();
    }

    @Test
    void resolveShouldIgnoreForwardedForFromUntrustedClient() {
        NetworkProperties properties = new NetworkProperties();
        properties.setTrustedProxyCidrs(java.util.List.of("10.0.0.0/8"));
        ClientIpResolver resolver = new ClientIpResolver(new IpRangeMatcher(), properties);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("203.0.113.8");
        request.addHeader("X-Forwarded-For", "172.16.20.5");

        ResolvedClientIp result = resolver.resolveDetailed(request);

        assertThat(result.clientIp()).isEqualTo("203.0.113.8");
        assertThat(result.forwardedFor()).isEqualTo("172.16.20.5");
        assertThat(result.trustedProxy()).isFalse();
    }
}
