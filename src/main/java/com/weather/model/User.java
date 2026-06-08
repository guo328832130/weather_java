package com.weather.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.security.SecureRandom;
import java.util.HexFormat;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 80)
    private String username;

    @Column(name = "password_hash", nullable = false, length = 200)
    private String passwordHash;

    @Column(unique = true, length = 64)
    private String token;

    @Column(name = "token_expires")
    private LocalDateTime tokenExpires;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    // ── Getters & Setters ────────────────────────────────

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public LocalDateTime getTokenExpires() { return tokenExpires; }
    public void setTokenExpires(LocalDateTime tokenExpires) { this.tokenExpires = tokenExpires; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    // ── 业务方法 ────────────────────────────────────────

    private static final SecureRandom RANDOM = new SecureRandom();

    /** 生成 64 位 hex token，有效期 24 小时 */
    public String generateToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        this.token = HexFormat.of().formatHex(bytes);
        this.tokenExpires = LocalDateTime.now().plusHours(24);
        return this.token;
    }

    /** Token 是否有效 */
    public boolean isTokenValid() {
        return token != null && tokenExpires != null
                && LocalDateTime.now().isBefore(tokenExpires);
    }

    @Override
    public String toString() {
        return "<User " + username + ">";
    }
}
