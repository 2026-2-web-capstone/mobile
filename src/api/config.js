/**
 * API 설정 파일
 *
 * USE_MOCK_DATA를 true로 설정하면 로컬 mock 데이터 사용,
 * false로 설정하면 백엔드 API 서버와 실제 통신합니다.
 *
 * 이 한 줄만 변경하면 mock ↔ API 전환이 가능합니다.
 */

// ──────────────────────────────────────────────
// ★ mock 데이터 / 실제 API 전환 스위치
// ──────────────────────────────────────────────
export const USE_MOCK_DATA = false;

// 백엔드 서버 URL (.env 파일의 EXPO_PUBLIC_API_BASE_URL 사용)
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

// 요청 타임아웃 (ms)
export const API_TIMEOUT = 10000;
