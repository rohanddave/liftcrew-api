package com.liftcrew.api.features.auth.controller;

import com.liftcrew.api.common.exception.UnauthorizedException;
import com.liftcrew.api.common.security.Protected;
import com.liftcrew.api.common.security.Public;
import com.liftcrew.api.common.util.BearerTokenExtractorUtil;
import com.liftcrew.api.common.util.JwtUserExtractorUtil;
import com.liftcrew.api.features.auth.dto.JwtUser;
import com.liftcrew.api.features.auth.dto.response.ExchangeTokenResponseDto;
import com.liftcrew.api.features.auth.dto.response.LoginResponseDto;
import com.liftcrew.api.features.auth.dto.response.LogoutResponseDto;
import com.liftcrew.api.features.auth.service.AuthService;
import com.liftcrew.api.features.auth.service.TokenService;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.AllArgsConstructor;

@RestController
@AllArgsConstructor
@RequestMapping("/auth")
public class AuthController {
  private final TokenService tokenService;
  private final AuthService authService;

  @PostMapping("/exchange")
  @Protected
  public ResponseEntity<ExchangeTokenResponseDto> exchange(HttpServletRequest request) {
    String firebaseToken = BearerTokenExtractorUtil.extractBearerToken(request)
        .orElseThrow(() -> new UnauthorizedException("Missing bearer token"));

    return ResponseEntity.ok(tokenService.exchangeToken(firebaseToken));
  }

  @PostMapping("/refresh")
  @Protected
  public ResponseEntity<ExchangeTokenResponseDto> refresh(HttpServletRequest request) {
    String refreshToken = BearerTokenExtractorUtil.extractBearerToken(request)
        .orElseThrow(() -> new UnauthorizedException("Missing bearer token"));

    return ResponseEntity.ok(tokenService.refreshToken(refreshToken));
  }

  @PostMapping("/login")
  public ResponseEntity<LoginResponseDto> login(HttpServletRequest request) {
    JwtUser user = JwtUserExtractorUtil.getJwtUser(request);
    return ResponseEntity.ok(authService.login(user));
  }

  @PostMapping("/logout")
  public ResponseEntity<LogoutResponseDto> logout(HttpServletRequest request) {
    JwtUser user = JwtUserExtractorUtil.getJwtUser(request);
    return ResponseEntity.ok(authService.logout(user));
  }
}