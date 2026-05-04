package com.burak.belediyeapp.dto.response.auth;

import java.util.Set;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        String userId,
        String email,
        String fullName,
        Set<String> roles,
        String district
) {
    public static AuthResponse of(String accessToken, String refreshToken,
                                   String userId, String email,
                                   String fullName, Set<String> roles,
                                   String district) {
        return new AuthResponse(accessToken, refreshToken, "Bearer",
                userId, email, fullName, roles, district);
    }
}
