'use client';

import { useState } from 'react';
import { User, Upload, Menu, X } from 'lucide-react';

interface HeaderProps {
  onUploadClick: () => void;
  userStats: {
    unlockedRegions: number;
    postsCount: number;
  };
}

export default function Header({ onUploadClick, userStats }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">HB</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                HistoryBox
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                Discover hidden stories
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {/* User Stats */}
            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="text-center">
                <div className="font-semibold text-gray-900 dark:text-white">
                  {userStats.unlockedRegions}
                </div>
                <div className="text-xs">Regions</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-900 dark:text-white">
                  {userStats.postsCount}
                </div>
                <div className="text-xs">Posts</div>
              </div>
            </div>

            {/* Upload Button */}
            <button
              onClick={onUploadClick}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>Share Photo</span>
            </button>

            {/* User Menu */}
            <button className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <span className="font-medium">Explorer</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-gray-700 dark:text-gray-300"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="space-y-4">
              {/* User Stats */}
              <div className="flex justify-center space-x-8 text-sm text-gray-600 dark:text-gray-400">
                <div className="text-center">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {userStats.unlockedRegions}
                  </div>
                  <div className="text-xs">Regions</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {userStats.postsCount}
                  </div>
                  <div className="text-xs">Posts</div>
                </div>
              </div>

              {/* Upload Button */}
              <button
                onClick={onUploadClick}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>Share Photo</span>
              </button>

              {/* User Info */}
              <div className="flex items-center justify-center space-x-2 text-gray-700 dark:text-gray-300">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <span className="font-medium">Explorer</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}