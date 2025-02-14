export interface Profile {
  id: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  full_name?: string;
  date_of_birth?: string;
  interests?: string[];
  followers_count?: number;
  following_count?: number;
  is_following?: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'photo' | 'video' | 'poll';
  image_url?: string;
  video_url?: string;
  user_id: string;
  category_id: string;
  created_at: string;
  profiles?: Profile;
  category?: Category;
  likes_count?: number;
  comments_count?: number;
  user_has_liked?: boolean;
  poll?: Poll;
}

export interface Poll {
  id: string;
  question: string;
  post_id: string;
  created_at: string;
  options: PollOption[];
}

export interface PollOption {
  id: string;
  poll_id: string;
  option_text: string;
  created_at: string;
  votes_count?: number;
  user_has_voted?: boolean;
}

export interface Comment {
  id: string;
  content: string;
  user_id: string;
  post_id: string;
  created_at: string;
  profiles?: Profile;
}

export interface Like {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
}

export interface Follower {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}
