package com.lyston.smartseat.auth;

import com.lyston.smartseat.user.UserRole;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Arrays;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class AuthInterceptor implements HandlerInterceptor {

    private static final String AUTH_HEADER = "X-Auth-Token";

    private final AuthService authService;

    public AuthInterceptor(AuthService authService) {
        this.authService = authService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod()) || isPublicPath(request.getRequestURI())) {
            return true;
        }

        CurrentUser currentUser = authService.resolveToken(request.getHeader(AUTH_HEADER));
        AuthContext.setCurrentUser(currentUser);
        if (handler instanceof HandlerMethod handlerMethod) {
            requireRoleIfNecessary(handlerMethod, currentUser);
        }
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        AuthContext.clear();
    }

    private boolean isPublicPath(String uri) {
        return uri.equals("/api/auth/login")
                || uri.equals("/api/health")
                || uri.startsWith("/actuator")
                || uri.startsWith("/swagger-ui")
                || uri.startsWith("/v3/api-docs");
    }

    private void requireRoleIfNecessary(HandlerMethod handlerMethod, CurrentUser currentUser) {
        RequireRole requireRole = handlerMethod.getMethodAnnotation(RequireRole.class);
        if (requireRole == null) {
            requireRole = handlerMethod.getBeanType().getAnnotation(RequireRole.class);
        }
        if (requireRole == null) {
            return;
        }
        boolean allowed = Arrays.asList(requireRole.value()).contains(currentUser.role());
        if (!allowed) {
            throw new AuthException("AUTH_FORBIDDEN", "Current user is not allowed to access this resource", 403);
        }
        if (!UserRole.isAllowed(currentUser.role())) {
            throw new AuthException("AUTH_ROLE_INVALID", "Current user role is invalid", 403);
        }
    }
}
