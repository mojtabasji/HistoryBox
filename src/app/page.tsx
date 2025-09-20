'use client';

import { useState } from 'react';
import Header from '../components/Header';
import WorldMap from '../components/WorldMap';
import RegionUnlockModal from '../components/RegionUnlockModal';
import PostModal from '../components/PostModal';
import UploadModal from '../components/UploadModal';
import { Region, Post } from '../types';
import { mockRegions, mockPosts, mockUser } from '../lib/mockData';

export default function Home() {
  const [regions, setRegions] = useState<Region[]>(mockRegions);
  const [, setPosts] = useState<Post[]>(mockPosts);
  const [user, setUser] = useState(mockUser);
  
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isRegionModalOpen, setIsRegionModalOpen] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const handleRegionClick = (region: Region) => {
    setSelectedRegion(region);
    setIsRegionModalOpen(true);
  };

  const handlePostClick = (post: Post) => {
    setSelectedPost(post);
    setIsPostModalOpen(true);
  };

  const handleUnlockRegion = async (regionId: string) => {
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setRegions(prevRegions => 
      prevRegions.map(region => 
        region.id === regionId 
          ? { ...region, isUnlocked: true, unlockedBy: region.unlockedBy + 1 }
          : region
      )
    );
    
    setUser(prevUser => ({
      ...prevUser,
      unlockedRegions: [...prevUser.unlockedRegions, regionId]
    }));
  };

  const handleUploadPhoto = async (uploadData: {
    title: string;
    description: string;
    location: { lat: number; lng: number };
    timestamp: string;
  }) => {
    // Simulate upload processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newPost: Post = {
      id: `post-${Date.now()}`,
      title: uploadData.title,
      description: uploadData.description,
      imageUrl: '/api/placeholder/400/300',
      location: uploadData.location,
      timestamp: uploadData.timestamp || new Date().toISOString(),
      regionId: 'user-region', // Simplified for demo
      userId: user.id,
      userName: user.name
    };
    
    setPosts(prevPosts => [...prevPosts, newPost]);
    setUser(prevUser => ({
      ...prevUser,
      postsCount: prevUser.postsCount + 1
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header 
        onUploadClick={() => setIsUploadModalOpen(true)}
        userStats={{
          unlockedRegions: user.unlockedRegions.length,
          postsCount: user.postsCount
        }}
      />
      
      <main className="h-[calc(100vh-4rem)]">
        <WorldMap 
          regions={regions}
          onRegionClick={handleRegionClick}
          onPostClick={handlePostClick}
        />
      </main>

      <RegionUnlockModal
        region={selectedRegion}
        isOpen={isRegionModalOpen}
        onClose={() => setIsRegionModalOpen(false)}
        onUnlock={handleUnlockRegion}
      />

      <PostModal
        post={selectedPost}
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
      />

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUploadPhoto}
      />
    </div>
  );
}
