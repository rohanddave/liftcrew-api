package com.liftcrew.api.features.auth.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class LogoutResponseDto {
  private final boolean success;
}
