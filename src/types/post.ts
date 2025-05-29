
export interface Post {
  id: string;
  authorId: string;
  content: string;
  type: 'progress' | 'workout' | 'diet' | 'general';
  images: string[];
  videos: string[];
  likes: string[];
  comments: Comment[];
  createdAt: Date;
  author: {
    id: string;
    name: string;
    avatar: string;
    role: string;
  };
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: Date;
}
