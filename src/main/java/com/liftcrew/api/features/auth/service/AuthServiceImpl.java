package com.liftcrew.api.features.auth.service;

import com.liftcrew.api.features.auth.dto.JwtUser;
import com.liftcrew.api.features.auth.dto.response.LoginResponseDto;
import com.liftcrew.api.features.auth.dto.response.LogoutResponseDto;

import org.springframework.stereotype.Service;

@Service
public class AuthServiceImpl implements AuthService {
  @Override
  public LoginResponseDto login(JwtUser user) {
    // TODO: check if user exists in DB, create if not
    return new LoginResponseDto(false);
  }

  @Override
  public LogoutResponseDto logout(JwtUser user) {
    // TODO: invalidate tokens / session
    return new LogoutResponseDto(true);
  }
}
