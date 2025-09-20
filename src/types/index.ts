export interface Region {
  id: string;
  name: string;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  center: {
    lat: number;
    lng: number;
  };
  hiddenPostCount: number;
  isUnlocked: boolean;
  unlockPrice: number; // in cents
  unlockedBy: number; // number of users who unlocked
}

export interface Post {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  location: {
    lat: number;
    lng: number;
  };
  timestamp: string;
  regionId: string;
  userId: string;
  userName: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  unlockedRegions: string[];
  postsCount: number;
  achievements: string[];
}