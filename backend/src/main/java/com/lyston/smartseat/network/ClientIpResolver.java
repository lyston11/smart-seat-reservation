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

    public String resolve(HttpServletRequest request) {
        for (String header : FORWARDED_HEADERS) {
            String value = request.getHeader(header);
            String ip = firstUsableIp(value);
            if (ip != null) {
                return ip;
            }
        }
        return request.getRemoteAddr();
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
}
