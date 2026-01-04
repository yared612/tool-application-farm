// src/types/index.ts
import { Timestamp } from 'firebase/firestore';

export type Role = 'admin' | 'user';

export interface BaseEntity {
  id: string;
  createdAt?: Timestamp;
}

export interface User extends BaseEntity {
  username: string;
  password?: string;
  description?: string;
  role: Role;
}

export interface Group extends BaseEntity {
  name: string;
  memberIds: string[];
}

export interface Category extends BaseEntity {
  name: string;
  description: string;
  allowedUsers: string[];
  allowedGroups: string[];
}

export interface Tool extends BaseEntity {
  name: string;
  categoryId: string;
  allowedUsers: string[];
  allowedGroups: string[];
  type?: 'code' | 'url' | 'url_new_tab';
  code?: string;
  url?: string;
}

export interface Column<T> {
  label: string;
  key: keyof T;
  render?: (value: any, item: T) => React.ReactNode;
}