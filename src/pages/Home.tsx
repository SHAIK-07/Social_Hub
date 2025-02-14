import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Category, Post } from '../types/database';
import { useAuthStore } from '../store/authStore';
import {
  Newspaper,
  Film,
  Dumbbell,
  Laptop,
  Shirt,
  FlaskRound as Flask,
  Heart,
  Building2,
  MessageSquare,
} from 'lucide-react';
import CommentSection from '../components/CommentSection';

const categoryIcons: Record<string, React.ReactNode> = {
  politics: <Newspaper className="text-blue-600" size={24} />,
  entertainment: <Film className="text-purple-600" size={24} />,
  sports: <Dumbbell className="text-green-600" size={24} />,
  technology: <Laptop className="text-gray-600" size={24} />,
  fashion: <Shirt className="text-pink-600" size={24} />,
  science: <Flask className="text-indigo-600" size={24} />,
  health: <Heart className="text-red-600" size={24} />,
  business: <Building2 className="text-orange-600" size={24} />,
};

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedType, setFeedType] = useState<'following' | 'trending'>(
    'following'
  );
  const { user } = useAuthStore();
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showComments, setShowComments] = useState(false);

  const loadPosts = async () => {
    try {
      // Load posts based on feed type
      const { data: postsData } = await supabase
        .from(feedType === 'following' ? 'following_posts' : 'trending_posts')
        .select(
          `
          *,
          profiles!posts_user_id_fkey (
            id,
            username,
            avatar_url
          ),
          categories!posts_category_id_fkey (
            id,
            name
          )
        `
        )
        .limit(20);

      if (postsData) {
        // Get likes and comments for each post
        const postsWithInteractions = await Promise.all(
          postsData.map(async (post) => {
            const [
              { count: likesCount },
              { count: commentsCount },
              { data: userLike },
            ] = await Promise.all([
              supabase
                .from('likes')
                .select('*', { count: 'exact', head: true })
                .eq('post_id', post.id),
              supabase
                .from('comments')
                .select('*', { count: 'exact', head: true })
                .eq('post_id', post.id),
              user
                ? supabase
                    .from('likes')
                    .select('*')
                    .eq('post_id', post.id)
                    .eq('user_id', user.id)
                    .maybeSingle()
                : Promise.resolve({ data: null }),
            ]);

            return {
              ...post,
              likes_count: likesCount || 0,
              comments_count: commentsCount || 0,
              user_has_liked: !!userLike,
            };
          })
        );

        setPosts(postsWithInteractions);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load categories
        const { data: categoriesData } = await supabase
          .from('categories')
          .select('*')
          .order('name');

        if (categoriesData) {
          setCategories(categoriesData);
        }

        await loadPosts();
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, [feedType, user]);

  const handleLike = async (postId: string) => {
    if (!user) return;

    try {
      const post = posts.find((p) => p.id === postId);
      if (!post) return;

      if (post.user_has_liked) {
        await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        setPosts(
          posts.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  likes_count: (p.likes_count || 0) - 1,
                  user_has_liked: false,
                }
              : p
          )
        );
      } else {
        await supabase
          .from('likes')
          .insert([{ post_id: postId, user_id: user.id }]);

        setPosts(
          posts.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  likes_count: (p.likes_count || 0) + 1,
                  user_has_liked: true,
                }
              : p
          )
        );
      }
    } catch (error) {
      console.error('Error handling like:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 lg:pb-0">
      <section>
        <h2 className="text-2xl font-bold mb-4">Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/category/${category.slug}`}
              className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition duration-200"
            >
              <div className="flex items-center space-x-3">
                {categoryIcons[category.slug.toLowerCase()]}
                <span className="font-medium">{category.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Posts</h2>
          <div className="flex space-x-4">
            <button
              onClick={() => setFeedType('following')}
              className={`px-4 py-2 rounded-lg ${
                feedType === 'following'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Following
            </button>
            <button
              onClick={() => setFeedType('trending')}
              className={`px-4 py-2 rounded-lg ${
                feedType === 'trending'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Trending
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center space-x-3 mb-4">
                {post.profiles?.avatar_url ? (
                  <img
                    src={post.profiles.avatar_url}
                    alt={post.profiles.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-200 rounded-full" />
                )}
                <Link
                  to={`/profile/${post.profiles?.id}`}
                  className="font-medium hover:underline"
                >
                  {post.profiles?.username}
                </Link>
              </div>

              {post.image_url && (
                <img
                  src={post.image_url}
                  alt={post.title}
                  className="w-full h-96 object-cover rounded-lg mb-4"
                />
              )}
              <h3 className="text-xl font-semibold mb-2">{post.title}</h3>
              <p className="text-gray-600 mb-4">
                {post.content.length > 200
                  ? `${post.content.substring(0, 200)}...`
                  : post.content}
              </p>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center space-x-1 transition-colors ${
                      post.user_has_liked
                        ? 'text-red-500'
                        : 'text-gray-500 hover:text-red-500'
                    }`}
                  >
                    <Heart
                      size={16}
                      className={post.user_has_liked ? 'fill-current' : ''}
                    />
                    <span>{post.likes_count || 0} likes</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedPost(post);
                      setShowComments(true);
                    }}
                    className="flex items-center space-x-1 text-gray-500 hover:text-blue-500"
                  >
                    <MessageSquare size={16} />
                    <span>{post.comments_count || 0} comments</span>
                  </button>
                  <span>in {post.categories?.name}</span>
                </div>
                <span>{new Date(post.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}

          {posts.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-medium text-gray-700">
                {feedType === 'following'
                  ? "You're not following anyone yet"
                  : 'No posts yet'}
              </h3>
            </div>
          )}
        </div>
      </section>

      {/* Comments Modal */}
      {selectedPost && (
        <CommentSection
          postId={selectedPost.id}
          isOpen={showComments}
          onClose={() => {
            setShowComments(false);
            setSelectedPost(null);
          }}
          onCommentAdded={() => {
            loadPosts();
          }}
        />
      )}
    </div>
  );
}
