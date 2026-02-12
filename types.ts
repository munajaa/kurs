
export interface Lesson {
  id: string;
  order: number;
  title: string;
  description: string;
  content: string;
  duration: string;
  category: string;
}

export interface Supplier {
  id: string;
  name: string;
  productName: string;
  imageUrl: string;
  buyLink: string;
  isWhatsApp: boolean;
  description?: string;
}

export interface Announcement {
  id: string;
  date: string;
  title: string;
  message: string;
  imageUrl?: string;
  tag?: string;
}

export interface UsefulItem {
  id: string;
  title: string;
  description: string;
  category: string;
  content: string;
  images?: string[];
  icon?: string;
  link?: string;
}

export interface ProfitEntry {
  id: number;
  user_id: number;
  item_name: string;
  buy_price: number;
  sell_price: number;
  costs: number;
  net_profit: number;
  created_at: string;
}

export interface User {
  id: number;
  email: string;
  role: 'admin' | 'user';
  firstName?: string;
  lastName?: string;
  nickname?: string;
  phone?: string;
  isApproved: boolean;
  completed_lessons?: string[];
}

export interface Channel {
  id: string;
  name: string;
  type: 'public' | 'ticket';
  user_id?: number;
  nickname?: string;
}

export interface Message {
  id: number;
  channel_id: string;
  user_id: number;
  nickname: string;
  email: string;
  role: string;
  content: string;
  created_at: string;
}

export interface UserProgress {
  completedLessonIds: string[];
}

export type View = 'home' | 'lessons' | 'suppliers' | 'announcements' | 'invoices' | 'useful' | 'chat' | 'admin' | 'login' | 'profile';
