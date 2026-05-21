package com.lyston.smartseat.network;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

@Component
public class ClientIpResolver {

    private static final String[] FORWARDED_HEADERS = {
            "X-Forwarded-For",
            "X-Real-IP",
            "Proxy-Client-IP",
            "WL-Proxy-Client-IP"
    };

    private final IpRangeMatcher ipRangeMatcher;
    private final NetworkProperties networkProperties;

    public ClientIpResolver(IpRangeMatcher ipRangeMatcher, NetworkProperties networkProperties) {
        this.ipRangeMatcher = ipRangeMatcher;
        this.networkProperties = networkProperties;
    }

    public String resolve(HttpServletRequest request) {
        return resolveDetailed(request).clientIp();
    }

    public ResolvedClientIp resolveDetailed(HttpServletRequest request) {
        String remoteAddr = normalizeIp(request.getRemoteAddr());
        boolean trustedProxy = ipRangeMatcher.matches(remoteAddr, networkProperties.trustedProxyCidrList());
        String forwardedFor = firstUsableForwardedIp(request);
        if (trustedProxy && forwardedFor != null) {
            return new ResolvedClientIp(forwardedFor, remoteAddr, forwardedFor, true);
        }
        return new ResolvedClientIp(remoteAddr, remoteAddr, forwardedFor, trustedProxy);
    }

    private String firstUsableForwardedIp(HttpServletRequest request) {
        for (String header : FORWARDED_HEADERS) {
            String value = request.getHeader(header);
            String ip = firstUsableIp(value);
            if (ip != null) {
                return ip;
            }
        }
        return null;
    }

    private String firstUsableIp(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        for (String candidate : value.split(",")) {
            String ip = candidate.trim();
            if (!ip.isBlank() && !"unknown".equalsIgnoreCase(ip)) {
                return ip;
            }
        }
        return null;
    }

    private String normalizeIp(String value) {
        return value == null ? "" : value.trim();
    }
}
