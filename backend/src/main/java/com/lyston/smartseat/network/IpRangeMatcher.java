package com.lyston.smartseat.network;

import com.lyston.smartseat.common.BusinessException;
import java.net.InetAddress;
import java.net.UnknownHostException;
import org.springframework.stereotype.Component;

@Component
public class IpRangeMatcher {

    public boolean matches(String ip, String cidrList) {
        if (ip == null || ip.isBlank() || cidrList == null || cidrList.isBlank()) {
            return false;
        }
        for (String range : cidrList.split(",")) {
            String cidr = range.trim();
            if (!cidr.isBlank() && matchesCidr(ip.trim(), cidr)) {
                return true;
            }
        }
        return false;
    }

    public void validateCidrList(String cidrList) {
        if (cidrList == null || cidrList.isBlank()) {
            throw new BusinessException("INVALID_CHECKIN_IP_CIDR", "Area check-in IP range is invalid");
        }
        for (String range : cidrList.split(",")) {
            String cidr = range.trim();
            if (!cidr.isBlank()) {
                validateCidr(cidr);
            }
        }
    }

    private void validateCidr(String cidr) {
        String[] parts = cidr.split("/", -1);
        if (parts.length != 2) {
            throw new BusinessException("INVALID_CHECKIN_IP_CIDR", "Area check-in IP range is invalid");
        }
        byte[] networkBytes = toAddress(parts[0]);
        parsePrefixLength(parts[1], networkBytes.length * 8);
    }

    private boolean matchesCidr(String ip, String cidr) {
        String[] parts = cidr.split("/", -1);
        if (parts.length != 2) {
            throw new BusinessException("INVALID_CHECKIN_IP_CIDR", "Area check-in IP range is invalid");
        }

        byte[] addressBytes = toAddress(ip);
        byte[] networkBytes = toAddress(parts[0]);
        if (addressBytes.length != networkBytes.length) {
            return false;
        }

        int prefixLength = parsePrefixLength(parts[1], addressBytes.length * 8);
        int fullBytes = prefixLength / 8;
        int remainingBits = prefixLength % 8;

        for (int index = 0; index < fullBytes; index++) {
            if (addressBytes[index] != networkBytes[index]) {
                return false;
            }
        }
        if (remainingBits == 0) {
            return true;
        }
        int mask = 0xFF << (8 - remainingBits);
        return (addressBytes[fullBytes] & mask) == (networkBytes[fullBytes] & mask);
    }

    private byte[] toAddress(String value) {
        try {
            return InetAddress.getByName(value).getAddress();
        } catch (UnknownHostException exception) {
            throw new BusinessException("INVALID_CHECKIN_IP", "Check-in IP address is invalid");
        }
    }

    private int parsePrefixLength(String value, int maxPrefixLength) {
        try {
            int prefixLength = Integer.parseInt(value);
            if (prefixLength < 0 || prefixLength > maxPrefixLength) {
                throw new BusinessException("INVALID_CHECKIN_IP_CIDR", "Area check-in IP range is invalid");
            }
            return prefixLength;
        } catch (NumberFormatException exception) {
            throw new BusinessException("INVALID_CHECKIN_IP_CIDR", "Area check-in IP range is invalid");
        }
    }
}
