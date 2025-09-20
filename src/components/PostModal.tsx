'use client';

import { Post } from '../types';
import { X, MapPin, Calendar, User } from 'lucide-react';

interface PostModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PostModal({ post, isOpen, onClose }: PostModalProps) {
  if (!isOpen || !post) return null;

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {post.title}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Image */}
        <div className="relative h-64 md:h-80 bg-gray-200 dark:bg-gray-700">
          <div className="absolute inset-0 flex items-center justify-center text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-lg mx-auto mb-2 flex items-center justify-center">
                <MapPin className="w-8 h-8" />
              </div>
              <p className="text-sm">Historical Photo</p>
              <p className="text-xs text-gray-400">Image placeholder</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Description */}
          <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
            {post.description}
          </p>

          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(post.timestamp)}</span>
            </div>
            
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
              <User className="w-4 h-4" />
              <span>Shared by {post.userName}</span>
            </div>
            
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
              <MapPin className="w-4 h-4" />
              <span>
                {post.location.lat.toFixed(4)}, {post.location.lng.toFixed(4)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex space-x-3">
              <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                View on Map
              </button>
              <button className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium py-2 px-4 rounded-lg transition-colors">
                Share Story
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}