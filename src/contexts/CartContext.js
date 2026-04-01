import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { USE_MOCK_DATA } from "../api/config";
import { cartApi } from "../api/cartApi";
import { useAuth } from "./AuthContext";

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  // 장바구니 로드
  useEffect(() => {
    loadCart();
  }, [isAuthenticated]);

  const loadCart = async () => {
    try {
      if (USE_MOCK_DATA) {
        const savedCart = await AsyncStorage.getItem("cart");
        if (savedCart) {
          setCartItems(JSON.parse(savedCart));
        }
      } else if (isAuthenticated) {
        const data = await cartApi.getCart();
        setCartItems(data.items || []);
      }
    } catch (error) {
      console.error("Failed to load cart:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // mock 모드: 장바구니 변경 시 AsyncStorage에 저장
  useEffect(() => {
    if (USE_MOCK_DATA && !isLoading) {
      AsyncStorage.setItem("cart", JSON.stringify(cartItems)).catch((error) => {
        console.error("Failed to save cart:", error);
      });
    }
  }, [cartItems, isLoading]);

  const addToCart = useCallback(async (book, quantity = 1) => {
    if (USE_MOCK_DATA) {
      setCartItems((prevItems) => {
        const existingItem = prevItems.find((item) => item.id === book.id);
        if (existingItem) {
          return prevItems.map((item) =>
            item.id === book.id
              ? { ...item, quantity: item.quantity + quantity }
              : item,
          );
        }
        return [...prevItems, { ...book, quantity }];
      });
      return;
    }

    // API 모드
    try {
      const bookId = book.id || book.bookId;
      const data = await cartApi.addCartItem(bookId, quantity);
      setCartItems(data.items || []);
    } catch (error) {
      console.error("Failed to add to cart:", error);
      throw error;
    }
  }, []);

  const removeFromCart = useCallback(async (itemId) => {
    if (USE_MOCK_DATA) {
      setCartItems((prevItems) =>
        prevItems.filter((item) => item.id !== itemId),
      );
      return;
    }

    // API 모드: itemId = cartItemId
    try {
      await cartApi.removeCartItem(itemId);
      setCartItems((prevItems) =>
        prevItems.filter((item) => item.id !== itemId),
      );
    } catch (error) {
      console.error("Failed to remove from cart:", error);
      throw error;
    }
  }, []);

  const updateQuantity = useCallback(
    (itemId, quantity) => {
      if (quantity <= 0) {
        removeFromCart(itemId);
        return;
      }
      if (USE_MOCK_DATA) {
        setCartItems((prevItems) =>
          prevItems.map((item) =>
            item.id === itemId ? { ...item, quantity } : item,
          ),
        );
        return;
      }
      // API에 수량 변경 엔드포인트가 없으므로,
      // 삭제 후 재추가하거나 로컬 상태만 갱신
      setCartItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId ? { ...item, quantity } : item,
        ),
      );
    },
    [removeFromCart],
  );

  const clearCart = useCallback(async () => {
    if (USE_MOCK_DATA) {
      setCartItems([]);
      return;
    }
    // API 모드: 각 아이템을 개별 삭제
    try {
      await Promise.all(
        cartItems.map((item) => cartApi.removeCartItem(item.id)),
      );
      setCartItems([]);
    } catch (error) {
      console.error("Failed to clear cart:", error);
    }
  }, [cartItems]);

  const getTotalPrice = useCallback(() => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );
  }, [cartItems]);

  const getTotalItems = useCallback(() => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  }, [cartItems]);

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getTotalItems,
    isLoading,
    refreshCart: loadCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
