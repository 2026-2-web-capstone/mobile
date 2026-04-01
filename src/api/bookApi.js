import apiClient from "./client";

/**
 * 도서 / 카테고리 API
 *
 * 백엔드 응답 DTO:
 *  - BookSummaryResponse: { id, title, author, price, thumbnailUrl, ratingAvg, reviewCount }
 *  - BookDetailResponse:  { id, title, author, publisher, description, price, stock, categoryName, images, ratingAvg, reviewCount }
 *  - HomeResponse:        { newBooks, popularBooks }
 *  - CategoryResponse:    { id, name, parentId, depth, sortOrder }
 */

export const bookApi = {
  getHome: () => apiClient.get("/api/v1/home"),

  getBooks: (page = 0, size = 20) =>
    apiClient.get("/api/v1/books", { params: { page, size } }),

  getNewBooks: (page = 0, size = 20) =>
    apiClient.get("/api/v1/books/new", { params: { page, size } }),

  getPopularBooks: () => apiClient.get("/api/v1/books/popular"),

  getCategories: () => apiClient.get("/api/v1/categories"),

  getBooksByCategory: (categoryId, page = 0, size = 20) =>
    apiClient.get(`/api/v1/categories/${categoryId}/books`, {
      params: { page, size },
    }),

  searchBooks: (keyword, page = 0, size = 20) =>
    apiClient.get("/api/v1/books/search", {
      params: { keyword, page, size },
    }),

  getBookDetail: (bookId) => apiClient.get(`/api/v1/books/${bookId}`),
};
