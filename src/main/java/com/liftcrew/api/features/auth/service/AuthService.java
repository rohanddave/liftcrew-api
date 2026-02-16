package com.liftcrew.api.features.auth.service;

import com.liftcrew.api.features.auth.dto.JwtUser;
import com.liftcrew.api.features.auth.dto.response.LoginResponseDto;
import com.liftcrew.api.features.auth.dto.response.LogoutResponseDto;

public interface AuthService {
  LoginResponseDto login(JwtUser user);

  LogoutResponseDto logout(JwtUser user);
}
