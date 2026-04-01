import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { USE_MOCK_DATA } from "../api/config";
import { bookApi } from "../api/bookApi";
import { mockBooks, categories as mockCategories } from "../utils/mockData";

const BookContext = createContext();

export const useBooks = () => {
  const context = useContext(BookContext);
  if (!context) {
    throw new Error("useBooks must be used within BookProvider");
  }
  return context;
};

export const BookProvider = ({ children }) => {
  const [books, setBooks] = useState(USE_MOCK_DATA ? mockBooks : []);
  const [categories, setCategories] = useState(
    USE_MOCK_DATA ? mockCategories : ["전체"],
  );
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // API 모드: 초기 데이터 로드
  useEffect(() => {
    if (!USE_MOCK_DATA) {
      loadInitialData();
    }
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [booksData, categoriesData] = await Promise.all([
        bookApi.getBooks(0, 100),
        bookApi.getCategories(),
      ]);
      // booksData는 Page 객체이므로 content를 추출
      setBooks(booksData.content || booksData);
      // 카테고리 목록 앞에 "전체" 추가
      const categoryNames = (categoriesData || []).map((c) => ({
        id: c.id,
        name: c.name,
      }));
      setCategories([{ id: null, name: "전체" }, ...categoryNames]);
    } catch (error) {
      console.error("Failed to load initial data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ── 필터링된 도서 목록 ──
  const getFilteredBooks = useCallback(() => {
    if (USE_MOCK_DATA) {
      let filtered = books;
      if (selectedCategory !== "전체") {
        filtered = filtered.filter(
          (book) => book.category === selectedCategory,
        );
      }
      if (searchQuery) {
        filtered = filtered.filter(
          (book) =>
            book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            book.author.toLowerCase().includes(searchQuery.toLowerCase()),
        );
      }
      return filtered;
    }
    // API 모드에서는 books 상태를 그대로 반환 (서버에서 필터링)
    return books;
  }, [books, selectedCategory, searchQuery]);

  // ── 카테고리 선택 시 서버 조회 (API 모드) ──
  const handleCategoryChange = useCallback(
    async (category) => {
      if (USE_MOCK_DATA) {
        setSelectedCategory(
          typeof category === "string" ? category : category.name,
        );
        return;
      }

      const categoryObj =
        typeof category === "string"
          ? categories.find((c) => c.name === category)
          : category;
      setSelectedCategory(categoryObj?.name || "전체");

      if (!categoryObj || categoryObj.id === null) {
        // "전체" 선택
        setIsLoading(true);
        try {
          const data = await bookApi.getBooks(0, 100);
          setBooks(data.content || data);
        } catch (error) {
          console.error("Failed to load books:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(true);
        try {
          const data = await bookApi.getBooksByCategory(categoryObj.id, 0, 100);
          setBooks(data.content || data);
        } catch (error) {
          console.error("Failed to load category books:", error);
        } finally {
          setIsLoading(false);
        }
      }
    },
    [categories],
  );

  // ── ID로 도서 조회 ──
  const getBookById = useCallback(
    (id) => {
      if (USE_MOCK_DATA) {
        return books.find((book) => book.id === parseInt(id));
      }
      // API 모드에서는 null 반환 → 스크린에서 별도 API 호출
      return null;
    },
    [books],
  );

  // ── 신간 도서 ──
  const getNewBooks = useCallback(() => {
    if (USE_MOCK_DATA) {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      return books.filter(
        (book) => new Date(book.publishDate) >= threeMonthsAgo,
      );
    }
    return [];
  }, [books]);

  // ── 인기 도서 ──
  const getPopularBooks = useCallback(() => {
    if (USE_MOCK_DATA) {
      return [...books].sort((a, b) => a.stock - b.stock).slice(0, 5);
    }
    return [];
  }, [books]);

  // ── 검색 (API 모드) ──
  const searchBooksApi = useCallback(async (keyword) => {
    if (USE_MOCK_DATA) {
      setSearchQuery(keyword);
      return;
    }
    if (!keyword.trim()) {
      const data = await bookApi.getBooks(0, 100);
      setBooks(data.content || data);
      return;
    }
    setIsLoading(true);
    try {
      const data = await bookApi.searchBooks(keyword, 0, 100);
      setBooks(data.content || data);
    } catch (error) {
      console.error("Failed to search:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── 관리자 기능 (mock 모드에서만 동작) ──
  const addBook = (bookData) => {
    if (!USE_MOCK_DATA) return null;
    const newBook = {
      ...bookData,
      id: Math.max(...books.map((b) => b.id)) + 1,
    };
    setBooks([...books, newBook]);
    return newBook;
  };

  const updateBook = (id, bookData) => {
    if (!USE_MOCK_DATA) return;
    setBooks(
      books.map((book) => (book.id === id ? { ...book, ...bookData } : book)),
    );
  };

  const deleteBook = (id) => {
    if (!USE_MOCK_DATA) return;
    setBooks(books.filter((book) => book.id !== id));
  };

  const value = {
    books,
    categories,
    selectedCategory,
    setSelectedCategory: handleCategoryChange,
    searchQuery,
    setSearchQuery: USE_MOCK_DATA ? setSearchQuery : searchBooksApi,
    getFilteredBooks,
    getBookById,
    getNewBooks,
    getPopularBooks,
    addBook,
    updateBook,
    deleteBook,
    isLoading,
  };

  return <BookContext.Provider value={value}>{children}</BookContext.Provider>;
};
