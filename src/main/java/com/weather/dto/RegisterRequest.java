package com.weather.dto;

public class RegisterRequest {
    private String username;
    private String password;
    private String confirm;

    public String getUsername() { return username != null ? username.trim() : ""; }
    public void setUsername(String username) { this.username = username; }
    public String getPassword() { return password != null ? password.trim() : ""; }
    public void setPassword(String password) { this.password = password; }
    public String getConfirm() { return confirm != null ? confirm.trim() : ""; }
    public void setConfirm(String confirm) { this.confirm = confirm; }
}
