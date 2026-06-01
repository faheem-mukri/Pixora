import React, { createContext, useState, useEffect } from "react";
import api from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is logged in on mount (fetch from server)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await api.get('/api/auth/me');
        setUser(data.data.user);
        setIsAuthenticated(true);
      } catch (err) {
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      const response = await api.post("/api/auth/login", {
        email,
        password,
      });

      const data = response.data;

      // Token is stored in httpOnly cookie automatically
      if (data.data?.user) {
        setUser(data.data.user);
        setIsAuthenticated(true);
      }

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || error.message || "Login failed";
      return { success: false, message };
    }
  };

  // Register function
  const register = async (username, displayName, email, password) => {
    try {
      const response = await api.post("/api/auth/register", {
        username,
        displayName,
        email,
        password,
      });

      const data = response.data;

      // Token is stored in httpOnly cookie automatically
      if (data.data?.user) {
        setUser(data.data.user);
        setIsAuthenticated(true);
      }

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || error.message || "Registration failed";
      return { success: false, message };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (err) {
      // Logout anyway even if request fails
    }
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};