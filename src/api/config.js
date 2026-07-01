/**
 * API 설정 파일
 *
 * USE_MOCK_DATA 기본값을 true로 두면 로컬 mock 데이터 사용,
 * false로 두면 백엔드 API 서버와 실제 통신합니다.
 *
 * EAS 배포 빌드에서는 EXPO_PUBLIC_USE_MOCK_DATA 값이 있으면
 * 기본값보다 우선 적용됩니다.
 */

// ──────────────────────────────────────────────
// ★ mock 데이터 / 실제 API 전환 스위치
// ──────────────────────────────────────────────
const DEFAULT_USE_MOCK_DATA = true;
const ENV_USE_MOCK_DATA = process.env.EXPO_PUBLIC_USE_MOCK_DATA;

// 백엔드 서버 URL (.env 파일의 EXPO_PUBLIC_API_BASE_URL 사용)
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

export const USE_MOCK_DATA =
  !API_BASE_URL ||
  (ENV_USE_MOCK_DATA == null
    ? DEFAULT_USE_MOCK_DATA
    : ENV_USE_MOCK_DATA === "true");

export const ALLOW_OFFLINE_FALLBACK =
  process.env.EXPO_PUBLIC_ALLOW_OFFLINE_FALLBACK !== "false";

// 요청 타임아웃 (ms)
export const API_TIMEOUT = 10000;
