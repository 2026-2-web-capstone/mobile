import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Search } from "lucide-react-native";
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

const SearchScreen = () => {
  const { books, searchQuery, setSearchQuery, getFilteredBooks } = useBooks();
  const [localQuery, setLocalQuery] = useState(searchQuery || "");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(
    async (text) => {
      setLocalQuery(text);

      if (USE_MOCK_DATA) {
        setSearchQuery(text);
        return;
      }

      // API 모드: 서버 검색 (디바운스 없이 즉시)
      if (!text.trim()) {
        setSearchResults([]);
        setHasSearched(false);
        return;
      }

      setIsSearching(true);
      setHasSearched(true);
      try {
        const data = await bookApi.searchBooks(text, 0, 50);
        setSearchResults(data.content || data || []);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsSearching(false);
      }
    },
    [setSearchQuery],
  );

  const displayedBooks = USE_MOCK_DATA ? getFilteredBooks() : searchResults;
  const showResults = USE_MOCK_DATA ? localQuery.length > 0 : hasSearched;

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search size={20} color={colors.gray[400]} />
          <TextInput
            value={localQuery}
            onChangeText={handleSearch}
            placeholder="도서 제목, 저자로 검색"
            style={styles.searchInput}
            autoFocus
            returnKeyType="search"
          />
        </View>
      </View>

      {isSearching ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
        </View>
      ) : showResults ? (
        displayedBooks.length > 0 ? (
          <FlatList
            data={displayedBooks}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            columnWrapperStyle={styles.row}
            renderItem={({ item }) => <BookCard book={item} />}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.centerContainer}>
            <Text style={styles.noResultTitle}>검색 결과 없음</Text>
            <Text style={styles.noResultText}>다른 검색어로 시도해보세요.</Text>
          </View>
        )
      ) : (
        <View style={styles.centerContainer}>
          <Search size={64} color={colors.gray[300]} />
          <Text style={styles.hintText}>검색어를 입력해주세요</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  searchContainer: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: fontSize.base,
    color: colors.gray[900],
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  noResultTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.sm,
  },
  noResultText: {
    fontSize: fontSize.base,
    color: colors.gray[500],
  },
  hintText: {
    fontSize: fontSize.base,
    color: colors.gray[400],
    marginTop: spacing.lg,
  },
  listContent: {
    padding: spacing.lg,
  },
  row: {
    justifyContent: "space-between",
  },
});

export default SearchScreen;
