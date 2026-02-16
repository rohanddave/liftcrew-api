package com.liftcrew.api.common.port;

public interface SocialTokenVerifier {
  SocialTokenData verifyToken(String token);
}