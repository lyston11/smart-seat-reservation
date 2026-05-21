package com.lyston.smartseat.network;

public record ResolvedClientIp(
        String clientIp,
        String remoteAddr,
        String forwardedFor,
        boolean trustedProxy
) {
}
