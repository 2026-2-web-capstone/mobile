import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import {
  ShoppingCart,
  Star,
  MessageSquare,
  Edit2,
  Trash2,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useBooks } from "../contexts/BookContext";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { USE_MOCK_DATA } from "../api/config";
import { bookApi } from "../api/bookApi";
import { reviewApi } from "../api/reviewApi";
import Button from "../components/Button";
import {
  colors,
  borderRadius,
  fontSize,
  fontWeight,
  spacing,
} from "../theme/colors";

const { width } = Dimensions.get("window");

const BookDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { bookId } = route.params;
  const { getBookById } = useBooks();
  const { addToCart } = useCart();
  const { isAuthenticated, user } = useAuth();

  const [book, setBook] = useState(null);
  const [isLoadingBook, setIsLoadingBook] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);
  const [editingReviewId, setEditingReviewId] = useState(null);

  // 도서 정보 로딩
  useEffect(() => {
    loadBook();
    loadReviews();
  }, [bookId]);

  const loadBook = async () => {
    try {
      if (USE_MOCK_DATA) {
        const mockBook = getBookById(bookId);
        setBook(mockBook);
      } else {
        const data = await bookApi.getBookDetail(bookId);
        // 백엔드 DTO → 모바일 필드 매핑
        setBook({
          ...data,
          image: data.thumbnailUrl || (data.images && data.images[0]),
          category: data.categoryName,
        });
      }
    } catch (error) {
      console.error("Failed to load book:", error);
    } finally {
      setIsLoadingBook(false);
    }
  };

  const loadReviews = async () => {
    try {
      if (USE_MOCK_DATA) {
        const savedReviews = await AsyncStorage.getItem(`reviews_${bookId}`);
        if (savedReviews) {
          setReviews(JSON.parse(savedReviews));
        }
      } else {
        const data = await reviewApi.getReviews(bookId, 0, 100);
        const reviewList = data.content || data;
        // 백엔드 ReviewResponse → 모바일 리뷰 구조 매핑
        setReviews(
          (reviewList || []).map((r) => ({
            id: r.id,
            userId: r.userId,
            userName: r.userName || r.username || "익명",
            rating: r.rating,
            text: r.content,
            date: r.createdAt,
          })),
        );
      }
    } catch (error) {
      console.error("Failed to load reviews:", error);
    }
  };

  if (isLoadingBook) {
    return (
      <View style={[styles.emptyContainer]}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
      </View>
    );
  }

  if (!book) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>도서를 찾을 수 없습니다.</Text>
      </View>
    );
  }

  const handleAddToCart = () => {
    addToCart(book, quantity);
    Alert.alert("알림", "장바구니에 추가되었습니다!");
    navigation.goBack();
  };

  const handleSubmitReview = async () => {
    if (!isAuthenticated) {
      Alert.alert("알림", "로그인이 필요합니다.", [
        { text: "취소" },
        { text: "로그인", onPress: () => navigation.navigate("Login") },
      ]);
      return;
    }

    if (!reviewText.trim()) {
      Alert.alert("알림", "리뷰 내용을 입력해주세요.");
      return;
    }

    try {
      if (USE_MOCK_DATA) {
        const newReview = {
          id: Date.now(),
          userId: user?.id,
          userName: user?.name,
          rating,
          text: reviewText,
          date: new Date().toISOString(),
        };

        let updatedReviews;
        if (editingReviewId) {
          updatedReviews = reviews.map((r) =>
            r.id === editingReviewId
              ? { ...newReview, id: editingReviewId }
              : r,
          );
          setEditingReviewId(null);
        } else {
          updatedReviews = [...reviews, newReview];
        }

        setReviews(updatedReviews);
        await AsyncStorage.setItem(
          `reviews_${bookId}`,
          JSON.stringify(updatedReviews),
        );
      } else {
        if (editingReviewId) {
          await reviewApi.updateReview(editingReviewId, {
            rating,
            content: reviewText,
          });
          setEditingReviewId(null);
        } else {
          await reviewApi.createReview(bookId, {
            rating,
            content: reviewText,
          });
        }
        // 리뷰 목록 새로고침
        await loadReviews();
      }
    } catch (error) {
      Alert.alert("오류", error.message || "리뷰 등록에 실패했습니다.");
    }

    setReviewText("");
    setRating(5);
  };

  const handleEditReview = (review) => {
    if (!user || review.userId !== user.id) return;
    setReviewText(review.text);
    setRating(review.rating);
    setEditingReviewId(review.id);
  };

  const handleDeleteReview = async (reviewId) => {
    Alert.alert("삭제 확인", "리뷰를 삭제하시겠습니까?", [
      { text: "취소" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            if (USE_MOCK_DATA) {
              const updatedReviews = reviews.filter((r) => r.id !== reviewId);
              setReviews(updatedReviews);
              await AsyncStorage.setItem(
                `reviews_${bookId}`,
                JSON.stringify(updatedReviews),
              );
            } else {
              await reviewApi.deleteReview(reviewId);
              await loadReviews();
            }
          } catch (error) {
            Alert.alert("오류", "리뷰 삭제에 실패했습니다.");
          }
        },
      },
    ]);
  };

  const userReview = reviews.find((r) => r.userId === user?.id);

  const renderStars = (currentRating, interactive = false) => (
    <View style={styles.starsContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => interactive && setRating(star)}
          disabled={!interactive}
        >
          <Star
            size={interactive ? 32 : 16}
            color={
              star <= currentRating ? colors.yellow[400] : colors.gray[300]
            }
            fill={star <= currentRating ? colors.yellow[400] : "none"}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 이미지 */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: book.image }}
          style={styles.image}
          resizeMode="cover"
        />
      </View>

      {/* 정보 */}
      <View style={styles.infoContainer}>
        <Text style={styles.title}>{book.title}</Text>

        <View style={styles.metaContainer}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>저자:</Text>
            <Text style={styles.metaValue}>{book.author}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>출판사:</Text>
            <Text style={styles.metaValue}>{book.publisher}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>카테고리:</Text>
            <Text style={styles.metaValue}>
              {book.category || book.categoryName}
            </Text>
          </View>
          {book.isbn && (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>ISBN:</Text>
              <Text style={styles.metaValue}>{book.isbn}</Text>
            </View>
          )}
          {book.publishDate && (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>출간일:</Text>
              <Text style={styles.metaValue}>{book.publishDate}</Text>
            </View>
          )}
          {book.stock !== undefined && (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>재고:</Text>
              <Text style={styles.metaValue}>{book.stock}권</Text>
            </View>
          )}
          {book.ratingAvg !== undefined && (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>평점:</Text>
              <Text style={styles.metaValue}>
                ★ {book.ratingAvg.toFixed(1)} ({book.reviewCount}개 리뷰)
              </Text>
            </View>
          )}
        </View>

        <View style={styles.priceSection}>
          <Text style={styles.price}>{book.price.toLocaleString()}원</Text>

          <View style={styles.quantityContainer}>
            <Text style={styles.quantityLabel}>수량:</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                style={styles.quantityButton}
              >
                <Text style={styles.quantityButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.quantityValue}>{quantity}</Text>
              <TouchableOpacity
                onPress={() =>
                  setQuantity(Math.min(book.stock || 99, quantity + 1))
                }
                style={styles.quantityButton}
              >
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Button onPress={handleAddToCart} style={styles.addToCartButton}>
            <View style={styles.buttonContent}>
              <ShoppingCart size={20} color={colors.white} />
              <Text style={styles.addToCartText}>장바구니에 담기</Text>
            </View>
          </Button>
        </View>
      </View>

      {/* 설명 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>도서 소개</Text>
        <Text style={styles.description}>{book.description}</Text>
      </View>

      {/* 리뷰 */}
      <View style={styles.section}>
        <View style={styles.reviewHeader}>
          <MessageSquare size={24} color={colors.primary[600]} />
          <Text style={styles.sectionTitle}>리뷰 ({reviews.length})</Text>
        </View>

        {/* 리뷰 작성 및 수정 */}
        {isAuthenticated && (!userReview || editingReviewId) && (
          <View style={styles.reviewForm}>
            <Text style={styles.reviewFormLabel}>
              {editingReviewId ? "리뷰 수정" : "리뷰 작성"}
            </Text>
            {renderStars(rating, true)}
            <TextInput
              value={reviewText}
              onChangeText={setReviewText}
              placeholder="리뷰를 작성해주세요..."
              style={styles.reviewInput}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.reviewFormButtons}>
              {editingReviewId && (
                <Button
                  variant="secondary"
                  onPress={() => {
                    setEditingReviewId(null);
                    setReviewText("");
                    setRating(5);
                  }}
                  style={styles.cancelButton}
                >
                  취소
                </Button>
              )}
              <Button
                onPress={handleSubmitReview}
                style={
                  editingReviewId
                    ? styles.submitButtonHalf
                    : styles.submitButtonFull
                }
              >
                {editingReviewId ? "수정 완료" : "리뷰 등록"}
              </Button>
            </View>
          </View>
        )}

        {/* 리뷰 목록 */}
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <View key={review.id} style={styles.reviewItem}>
              <View style={styles.reviewItemHeader}>
                <View>
                  <View style={styles.reviewerInfo}>
                    <Text style={styles.reviewerName}>{review.userName}</Text>
                    {renderStars(review.rating)}
                  </View>
                  <Text style={styles.reviewDate}>
                    {new Date(review.date).toLocaleDateString("ko-KR")}
                  </Text>
                </View>
                {user?.id === review.userId && (
                  <View style={styles.reviewActions}>
                    <TouchableOpacity
                      onPress={() => handleEditReview(review)}
                      style={styles.reviewActionButton}
                    >
                      <Edit2 size={16} color={colors.gray[600]} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteReview(review.id)}
                      style={styles.reviewActionButton}
                    >
                      <Trash2 size={16} color={colors.red[600]} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              <Text style={styles.reviewText}>{review.text}</Text>
            </View>
          ))
        ) : (
          <View style={styles.noReviews}>
            <Text style={styles.noReviewsText}>아직 리뷰가 없습니다.</Text>
          </View>
        )}
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: fontSize.lg,
    color: colors.gray[500],
  },
  imageContainer: {
    width: width,
    aspectRatio: 3 / 4,
    backgroundColor: colors.gray[100],
  },
  image: {
    width: "100%",
    height: "100%",
  },
  infoContainer: {
    padding: spacing.lg,
  },
  title: {
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.lg,
  },
  metaContainer: {
    marginBottom: spacing.lg,
  },
  metaRow: {
    flexDirection: "row",
    marginBottom: spacing.sm,
  },
  metaLabel: {
    fontSize: fontSize.base,
    color: colors.gray[600],
    width: 80,
  },
  metaValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.gray[900],
    flex: 1,
  },
  priceSection: {
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    paddingTop: spacing.lg,
  },
  price: {
    fontSize: fontSize["3xl"],
    fontWeight: fontWeight.bold,
    color: colors.primary[600],
    marginBottom: spacing.lg,
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  quantityLabel: {
    fontSize: fontSize.base,
    color: colors.gray[700],
    marginRight: spacing.lg,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityButtonText: {
    fontSize: fontSize.lg,
    color: colors.gray[700],
  },
  quantityValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    marginHorizontal: spacing.lg,
    minWidth: 30,
    textAlign: "center",
  },
  addToCartButton: {
    width: "100%",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  addToCartText: {
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  section: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  description: {
    fontSize: fontSize.base,
    color: colors.gray[700],
    lineHeight: fontSize.base * 1.6,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  reviewForm: {
    backgroundColor: colors.gray[50],
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  reviewFormLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.gray[700],
    marginBottom: spacing.sm,
  },
  starsContainer: {
    flexDirection: "row",
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: fontSize.base,
    marginBottom: spacing.md,
    minHeight: 100,
    backgroundColor: colors.white,
  },
  reviewItem: {
    backgroundColor: colors.gray[50],
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  reviewItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  reviewerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  reviewerName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
  },
  reviewDate: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
  },
  reviewActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  reviewActionButton: {
    padding: spacing.xs,
  },
  reviewText: {
    fontSize: fontSize.base,
    color: colors.gray[700],
    lineHeight: fontSize.base * 1.5,
  },
  noReviews: {
    paddingVertical: spacing.xxl,
    alignItems: "center",
  },
  noReviewsText: {
    fontSize: fontSize.base,
    color: colors.gray[500],
  },
  bottomPadding: {
    height: spacing.xxl,
  },
});

export default BookDetailScreen;
