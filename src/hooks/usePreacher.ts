import { useState, useEffect } from 'react';
import { auth, signInWithGoogle, handleRedirectResponse } from '../lib/firebase';
import { dbService } from '../services/dbService';
import { UserProfile, SavedContent, FontStyle } from '../types';
import { onAuthStateChanged, User } from 'firebase/auth';

export const usePreacher = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [sermons, setSermons] = useState<SavedContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle redirect result on mount
    handleRedirectResponse();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        let userProfile = await dbService.getUserProfile(firebaseUser.uid);
        
        if (!userProfile) {
          // New user setup
          const newId = Math.floor(10000 + Math.random() * 90000).toString();
          userProfile = {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || 'واعظ',
            email: firebaseUser.email,
            idNumber: newId,
            createdAt: new Date().toISOString(),
            setupComplete: false,
            settings: {
              fontStyle: 'lateef',
              fontSize: 16,
              lineHeight: 1.6,
              isDarkMode: false
            }
          };
          await dbService.saveUserProfile(userProfile);
        }
        setProfile(userProfile);
        const userSermons = await dbService.getUserSermons(firebaseUser.uid);
        setSermons(userSermons);
      } else {
        setUser(null);
        setProfile(null);
        setSermons([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!profile) return;
    const newProfile = { ...profile, ...updates };
    setProfile(newProfile);
    await dbService.saveUserProfile(newProfile);
  };

  const addSermon = async (sermon: SavedContent) => {
    await dbService.saveSermon(sermon);
    setSermons(prev => [sermon, ...prev]);
  };

  const deleteSermon = async (id: string) => {
    await dbService.deleteSermon(id);
    setSermons(prev => prev.filter(s => s.id !== id));
  };

  return {
    user,
    profile,
    sermons,
    loading,
    signInWithGoogle,
    updateProfile,
    addSermon,
    deleteSermon
  };
};
