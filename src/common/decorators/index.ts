import { SetMetadata } from '@nestjs/common';

/**
 * Key for marking a route as public.
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorator to mark a route as public, allowing access without authentication.
 *
 * @returns {MethodDecorator} The method decorator.
 */
export const Public = (): MethodDecorator => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * Key for marking a route as protected.
 */
export const IS_PROTECTED_KEY = 'isProtected';

/**
 * Decorator to mark a route as protected, requiring authentication.
 *
 * @returns {MethodDecorator} The method decorator.
 */
export const Protected = (): MethodDecorator =>
  SetMetadata(IS_PROTECTED_KEY, true);

/**
 * Decorator to associate a feature flag with a route.
 *
 * @param {string} flag - The feature flag to associate with the route.
 * @returns {MethodDecorator} The method decorator.
 */
export const FeatureFlag = (flag: string): MethodDecorator =>
  SetMetadata('flag', flag);
