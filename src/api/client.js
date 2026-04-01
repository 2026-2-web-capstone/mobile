import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL, API_TIMEOUT } from "./config";

/**
 * axios 인스턴스 — JWT 자동 주입 & ApiResponse 래퍼 자동 파싱
 *
 * 백엔드 응답 형태: { success: boolean, data: T, error: { code, message } }
 * 인터셉터가 data 필드만 꺼내 반환하므로 호출부에서 래퍼를 신경 쓸 필요 없음.
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

// ── 요청 인터셉터: Authorization 헤더 자동 추가 ──
apiClient.interceptors.request.use(
  async (requestConfig) => {
    const token = await AsyncStorage.getItem("accessToken");
    if (token) {
      requestConfig.headers.Authorization = `Bearer ${token}`;
    }
    return requestConfig;
  },
  (error) => Promise.reject(error),
);

// ── 응답 인터셉터: ApiResponse 래퍼 파싱 & 에러 정규화 ──
apiClient.interceptors.response.use(
  (response) => {
    const body = response.data;
    // 백엔드 ApiResponse 래퍼 처리
    if (body && typeof body.success === "boolean") {
      if (body.success) {
        return body.data;
      }
      // 비즈니스 에러
      const apiError = new Error(body.error?.message || "요청 실패");
      apiError.code = body.error?.code || "UNKNOWN";
      return Promise.reject(apiError);
    }
    // 래퍼 없는 응답은 그대로 반환
    return body;
  },
  (error) => {
    if (error.response) {
      // 서버가 에러 응답을 보낸 경우
      const body = error.response.data;
      const apiError = new Error(
        body?.error?.message || `서버 오류 (${error.response.status})`,
      );
      apiError.code = body?.error?.code || `HTTP_${error.response.status}`;
      apiError.status = error.response.status;
      return Promise.reject(apiError);
    }
    // 네트워크 에러 등
    const networkError = new Error("네트워크 연결을 확인해주세요.");
    networkError.code = "NETWORK_ERROR";
    return Promise.reject(networkError);
  },
);

export default apiClient;
