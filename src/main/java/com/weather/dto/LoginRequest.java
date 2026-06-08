package com.weather.dto;

public class LoginRequest {
    private String username;
    private String password;

    public String getUsername() { return username != null ? username.trim() : ""; }
    public void setUsername(String username) { this.username = username; }
    public String getPassword() { return password != null ? password.trim() : ""; }
    public void setPassword(String password) { this.password = password; }
}
