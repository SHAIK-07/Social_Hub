import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import CreatePost from './pages/CreatePost';
import CategoryFeed from './pages/CategoryFeed';
import Activity from './pages/Activity';
import RegistrationForm from './pages/RegistrationForm';

function App() {
  const { loadUser, loading, user, profile } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If user exists but profile is incomplete (no full_name), redirect to registration
  const isProfileIncomplete = user && profile && !profile.full_name;

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <main className="container mx-auto px-4 py-8 lg:pt-24">
          <Routes>
            <Route
              path="/"
              element={
                user ? (
                  isProfileIncomplete ? (
                    <Navigate to="/complete-profile" />
                  ) : (
                    <Home />
                  )
                ) : (
                  <Navigate to="/auth" />
                )
              }
            />
            <Route
              path="/auth"
              element={!user ? <Auth /> : <Navigate to="/" />}
            />
            <Route
              path="/complete-profile"
              element={
                user && isProfileIncomplete ? (
                  <RegistrationForm />
                ) : (
                  <Navigate to="/" />
                )
              }
            />
            <Route
              path="/profile/:id"
              element={user ? <Profile /> : <Navigate to="/auth" />}
            />
            <Route
              path="/create-post"
              element={user ? <CreatePost /> : <Navigate to="/auth" />}
            />
            <Route
              path="/category/:slug"
              element={user ? <CategoryFeed /> : <Navigate to="/auth" />}
            />
            <Route
              path="/activity"
              element={user ? <Activity /> : <Navigate to="/auth" />}
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
