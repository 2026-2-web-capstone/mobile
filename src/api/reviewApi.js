import apiClient from "./client";

/**
 * 리뷰 API
 *
 * 백엔드 응답 DTO:
 *  - ReviewResponse: { id, bookId, userId, rating, content, createdAt }
 */

export const reviewApi = {
  getReviews: (bookId, page = 0, size = 20) =>
    apiClient.get(`/api/v1/books/${bookId}/reviews`, {
      params: { page, size },
    }),

  createReview: (bookId, { rating, content }) =>
    apiClient.post(`/api/v1/books/${bookId}/reviews`, { rating, content }),

  updateReview: (reviewId, { rating, content }) =>
    apiClient.patch(`/api/v1/reviews/${reviewId}`, { rating, content }),

  deleteReview: (reviewId) => apiClient.delete(`/api/v1/reviews/${reviewId}`),
};
