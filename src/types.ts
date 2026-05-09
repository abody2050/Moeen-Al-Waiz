import { ReactNode } from 'react';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export type Section = 'home' | 'sermon' | 'exhortation' | 'lesson' | 'reflection' | 'story';
export type FontStyle = 'lateef' | 'amiri' | 'tajawal' | 'cairo' | 'vazir' | 'scheherazade';

export interface SavedContent {
  id: string;
  title: string;
  type: Section;
  content: string;
  date: string;
  userId: string;
  preacherName?: string;
  duration?: number;
  instructions?: string;
  createdAt?: any; 
  updatedAt?: any;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string | null;
  idNumber: string;
  createdAt: any;
  setupComplete?: boolean;
  settings: {
    fontStyle: FontStyle;
    fontSize: number;
    lineHeight: number;
    isDarkMode: boolean;
  };
}

export interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export interface SectionConfig {
  title: string;
  text: string;
  icon: ReactNode;
  label: string;
}
