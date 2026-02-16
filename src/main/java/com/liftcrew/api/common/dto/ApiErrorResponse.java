package com.liftcrew.api.common.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;
import java.util.Map;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ApiErrorResponse {
  private int status;
  private String error;
  private String message;
  private LocalDateTime timestamp;
  private String path;

  @JsonInclude(JsonInclude.Include.NON_NULL)
  private Map<String, String> validationErrors;
}
