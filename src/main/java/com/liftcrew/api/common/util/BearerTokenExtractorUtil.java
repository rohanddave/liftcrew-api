package com.liftcrew.api.common.util;

import java.util.Optional;

import jakarta.servlet.http.HttpServletRequest;

public final class BearerTokenExtractorUtil {
  private static final String AUTHORIZATION_HEADER = "Authorization";
  private static final String BEARER_PREFIX = "Bearer ";

  private BearerTokenExtractorUtil() {}

  public static Optional<String> extractBearerToken(HttpServletRequest request) {
    String authHeader = request.getHeader(AUTHORIZATION_HEADER);

    if (authHeader != null && authHeader.startsWith(BEARER_PREFIX)) {
      return Optional.of(authHeader.substring(BEARER_PREFIX.length()));
    }

    return Optional.empty();
  }
}
