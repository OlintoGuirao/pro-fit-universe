
export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  images?: string[];
  videos?: string[];
  likes: string[]; // array de user IDs
  comments: Comment[];
  createdAt: Date;
  type: 'progress' | 'workout' | 'diet' | 'general';
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: Date;
}
