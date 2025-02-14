import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Post, Category } from '../types/database';
import { ThumbsUp, MessageSquare } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function CategoryFeed() {
  const { slug } = useParams<{ slug: string }>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const loadPosts = async () => {
      setLoading(true);
      try {
        // Get category first
        const { data: categoryData } = await supabase
          .from('categories')
          .select('*')
          .eq('slug', slug)
          .single();

        if (categoryData) {
          setCategory(categoryData);

          // Get posts from trending_posts view for this category
          const { data: postsData } = await supabase
            .from('trending_posts')
            .select(
              `
              *,
              profiles!posts_user_id_fkey (
                id,
                username
              )
            `
            )
            .eq('category_id', categoryData.id)
            .order('likes_count', { ascending: false }) // Order by likes count
            .order('comments_count', { ascending: false }); // Then by comments count

          if (postsData) {
            setPosts(postsData);
          }
        }
      } catch (error) {
        console.error('Error loading posts:', error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      loadPosts();
    }
  }, [slug]);

  const handleLike = async (postId: string) => {
    if (!user) return;

    try {
      const { data: existingLike } = await supabase
        .from('likes')
        .select('*')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

      if (existingLike) {
        await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('likes')
          .insert([{ post_id: postId, user_id: user.id }]);
      }

      // Refresh posts to get updated counts
      const { data: updatedPosts } = await supabase
        .from('trending_posts')
        .select(
          `
          *,
          profiles!posts_user_id_fkey (
            id,
            username
          )
        `
        )
        .eq('category_id', category?.id)
        .order('likes_count', { ascending: false })
        .order('comments_count', { ascending: false });

      if (updatedPosts) {
        setPosts(updatedPosts);
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

  if (!category) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-700">Category not found</h2>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">{category.name}</h1>

      <div className="space-y-6">
        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-white rounded-lg shadow-md overflow-hidden"
          >
            {post.image_url && (
              <img
                src={post.image_url}
                alt={post.title}
                className="w-full h-64 object-cover"
              />
            )}
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-2">{post.title}</h2>
              <p className="text-gray-600 mb-4">{post.content}</p>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleLike(post.id)}
                    className="flex items-center space-x-1 text-gray-600 hover:text-blue-600"
                  >
                    <ThumbsUp size={20} />
                    <span>{post.likes_count || 0}</span>
                  </button>
                  <div className="flex items-center space-x-1">
                    <MessageSquare size={20} />
                    <span>{post.comments_count || 0}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span>Posted by {post.profiles?.username}</span>
                  <span>•</span>
                  <span>{new Date(post.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {posts.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <h3 className="text-xl font-medium text-gray-700">
              No posts in this category yet
            </h3>
          </div>
        )}
      </div>
    </div>
  );
}
