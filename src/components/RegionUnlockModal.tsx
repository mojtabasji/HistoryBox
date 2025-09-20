'use client';

import { useState } from 'react';
import { Region } from '../types';
import { X, Lock, Eye, Users, CreditCard } from 'lucide-react';

interface RegionUnlockModalProps {
  region: Region | null;
  isOpen: boolean;
  onClose: () => void;
  onUnlock: (regionId: string) => Promise<void>;
}

export default function RegionUnlockModal({ region, isOpen, onClose, onUnlock }: RegionUnlockModalProps) {
  const [isUnlocking, setIsUnlocking] = useState(false);

  if (!isOpen || !region) return null;

  const handleUnlock = async () => {
    setIsUnlocking(true);
    try {
      await onUnlock(region.id);
      onClose();
    } catch (error) {
      console.error('Failed to unlock region:', error);
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {region.name}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {region.isUnlocked ? (
          /* Already unlocked */
          <div className="text-center py-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mb-4">
              <Eye className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Region Unlocked!
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You can now explore {region.hiddenPostCount} historical photos in this region.
            </p>
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{region.unlockedBy} explorers</span>
              </div>
            </div>
          </div>
        ) : (
          /* Not unlocked */
          <div className="text-center py-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full mb-4">
              <Lock className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Unlock Hidden Stories
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Discover {region.hiddenPostCount} hidden historical photos and stories from {region.name}.
            </p>
            
            {/* Stats */}
            <div className="flex items-center justify-center space-x-6 mb-6 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <Eye className="w-4 h-4" />
                <span>{region.hiddenPostCount} photos</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{region.unlockedBy} explorers</span>
              </div>
            </div>

            {/* Price and unlock button */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                ${(region.unlockPrice / 100).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                One-time unlock fee
              </div>
            </div>

            <button
              onClick={handleUnlock}
              disabled={isUnlocking}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <CreditCard className="w-5 h-5" />
              <span>{isUnlocking ? 'Unlocking...' : 'Unlock Region'}</span>
            </button>

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
              This is a demo. No actual payment will be processed.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}