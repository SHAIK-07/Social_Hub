import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  Home,
  Search,
  PlusSquare,
  Heart,
  User,
  LogOut,
  Compass,
  LogIn,
} from 'lucide-react';

export default function Navbar() {
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 lg:top-0 lg:bottom-auto lg:border-b lg:border-t-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link
            to="/"
            className="hidden lg:block text-xl font-bold text-blue-600"
          >
            SocialHub
          </Link>

          <div className="flex justify-around items-center w-full lg:w-auto lg:space-x-6">
            {user ? (
              <>
                <Link
                  to="/"
                  className={`flex flex-col lg:flex-row items-center space-y-1 lg:space-y-0 lg:space-x-2 ${
                    isActive('/')
                      ? 'text-blue-600'
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  <Home size={24} />
                  <span className="text-xs lg:text-sm">Home</span>
                </Link>

                <Link
                  to="/explore"
                  className={`flex flex-col lg:flex-row items-center space-y-1 lg:space-y-0 lg:space-x-2 ${
                    isActive('/explore')
                      ? 'text-blue-600'
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  <Compass size={24} />
                  <span className="text-xs lg:text-sm">Explore</span>
                </Link>

                <Link
                  to="/create-post"
                  className={`flex flex-col lg:flex-row items-center space-y-1 lg:space-y-0 lg:space-x-2 ${
                    isActive('/create-post')
                      ? 'text-blue-600'
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  <PlusSquare size={24} />
                  <span className="text-xs lg:text-sm">Create</span>
                </Link>

                <Link
                  to="/activity"
                  className={`flex flex-col lg:flex-row items-center space-y-1 lg:space-y-0 lg:space-x-2 ${
                    isActive('/activity')
                      ? 'text-blue-600'
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  <Heart size={24} />
                  <span className="text-xs lg:text-sm">Activity</span>
                </Link>

                <div className="relative group">
                  <Link
                    to={`/profile/${user.id}`}
                    className={`flex flex-col lg:flex-row items-center space-y-1 lg:space-y-0 lg:space-x-2 ${
                      isActive(`/profile/${user.id}`)
                        ? 'text-blue-600'
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    <User size={24} />
                    <span className="text-xs lg:text-sm">Profile</span>
                  </Link>
                </div>

                <button
                  onClick={handleSignOut}
                  className="flex flex-col lg:flex-row items-center space-y-1 lg:space-y-0 lg:space-x-2 text-red-600 hover:text-red-700"
                >
                  <LogOut size={24} />
                  <span className="text-xs lg:text-sm">Sign Out</span>
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                className="flex flex-col lg:flex-row items-center space-y-1 lg:space-y-0 lg:space-x-2 text-blue-600"
              >
                <LogIn size={24} />
                <span className="text-xs lg:text-sm">Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
