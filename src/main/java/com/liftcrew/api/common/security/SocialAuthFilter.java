package com.liftcrew.api.common.security;

import com.liftcrew.api.common.RequestAttributes;
import com.liftcrew.api.common.exception.UnauthorizedException;
import com.liftcrew.api.common.port.SocialTokenVerifier;
import com.liftcrew.api.common.util.BearerTokenExtractorUtil;
import com.liftcrew.api.common.port.SocialTokenData;
import com.liftcrew.api.common.util.EndpointUtils;

import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@AllArgsConstructor
@Slf4j
public class SocialAuthFilter extends OncePerRequestFilter {
  private final SocialTokenVerifier tokenVerifier;
  private final EndpointUtils endpointUtils;

  @Override
  protected void doFilterInternal(
          HttpServletRequest request,
          HttpServletResponse response,
          FilterChain filterChain) throws ServletException, IOException {

    if (!endpointUtils.isProtected(request)) {
      filterChain.doFilter(request, response);
      return;
    }

    Optional<String> token = BearerTokenExtractorUtil.extractBearerToken(request);

    if (token.isEmpty()) {
      response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Firebase token required");
      return;
    }

    try {
      SocialTokenData firebaseData = tokenVerifier.verifyToken(token.get());
      request.setAttribute(RequestAttributes.SOCIAL_TOKEN, token.get());
      request.setAttribute(RequestAttributes.SOCIAL_EMAIL, firebaseData.getEmail());
    } catch (UnauthorizedException e) {
      log.error("Invalid Firebase token: {}", e.getMessage());
      response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid or expired Firebase token");
      return;
    }

    filterChain.doFilter(request, response);
  }
}
