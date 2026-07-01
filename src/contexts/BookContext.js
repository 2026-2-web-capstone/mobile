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

const normalizeBookList = (data) => {
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data)) return data;
  return [];
};

const getCategoryName = (category) =>
  typeof category === "string" ? category : category?.name || "전체";

const getBookCategoryName = (book) => book.category || book.categoryName;

const getMockBooksForCategory = (category) => {
  const categoryName = getCategoryName(category);
  if (categoryName === "전체") return mockBooks;
  return mockBooks.filter((book) => getBookCategoryName(book) === categoryName);
};

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
      setBooks(normalizeBookList(booksData));
      // 카테고리 목록 앞에 "전체" 추가
      const categoryNames = (categoriesData || []).map((c) => ({
        id: c.id,
        name: c.name,
      }));
      setCategories([{ id: null, name: "전체" }, ...categoryNames]);
    } catch (error) {
      console.error("Failed to load initial data:", error);
      setBooks(mockBooks);
      setCategories(mockCategories);
    } finally {
      setIsLoading(false);
    }
  };

  // ── 필터링된 도서 목록 ──
  const getFilteredBooks = useCallback(() => {
    let filtered = books.length > 0 ? books : mockBooks;
    if (selectedCategory !== "전체") {
      filtered = filtered.filter(
        (book) => getBookCategoryName(book) === selectedCategory,
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
  }, [books, selectedCategory, searchQuery]);

  // ── 카테고리 선택 시 서버 조회 (API 모드) ──
  const handleCategoryChange = useCallback(
    async (category) => {
      const categoryName = getCategoryName(category);
      setSelectedCategory(categoryName);

      if (USE_MOCK_DATA) {
        return;
      }

      const categoryObj = categories.find(
        (item) => getCategoryName(item) === categoryName,
      );
      const categoryId =
        categoryObj && typeof categoryObj === "object" ? categoryObj.id : null;

      setIsLoading(true);
      try {
        if (categoryName === "전체") {
          const data = await bookApi.getBooks(0, 100);
          setBooks(normalizeBookList(data));
        } else if (categoryId != null) {
          const data = await bookApi.getBooksByCategory(categoryId, 0, 100);
          setBooks(normalizeBookList(data));
        } else {
          setBooks(getMockBooksForCategory(categoryName));
        }
      } catch (error) {
        console.error("Failed to load category books:", error);
        setBooks(getMockBooksForCategory(categoryName));
      } finally {
        setIsLoading(false);
      }
    },
    [categories],
  );

  // ── ID로 도서 조회 ──
  const getBookById = useCallback(
    (id) => {
      const sourceBooks = books.length > 0 ? books : mockBooks;
      return sourceBooks.find((book) => String(book.id) === String(id));
    },
    [books],
  );

  // ── 신간 도서 ──
  const getNewBooks = useCallback(() => {
    const sourceBooks = books.length > 0 ? books : mockBooks;
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const recentBooks = sourceBooks.filter(
      (book) => book.publishDate && new Date(book.publishDate) >= threeMonthsAgo,
    );
    return recentBooks.length > 0 ? recentBooks : sourceBooks.slice(0, 5);
  }, [books]);

  // ── 인기 도서 ──
  const getPopularBooks = useCallback(() => {
    const sourceBooks = books.length > 0 ? books : mockBooks;
    return [...sourceBooks]
      .sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0))
      .slice(0, 5);
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
      setBooks(normalizeBookList(data));
    } catch (error) {
      console.error("Failed to search:", error);
      const normalizedKeyword = keyword.toLowerCase();
      setBooks(
        mockBooks.filter(
          (book) =>
            book.title.toLowerCase().includes(normalizedKeyword) ||
            book.author.toLowerCase().includes(normalizedKeyword),
        ),
      );
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
