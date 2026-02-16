package com.liftcrew.api.features.auth.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class ExchangeTokenResponseDto {
  private String accessToken;
  private String refreshToken;
}