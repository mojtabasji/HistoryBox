'use client';

import { useState } from 'react';
import { Region, Post } from '../types';
import { mockPosts } from '../lib/mockData';
import { MapPin, Lock, Unlock, Eye } from 'lucide-react';

interface WorldMapProps {
  regions: Region[];
  onRegionClick: (region: Region) => void;
  onPostClick: (post: Post) => void;
}

export default function WorldMap({ regions, onRegionClick, onPostClick }: WorldMapProps) {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 overflow-hidden">
      {/* Simple world map background */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-200 via-green-100 to-yellow-100 dark:from-slate-800 dark:via-slate-700 dark:to-slate-600">
        {/* Continents (simplified shapes) */}
        <div className="absolute top-[30%] left-[15%] w-32 h-20 bg-green-300 dark:bg-green-700 rounded-lg opacity-70" /> {/* Europe */}
        <div className="absolute top-[40%] left-[25%] w-40 h-32 bg-green-400 dark:bg-green-600 rounded-2xl opacity-70" /> {/* Asia */}
        <div className="absolute top-[45%] left-[8%] w-28 h-40 bg-green-300 dark:bg-green-700 rounded-lg opacity-70" /> {/* North America */}
        <div className="absolute top-[70%] left-[45%] w-24 h-16 bg-green-200 dark:bg-green-800 rounded-lg opacity-70" /> {/* Australia */}
      </div>

      {/* Region overlays */}
      {regions.map((region) => (
        <div
          key={region.id}
          className={`absolute cursor-pointer transition-all duration-300 ${
            hoveredRegion === region.id ? 'scale-110 z-20' : 'z-10'
          }`}
          style={{
            left: `${((region.center.lng + 180) / 360) * 100}%`,
            top: `${((90 - region.center.lat) / 180) * 100}%`,
            transform: 'translate(-50%, -50%)'
          }}
          onClick={() => onRegionClick(region)}
          onMouseEnter={() => setHoveredRegion(region.id)}
          onMouseLeave={() => setHoveredRegion(null)}
        >
          <div className={`relative p-4 rounded-xl border-2 transition-all ${
            region.isUnlocked 
              ? 'bg-green-100 border-green-400 shadow-green-200 dark:bg-green-900 dark:border-green-500' 
              : 'bg-orange-100 border-orange-400 shadow-orange-200 dark:bg-orange-900 dark:border-orange-500'
          } shadow-lg hover:shadow-xl`}>
            
            {/* Region indicator */}
            <div className="flex items-center space-x-2">
              {region.isUnlocked ? (
                <Unlock className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : (
                <Lock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              )}
              <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {region.name}
              </div>
            </div>

            {/* Hidden posts count */}
            <div className="flex items-center space-x-1 mt-1">
              <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {region.hiddenPostCount} hidden
              </span>
            </div>

            {/* Unlock price for locked regions */}
            {!region.isUnlocked && (
              <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                ${(region.unlockPrice / 100).toFixed(2)} to unlock
              </div>
            )}

            {/* Unlocked by count */}
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {region.unlockedBy} explorers
            </div>
          </div>
        </div>
      ))}

      {/* Posts for unlocked regions */}
      {mockPosts
        .filter(post => regions.find(r => r.id === post.regionId)?.isUnlocked)
        .map((post) => (
          <div
            key={post.id}
            className="absolute cursor-pointer z-30 hover:z-40"
            style={{
              left: `${((post.location.lng + 180) / 360) * 100}%`,
              top: `${((90 - post.location.lat) / 180) * 100}%`,
              transform: 'translate(-50%, -50%)'
            }}
            onClick={() => onPostClick(post)}
          >
            <div className="bg-blue-500 rounded-full p-2 shadow-lg hover:shadow-xl transition-all hover:scale-110">
              <MapPin className="w-4 h-4 text-white" />
            </div>
          </div>
        ))}
    </div>
  );
}