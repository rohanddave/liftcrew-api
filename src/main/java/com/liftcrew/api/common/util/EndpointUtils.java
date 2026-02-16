package com.liftcrew.api.common.util;

import com.liftcrew.api.common.security.Protected;
import com.liftcrew.api.common.security.Public;

import java.lang.annotation.Annotation;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerExecutionChain;
import org.springframework.web.servlet.HandlerMapping;

@Component
public class EndpointUtils {
  private final HandlerMapping handlerMapping;

  public EndpointUtils(@Qualifier("requestMappingHandlerMapping") HandlerMapping handlerMapping) {
    this.handlerMapping = handlerMapping;
  }

  public boolean isPublic(HttpServletRequest request) {
    return hasAnnotation(request, Public.class);
  }

  public boolean isProtected(HttpServletRequest request) {
    return hasAnnotation(request, Protected.class);
  }

  private boolean hasAnnotation(HttpServletRequest request, Class<? extends Annotation> annotation) {
    try {
      HandlerExecutionChain chain = handlerMapping.getHandler(request);
      if (chain == null) return false;

      Object handler = chain.getHandler();
      if (handler instanceof HandlerMethod method) {
        return method.hasMethodAnnotation(annotation)
                || method.getBeanType().isAnnotationPresent(annotation);
      }
    } catch (Exception e) {
      // endpoint not mapped — treat as not annotated
    }
    return false;
  }
}