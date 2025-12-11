import { NextResponse } from "next/server";

export enum ApiErrorCode {
  BAD_REQUEST = "BAD_REQUEST",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INTERNAL_ERROR = "INTERNAL_ERROR",
  RATE_LIMITED = "RATE_LIMITED",
}

const ERROR_STATUS_MAP: Record<ApiErrorCode, number> = {
  [ApiErrorCode.BAD_REQUEST]: 400,
  [ApiErrorCode.UNAUTHORIZED]: 401,
  [ApiErrorCode.FORBIDDEN]: 403,
  [ApiErrorCode.NOT_FOUND]: 404,
  [ApiErrorCode.CONFLICT]: 409,
  [ApiErrorCode.VALIDATION_ERROR]: 422,
  [ApiErrorCode.INTERNAL_ERROR]: 500,
  [ApiErrorCode.RATE_LIMITED]: 429,
};

interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

interface ApiListResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

interface ApiErrorResponse {
  success: false;
  error: {
    code: ApiErrorCode;
    message: string;
    details?: unknown;
  };
}

export function apiSuccess<T>(data: T, message?: string): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true as const,
      data,
      ...(message && { message }),
    },
    { status: 200 }
  );
}

export function apiCreated<T>(data: T, message?: string): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true as const,
      data,
      ...(message && { message }),
    },
    { status: 201 }
  );
}

export function apiListSuccess<T>(
  data: T[],
  pagination: { page: number; limit: number; total: number; hasMore: boolean }
): NextResponse<ApiListResponse<T>> {
  return NextResponse.json(
    {
      success: true as const,
      data,
      pagination,
    },
    { status: 200 }
  );
}

export function apiError(
  code: ApiErrorCode,
  message: string,
  details?: Record<string, unknown> | unknown[]
): NextResponse<ApiErrorResponse> {
  const errorObj: { code: ApiErrorCode; message: string; details?: unknown } = {
    code,
    message,
  };

  if (details !== undefined) {
    errorObj.details = details;
  }

  return NextResponse.json(
    {
      success: false as const,
      error: errorObj,
    },
    { status: ERROR_STATUS_MAP[code] }
  );
}

// Convenience error helpers
export const apiErrors = {
  badRequest: (message: string, details?: Record<string, unknown>) =>
    apiError(ApiErrorCode.BAD_REQUEST, message, details),

  unauthorized: (message = "Authentication required") =>
    apiError(ApiErrorCode.UNAUTHORIZED, message),

  forbidden: (message = "You do not have permission to perform this action") =>
    apiError(ApiErrorCode.FORBIDDEN, message),

  notFound: (resource = "Resource") => apiError(ApiErrorCode.NOT_FOUND, `${resource} not found`),

  conflict: (message: string) => apiError(ApiErrorCode.CONFLICT, message),

  validation: (message: string, details?: Record<string, unknown>) =>
    apiError(ApiErrorCode.VALIDATION_ERROR, message, details),

  internal: (message = "An unexpected error occurred") =>
    apiError(ApiErrorCode.INTERNAL_ERROR, message),

  rateLimited: (message = "Too many requests") => apiError(ApiErrorCode.RATE_LIMITED, message),
};
