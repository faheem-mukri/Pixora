import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RecommendationsProvider } from './context/RecommendationsContext';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import SearchResultsPage from './pages/SearchResultsPage';
import PinDetailPage from './pages/PinDetailPage';
import RecommendationsPage from './pages/RecommendationsPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
         <RecommendationsProvider>
        <div className="App">
          <Routes>
            {/* Public routes - no header */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Routes with header */}
            <Route
              path="/*"
              element={
                <>
                  <Header />
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/search" element={<SearchResultsPage />} />
                    <Route path="/pin/:id" element={<PinDetailPage />} />
                    
                    {/* Protected route */}
                    <Route
                      path="/recommendations"
                      element={
                        <ProtectedRoute>
                          <RecommendationsPage />
                        </ProtectedRoute>
                      }
                    />
                  </Routes>
                </>
              }
            />
          </Routes>
        </div>
        </RecommendationsProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
