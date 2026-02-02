/**
 * Community Module Types
 */

export interface ForumPost {
  id: string;
  topicId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorBadges?: UserBadge[];
  content: string;
  attachments?: PostAttachment[];
  likes: number;
  isLiked: boolean;
  replies: ForumReply[];
  replyCount: number;
  createdAt: Date;
  updatedAt?: Date;
  isPinned: boolean;
  isLocked: boolean;
}

export interface ForumReply {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  likes: number;
  isLiked: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ForumTopic {
  id: string;
  categoryId: string;
  title: string;
  description?: string;
  postCount: number;
  lastPost?: ForumPost;
  createdAt: Date;
  isPinned: boolean;
  isHot: boolean;
}

export interface ForumCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  topicCount: number;
  postCount: number;
  order: number;
  isRestricted: boolean;
}

export interface PostAttachment {
  id: string;
  type: "image" | "video" | "link";
  url: string;
  thumbnail?: string;
  title?: string;
}

export interface UserBadge {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

export interface PrivateGroup {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  isPrivate: boolean;
  coverImage?: string;
  avatar?: string;
  createdAt: Date;
  lastActivity: Date;
  isMember: boolean;
  isAdmin: boolean;
}

export interface GroupMember {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  role: "admin" | "moderator" | "member";
  joinedAt: Date;
  lastActive: Date;
}

export interface Expert {
  id: string;
  name: string;
  title: string;
  specialties: string[];
  avatar?: string;
  bio: string;
  rating: number;
  questionCount: number;
  responseTime: string;
  isVerified: boolean;
  isAvailable: boolean;
}

export interface ExpertQuestion {
  id: string;
  expertId: string;
  userId: string;
  question: string;
  answer?: string;
  status: "pending" | "answered" | "closed";
  isPrivate: boolean;
  createdAt: Date;
  answeredAt?: Date;
}

export interface CreatorProfile {
  id: string;
  name: string;
  bio: string;
  avatar?: string;
  coverImage?: string;
  followerCount: number;
  contentCount: number;
  rating: number;
  isVerified: boolean;
  socialLinks?: Record<string, string>;
  subscriptionPrice?: number;
}

export interface CreatorContent {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  type: "article" | "video" | "course" | "ebook";
  thumbnail?: string;
  price: number;
  isFree: boolean;
  isPurchased: boolean;
  rating: number;
  purchaseCount: number;
  createdAt: Date;
}

export interface CommunityState {
  categories: ForumCategory[];
  topics: ForumTopic[];
  posts: ForumPost[];
  groups: PrivateGroup[];
  experts: Expert[];
  creators: CreatorProfile[];
  notifications: CommunityNotification[];
  isLoading: boolean;
  error: string | null;
}

export interface CommunityNotification {
  id: string;
  type: "reply" | "like" | "mention" | "follow" | "answer";
  title: string;
  message: string;
  link: string;
  isRead: boolean;
  createdAt: Date;
}
