package com.liftcrew.api.features.auth.service;

import com.liftcrew.api.features.auth.dto.JwtUser;
import com.liftcrew.api.features.auth.dto.response.ExchangeTokenResponseDto;

public interface TokenService {
  ExchangeTokenResponseDto exchangeToken(String firebaseToken);

  ExchangeTokenResponseDto refreshToken(String refreshToken);

  JwtUser verifyAccessToken(String token);
}