import React, { createContext, useState, useEffect } from "react";
import api from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("pixora_token");
    const storedUser = localStorage.getItem("pixora_user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
    }, []);

    // Login function
  const login = async (email, password) => {
    try {
      const response = await api.post("/api/auth/login", {
        email,
        password,
      });

      const data = response.data;

      // Save token and user
      localStorage.setItem("pixora_token", data.token);
      localStorage.setItem("pixora_user", JSON.stringify(data.user));

      setToken(data.token);
      setUser(data.user);

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.msg || error.message || "Login failed";
      return { success: false, message };
    }
  };

    //register function
    const register = async (username, displayName, email, password) => {
    try {
        const response = await api.post("/api/auth/register", {
          username,
          displayName,
          email,
          password,
        });

        const data = response.data;

        // Save token and user
        localStorage.setItem("pixora_token", data.token);
        localStorage.setItem("pixora_user", JSON.stringify(data.user));

        setToken(data.token);
        setUser(data.user);

        return { success: true };
        } catch (error) {
            const message = error.response?.data?.msg || error.message || "Registration failed";
            return { success: false, message };
        }
    };

    //logout function
    const logout = () => {
        localStorage.removeItem("pixora_token");
        localStorage.removeItem("pixora_user");
        setToken(null);
        setUser(null);
    };

    const value = {
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!token
    };

    return (
        <AuthContext.Provider value={value}>
        {children}
        </AuthContext.Provider>
    );
}