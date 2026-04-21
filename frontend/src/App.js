import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RecommendationsProvider } from './context/RecommendationsContext';
import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/Header';
import RootRedirect from './pages/RootRedirect';
import HomePage from './pages/HomePage';
import SearchResultsPage from './pages/SearchResultsPage';
import PinDetailPage from './pages/PinDetailPage';
import RecommendationsPage from './pages/RecommendationsPage';
import SavedPinsPage from './pages/SavedPinsPage';
import ProfilePage from './pages/ProfilePage';
import CreatePinPage from './pages/CreatePinPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <RecommendationsProvider>
            <div className="App">
              <Routes>
                {/* Root redirect — checks token and redirects to /home or /login */}
                <Route path="/" element={<RootRedirect />} />

                {/* Auth pages — no header */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />

                {/* All other pages — with header */}
                <Route path="/*" element={
                  <>
                    <Header />
                    <Routes>
                      <Route path="/home" element={<HomePage />} />
                      <Route path="/search" element={<SearchResultsPage />} />
                      <Route path="/pin/:id" element={<PinDetailPage />} />

                      {/* Protected */}
                      <Route path="/recommendations" element={
                        <ProtectedRoute><RecommendationsPage /></ProtectedRoute>
                      } />
                      <Route path="/saved" element={
                        <ProtectedRoute><SavedPinsPage /></ProtectedRoute>
                      } />
                      <Route path="/create" element={
                        <ProtectedRoute><CreatePinPage /></ProtectedRoute>
                      } />

                      {/* Profile — must be last (dynamic) */}
                      <Route path="/:username" element={<ProfilePage />} />
                    </Routes>
                  </>
                } />
              </Routes>
            </div>
          </RecommendationsProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;