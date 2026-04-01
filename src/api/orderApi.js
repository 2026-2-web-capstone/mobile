import apiClient from "./client";

/**
 * 주문 API
 *
 * 백엔드 PaymentMethod enum: CREDIT_CARD, BANK_TRANSFER 등
 * 장바구니 기반 주문과 바로 구매(direct) 두 가지 방식 제공
 */

export const orderApi = {
  // 장바구니 기반 주문
  createOrder: (paymentMethod = "CREDIT_CARD") =>
    apiClient.post("/api/v1/orders", { paymentMethod }),

  // 바로 구매
  createOrderDirect: (bookId, quantity, paymentMethod = "CREDIT_CARD") =>
    apiClient.post("/api/v1/orders/direct", {
      bookId,
      quantity,
      paymentMethod,
    }),

  getOrder: (orderId) => apiClient.get(`/api/v1/orders/${orderId}`),

  cancelOrder: (orderId) => apiClient.post(`/api/v1/orders/${orderId}/cancel`),

  refundOrder: (orderId) => apiClient.post(`/api/v1/orders/${orderId}/refund`),
};
