import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { USE_MOCK_DATA } from "../api/config";
import { authApi } from "../api/authApi";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        if (USE_MOCK_DATA) {
          // mock 모드: AsyncStorage에서 사용자 정보 복원
          const savedUser = await AsyncStorage.getItem("user");
          if (savedUser) {
            setUser(JSON.parse(savedUser));
          }
        } else {
          // API 모드: 저장된 토큰으로 사용자 정보 조회
          const token = await AsyncStorage.getItem("accessToken");
          if (token) {
            const userData = await authApi.getMe();
            setUser(userData);
          }
        }
      } catch (error) {
        console.error("Failed to load user:", error);
        // 토큰 만료 등의 경우 클리어
        if (!USE_MOCK_DATA) {
          await AsyncStorage.multiRemove(["accessToken", "refreshToken"]);
        }
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = async (email, password) => {
    if (USE_MOCK_DATA) {
      // ── mock 로그인 ──
      const mockUser = {
        id: 1,
        email,
        name: email.split("@")[0],
        username: email.split("@")[0],
        role: email === "admin@example.com" ? "ADMIN" : "USER",
      };
      setUser(mockUser);
      await AsyncStorage.setItem("user", JSON.stringify(mockUser));
      return { success: true, user: mockUser };
    }

    // ── API 로그인 ──
    try {
      const data = await authApi.signin({ email, password });
      // data = { accessToken, refreshToken, user }
      await AsyncStorage.setItem("accessToken", data.accessToken);
      await AsyncStorage.setItem("refreshToken", data.refreshToken);
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const register = async (email, password, name, username, phone) => {
    if (USE_MOCK_DATA) {
      // ── mock 회원가입 ──
      const newUser = {
        id: Date.now(),
        email,
        name,
        username: username || email.split("@")[0],
        role: "USER",
      };
      setUser(newUser);
      await AsyncStorage.setItem("user", JSON.stringify(newUser));
      return { success: true, user: newUser };
    }

    // ── API 회원가입 → 자동 로그인 ──
    try {
      await authApi.signup({ email, username, password, name, phone });
      // 가입 성공 후 자동 로그인
      return await login(email, password);
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const logout = async () => {
    if (!USE_MOCK_DATA) {
      try {
        const refreshToken = await AsyncStorage.getItem("refreshToken");
        await authApi.signout(refreshToken);
      } catch (error) {
        // 로그아웃 API 실패해도 로컬은 클리어
        console.error("Signout API error:", error);
      }
    }
    setUser(null);
    await AsyncStorage.multiRemove(["user", "accessToken", "refreshToken"]);
  };

  const updateUser = async (userData) => {
    if (USE_MOCK_DATA) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
      return updatedUser;
    }

    // API 모드
    const updatedUser = await authApi.updateMe({
      name: userData.name,
      phone: userData.phone,
    });
    setUser(updatedUser);
    return updatedUser;
  };

  const deleteAccount = async () => {
    if (!USE_MOCK_DATA) {
      await authApi.deleteMe();
    }
    setUser(null);
    await AsyncStorage.multiRemove(["user", "accessToken", "refreshToken"]);
  };

  const value = {
    user,
    login,
    register,
    logout,
    updateUser,
    deleteAccount,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === "ADMIN" || user?.role === "admin",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
