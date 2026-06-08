package com.weather.dto;

/**
 * 统一 API 响应格式
 * { "code": 200, "data": {...}, "message": "ok" }
 */
public class ApiResponse {
    private int code;
    private Object data;
    private String message;

    private ApiResponse(int code, Object data, String message) {
        this.code = code;
        this.data = data;
        this.message = message;
    }

    public static ApiResponse ok(Object data, String message) {
        return new ApiResponse(200, data, message);
    }

    public static ApiResponse ok(Object data) {
        return new ApiResponse(200, data, "ok");
    }

    public static ApiResponse fail(String message, int code) {
        return new ApiResponse(code, null, message);
    }

    public static ApiResponse fail(String message) {
        return new ApiResponse(400, null, message);
    }

    // Getters
    public int getCode() { return code; }
    public Object getData() { return data; }
    public String getMessage() { return message; }
}
