package com.liftcrew.api.common.util;

import com.liftcrew.api.common.RequestAttributes;
import com.liftcrew.api.common.exception.UnauthorizedException;
import com.liftcrew.api.features.auth.dto.JwtUser;

import jakarta.servlet.http.HttpServletRequest;

public final class JwtUserExtractorUtil {

  private JwtUserExtractorUtil() {}

  public static JwtUser getJwtUser(HttpServletRequest request) {
    JwtUser user = (JwtUser) request.getAttribute(RequestAttributes.JWT_USER);
    if (user == null) {
      throw new UnauthorizedException("Authentication required");
    }
    return user;
  }
}