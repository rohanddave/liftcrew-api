package com.liftcrew.api.features.auth.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class JwtUser {
  private String uid;
  private String email;
}