package com.weather.interceptor;

import com.weather.model.User;
import com.weather.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Optional;

/**
 * Token 鉴权拦截器
 * 从 Authorization header 中提取 Bearer token 并验证
 */
@Component
public class AuthInterceptor implements HandlerInterceptor {

    private final UserRepository userRepository;

    public AuthInterceptor(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public boolean preHandle(HttpServletRequest request,
                             HttpServletResponse response,
                             Object handler) throws Exception {

        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            sendUnauthorized(response, "未登录");
            return false;
        }

        String token = authHeader.substring(7);
        Optional<User> userOpt = userRepository.findByToken(token);
        if (userOpt.isEmpty() || !userOpt.get().isTokenValid()) {
            sendUnauthorized(response, "登录已过期，请重新登录");
            return false;
        }

        // 将用户信息存入 request attribute，Controller 可通过 request.getAttribute("user") 获取
        request.setAttribute("user", userOpt.get());
        return true;
    }

    private void sendUnauthorized(HttpServletResponse response, String message) throws Exception {
        response.setStatus(401);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write(
                "{\"code\":401,\"data\":null,\"message\":\"" + message + "\"}"
        );
    }
}
