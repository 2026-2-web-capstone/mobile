import apiClient from "./client";

/**
 * 장바구니 API
 *
 * 백엔드 응답 DTO:
 *  - CartResponse:     { cartId, items: CartItemResponse[] }
 *  - CartItemResponse: { id, bookId, title, price, quantity }
 */

export const cartApi = {
  getCart: () => apiClient.get("/api/v1/cart"),

  addCartItem: (bookId, quantity = 1) =>
    apiClient.post("/api/v1/cart/items", { bookId, quantity }),

  removeCartItem: (cartItemId) =>
    apiClient.delete(`/api/v1/cart/items/${cartItemId}`),
};
