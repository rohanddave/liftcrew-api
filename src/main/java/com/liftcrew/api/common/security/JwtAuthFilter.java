package com.liftcrew.api.common.security;

import com.liftcrew.api.common.exception.UnauthorizedException;
import com.liftcrew.api.common.util.BearerTokenExtractorUtil;
import com.liftcrew.api.common.util.EndpointUtils;
import com.liftcrew.api.common.RequestAttributes;
import com.liftcrew.api.features.auth.dto.JwtUser;
import com.liftcrew.api.features.auth.service.TokenService;

import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {
  private final TokenService tokenService;
  private final EndpointUtils endpointUtils;

  @Override
  protected void doFilterInternal(
      HttpServletRequest request,
      HttpServletResponse response,
      FilterChain filterChain) throws ServletException, IOException {

    if (endpointUtils.isPublic(request) || endpointUtils.isProtected(request)) {
      filterChain.doFilter(request, response);
      return;
    }

    Optional<String> token = BearerTokenExtractorUtil.extractBearerToken(request);

    if (token.isEmpty()) {
      response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Missing bearer token");
      return;
    }

    try {
      JwtUser jwtUser = tokenService.verifyAccessToken(token.get());
      request.setAttribute(RequestAttributes.JWT_USER, jwtUser);
    } catch (UnauthorizedException e) {
      log.error("Invalid JWT: {}", e.getMessage());
      response.sendError(HttpServletResponse.SC_UNAUTHORIZED, e.getMessage());
      return;
    }

    filterChain.doFilter(request, response);
  }
}