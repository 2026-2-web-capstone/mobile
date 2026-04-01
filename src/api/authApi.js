import apiClient from "./client";

/**
 * 인증 / 회원 API
 *
 * 백엔드 DTO 매핑:
 *  - signup: UserSignupRequest → UserResponse
 *  - signin: UserSigninRequest → UserSigninResponse { accessToken, refreshToken, user }
 *  - getMe:  → UserResponse { id, email, username, name, phone, role, status }
 */

export const authApi = {
  signup: ({ email, username, password, name, phone }) =>
    apiClient.post("/api/v1/users/signup", {
      email,
      username,
      password,
      name,
      phone,
    }),

  signin: ({ email, password }) =>
    apiClient.post("/api/v1/users/signin", { email, password }),

  signout: (refreshToken) =>
    apiClient.post("/api/v1/users/signout", { refreshToken }),

  getMe: () => apiClient.get("/api/v1/users/me"),

  updateMe: ({ name, phone }) =>
    apiClient.patch("/api/v1/users/me", { name, phone }),

  deleteMe: () => apiClient.delete("/api/v1/users/me"),

  getMyOrders: (page = 0, size = 20) =>
    apiClient.get("/api/v1/users/me/orders", { params: { page, size } }),

  getMyPurchases: (page = 0, size = 20) =>
    apiClient.get("/api/v1/users/me/purchases", { params: { page, size } }),

  getMyRefunds: (page = 0, size = 20) =>
    apiClient.get("/api/v1/users/me/refunds", { params: { page, size } }),

  getMyReviews: (page = 0, size = 20) =>
    apiClient.get("/api/v1/users/me/reviews", { params: { page, size } }),
};
