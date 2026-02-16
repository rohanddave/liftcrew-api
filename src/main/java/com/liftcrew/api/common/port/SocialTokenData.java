package com.liftcrew.api.common.port;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SocialTokenData {
  private String uid;
  private String email;
  private String name;
  private String picture;
  private String provider;
}
