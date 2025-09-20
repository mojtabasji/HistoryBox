import { Region, Post } from '../types';

export const mockRegions: Region[] = [
  {
    id: 'europe-west',
    name: 'Western Europe',
    bounds: {
      north: 60,
      south: 35,
      east: 15,
      west: -10
    },
    center: { lat: 50, lng: 5 },
    hiddenPostCount: 12,
    isUnlocked: false,
    unlockPrice: 99, // $0.99
    unlockedBy: 234
  },
  {
    id: 'north-america-east',
    name: 'Eastern North America',
    bounds: {
      north: 50,
      south: 25,
      east: -65,
      west: -100
    },
    center: { lat: 40, lng: -80 },
    hiddenPostCount: 8,
    isUnlocked: true,
    unlockPrice: 99,
    unlockedBy: 156
  },
  {
    id: 'asia-east',
    name: 'East Asia',
    bounds: {
      north: 50,
      south: 20,
      east: 140,
      west: 100
    },
    center: { lat: 35, lng: 120 },
    hiddenPostCount: 15,
    isUnlocked: false,
    unlockPrice: 149, // $1.49
    unlockedBy: 89
  },
  {
    id: 'australia',
    name: 'Australia & Oceania',
    bounds: {
      north: -10,
      south: -45,
      east: 155,
      west: 110
    },
    center: { lat: -25, lng: 135 },
    hiddenPostCount: 6,
    isUnlocked: false,
    unlockPrice: 79, // $0.79
    unlockedBy: 67
  }
];

export const mockPosts: Post[] = [
  {
    id: 'post-1',
    title: 'Liberty Statue Construction',
    description: 'Rare photo of the Statue of Liberty under construction in 1885',
    imageUrl: '/api/placeholder/400/300',
    location: { lat: 40.6892, lng: -74.0445 },
    timestamp: '1885-06-15T10:00:00Z',
    regionId: 'north-america-east',
    userId: 'user-1',
    userName: 'HistoryBuff92'
  },
  {
    id: 'post-2',
    title: 'Brooklyn Bridge Opening',
    description: 'The grand opening ceremony of Brooklyn Bridge in 1883',
    imageUrl: '/api/placeholder/400/300',
    location: { lat: 40.7061, lng: -73.9969 },
    timestamp: '1883-05-24T14:00:00Z',
    regionId: 'north-america-east',
    userId: 'user-2',
    userName: 'TimeTravel_Explorer'
  },
  {
    id: 'post-3',
    title: 'Central Park in Winter',
    description: 'A peaceful winter scene in Central Park, 1920s',
    imageUrl: '/api/placeholder/400/300',
    location: { lat: 40.7829, lng: -73.9654 },
    timestamp: '1923-12-20T11:30:00Z',
    regionId: 'north-america-east',
    userId: 'user-1',
    userName: 'HistoryBuff92'
  }
];

export const mockUser = {
  id: 'current-user',
  name: 'Explorer',
  email: 'explorer@historybox.com',
  unlockedRegions: ['north-america-east'],
  postsCount: 0,
  achievements: []
};