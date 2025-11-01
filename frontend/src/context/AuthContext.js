import React, { createContext, useState, useEffect } from "react";

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
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || "Login failed");
      }

      // Save token and user
      localStorage.setItem("pixora_token", data.token);
      localStorage.setItem("pixora_user", JSON.stringify(data.user));

        setToken(data.token);
        setUser(data.user);

        return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

    //register function
    const register = async (username, displayName, email, password) => {
    try {
        const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, displayName, email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
        throw new Error(data.msg || "Registration failed");
        }

        // Save token and user
        localStorage.setItem("pixora_token", data.token);
        localStorage.setItem("pixora_user", JSON.stringify(data.user));

        setToken(data.token);
        setUser(data.user);

        return { success: true };
        } catch (error) {
            return { success: false, message: error.message };
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