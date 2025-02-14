import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { Heart, MessageSquare, UserPlus } from 'lucide-react';

interface Activity {
  id: string;
  type: 'like' | 'comment' | 'follow';
  created_at: string;
  actor: {
    id: string;
    username: string;
  };
  post?: {
    id: string;
    title: string;
  };
}

export default function Activity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const loadActivities = async () => {
      if (!user) return;

      try {
        const [likes, comments, follows] = await Promise.all([
          supabase
            .from('likes')
            .select(
              `
              id,
              created_at,
              profiles!likes_user_id_fkey (id, username),
              posts (id, title)
            `
            )
            .eq('posts.user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10),

          supabase
            .from('comments')
            .select(
              `
              id,
              created_at,
              profiles!comments_user_id_fkey (id, username),
              posts (id, title)
            `
            )
            .eq('posts.user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10),

          supabase
            .from('followers')
            .select(
              `
              id,
              created_at,
              profiles!followers_follower_id_fkey (id, username)
            `
            )
            .eq('following_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10),
        ]);

        const allActivities = [
          ...(likes.data?.map((like) => ({
            id: like.id,
            type: 'like' as const,
            created_at: like.created_at,
            actor: like.profiles,
            post: like.posts,
          })) || []),
          ...(comments.data?.map((comment) => ({
            id: comment.id,
            type: 'comment' as const,
            created_at: comment.created_at,
            actor: comment.profiles,
            post: comment.posts,
          })) || []),
          ...(follows.data?.map((follow) => ({
            id: follow.id,
            type: 'follow' as const,
            created_at: follow.created_at,
            actor: follow.profiles,
          })) || []),
        ].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setActivities(allActivities);
      } catch (error) {
        console.error('Error loading activities:', error);
      } finally {
        setLoading(false);
      }
    };

    loadActivities();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-20 lg:pb-0">
      <h1 className="text-2xl font-bold mb-6">Activity</h1>

      <div className="bg-white rounded-lg shadow-md divide-y">
        {activities.map((activity) => (
          <div key={activity.id} className="p-4 flex items-center space-x-4">
            <div className="flex-shrink-0">
              {activity.type === 'like' && (
                <Heart className="text-red-500" size={24} />
              )}
              {activity.type === 'comment' && (
                <MessageSquare className="text-blue-500" size={24} />
              )}
              {activity.type === 'follow' && (
                <UserPlus className="text-green-500" size={24} />
              )}
            </div>

            <div className="flex-1">
              <Link
                to={`/profile/${activity.actor.id}`}
                className="font-medium text-blue-600 hover:underline"
              >
                {activity.actor.username}
              </Link>{' '}
              {activity.type === 'like' && (
                <>
                  liked your post{' '}
                  <Link
                    to={`/post/${activity.post?.id}`}
                    className="text-gray-600 hover:underline"
                  >
                    {activity.post?.title}
                  </Link>
                </>
              )}
              {activity.type === 'comment' && (
                <>
                  commented on your post{' '}
                  <Link
                    to={`/post/${activity.post?.id}`}
                    className="text-gray-600 hover:underline"
                  >
                    {activity.post?.title}
                  </Link>
                </>
              )}
              {activity.type === 'follow' && 'started following you'}
            </div>

            <span className="text-sm text-gray-500">
              {new Date(activity.created_at).toLocaleDateString()}
            </span>
          </div>
        ))}

        {activities.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No activity to show yet
          </div>
        )}
      </div>
    </div>
  );
}
