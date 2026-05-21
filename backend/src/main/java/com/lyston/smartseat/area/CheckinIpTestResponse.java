package com.lyston.smartseat.area;

public record CheckinIpTestResponse(
        String clientIp,
        String remoteAddr,
        String forwardedFor,
        boolean trustedProxy,
        boolean matched,
        String checkinIpCidrs
) {
}
