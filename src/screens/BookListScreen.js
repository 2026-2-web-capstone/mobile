import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import BookCard from "../components/BookCard";
import { useBooks } from "../contexts/BookContext";
import { USE_MOCK_DATA } from "../api/config";
import { bookApi } from "../api/bookApi";
import {
  colors,
  borderRadius,
  fontSize,
  fontWeight,
  spacing,
} from "../theme/colors";

const BookListScreen = () => {
  const route = useRoute();
  const { filter } = route.params || {};
  const {
    getFilteredBooks,
    categories,
    selectedCategory,
    setSelectedCategory,
    getNewBooks,
    getPopularBooks,
    isLoading: contextLoading,
  } = useBooks();

  const [displayBooks, setDisplayBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadBooks();
  }, [filter]);

  const loadBooks = async () => {
    if (USE_MOCK_DATA) {
      // mock 모드: 기존 로직 그대로
      if (filter === "new") {
        setDisplayBooks(getNewBooks());
      } else if (filter === "popular") {
        setDisplayBooks(getPopularBooks());
      } else {
        setDisplayBooks(getFilteredBooks());
      }
      return;
    }

    // API 모드
    setIsLoading(true);
    try {
      let data;
      if (filter === "new") {
        data = await bookApi.getNewBooks(0, 100);
      } else if (filter === "popular") {
        data = await bookApi.getPopularBooks();
      } else {
        data = await bookApi.getBooks(0, 100);
      }
      setDisplayBooks(data.content || data || []);
    } catch (error) {
      console.error("Failed to load books:", error);
      if (filter === "new") {
        setDisplayBooks(getNewBooks());
      } else if (filter === "popular") {
        setDisplayBooks(getPopularBooks());
      } else {
        setDisplayBooks(getFilteredBooks());
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 카테고리 변경 시 도서 목록 갱신
  useEffect(() => {
    if (!filter) {
      setDisplayBooks(getFilteredBooks());
    }
  }, [selectedCategory, getFilteredBooks, filter]);

  const handleCategoryChange = async (category) => {
    await setSelectedCategory(category);
    if (!USE_MOCK_DATA) {
      // BookContext의 setSelectedCategory가 API 호출 포함
      // books가 갱신되면 displayBooks도 갱신
      setIsLoading(true);
      try {
        const categoryObj =
          typeof category === "string"
            ? categories.find((c) => c.name === category)
            : category;

        let data;
        if (!categoryObj || categoryObj.id === null) {
          data = await bookApi.getBooks(0, 100);
        } else {
          data = await bookApi.getBooksByCategory(categoryObj.id, 0, 100);
        }
        setDisplayBooks(data.content || data || []);
      } catch (error) {
        console.error("Failed to load category books:", error);
        setDisplayBooks(getFilteredBooks());
      } finally {
        setIsLoading(false);
      }
    }
  };

  const getTitle = () => {
    if (filter === "new") return "신간 도서";
    if (filter === "popular") return "인기 도서";
    return "전체 도서";
  };

  const showCategories = !filter;

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>{getTitle()}</Text>

      {showCategories && (
        <FlatList
          horizontal
          data={USE_MOCK_DATA ? categories : categories}
          keyExtractor={(item) => {
            if (typeof item === "string") return item;
            return item.id?.toString() || item.name;
          }}
          renderItem={({ item }) => {
            const categoryName = typeof item === "string" ? item : item.name;
            const isActive = selectedCategory === categoryName;
            return (
              <TouchableOpacity
                onPress={() => handleCategoryChange(item)}
                style={[
                  styles.categoryButton,
                  isActive && styles.categoryButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    isActive && styles.categoryTextActive,
                  ]}
                >
                  {categoryName}
                </Text>
              </TouchableOpacity>
            );
          }}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
          style={styles.categoryContainer}
        />
      )}

      {isLoading || contextLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
        </View>
      ) : (
        <FlatList
          data={displayBooks}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => <BookCard book={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  pageTitle: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  categoryContainer: {
    maxHeight: 50,
  },
  categoryList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  categoryButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
    marginRight: spacing.sm,
  },
  categoryButtonActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  categoryText: {
    fontSize: fontSize.sm,
    color: colors.gray[700],
  },
  categoryTextActive: {
    color: colors.white,
    fontWeight: fontWeight.medium,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: spacing.lg,
  },
  row: {
    justifyContent: "space-between",
  },
});

export default BookListScreen;
