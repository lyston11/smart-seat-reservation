package com.lyston.smartseat.network;

import java.util.ArrayList;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "smart-seat.network")
public class NetworkProperties {

    private List<String> trustedProxyCidrs = new ArrayList<>(List.of("127.0.0.1/32", "::1/128"));

    public List<String> getTrustedProxyCidrs() {
        return trustedProxyCidrs;
    }

    public void setTrustedProxyCidrs(List<String> trustedProxyCidrs) {
        this.trustedProxyCidrs = trustedProxyCidrs == null ? new ArrayList<>() : new ArrayList<>(trustedProxyCidrs);
    }

    public String trustedProxyCidrList() {
        return String.join(",", trustedProxyCidrs);
    }
}
