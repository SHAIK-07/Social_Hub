import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Profile, Post } from '../types/database';
import { useAuthStore } from '../store/authStore';
import {
  User,
  Calendar,
  UserPlus,
  UserMinus,
  Edit,
  Camera,
  Trash2,
  X,
  Save,
  Heart,
  MessageSquare,
} from 'lucide-react';
import { uploadFile } from '../lib/supabase';

const CATEGORIES = [
  { id: 'politics', name: 'Politics' },
  { id: 'entertainment', name: 'Entertainment' },
  { id: 'sports', name: 'Sports' },
  { id: 'technology', name: 'Technology' },
  { id: 'fashion', name: 'Fashion' },
  { id: 'science', name: 'Science' },
  { id: 'health', name: 'Health' },
  { id: 'business', name: 'Business' },
];

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const currentUser = useAuthStore((state) => state.user);
  const isOwnProfile = currentUser?.id === id;

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    bio: '',
    dateOfBirth: '',
    avatarUrl: '',
    interests: [] as string[],
  });

  useEffect(() => {
    const loadProfile = async () => {
      if (!id) return;

      try {
        // Load profile data
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();

        if (profileData) {
          setProfile(profileData);
          setFormData({
            fullName: profileData.full_name || '',
            username: profileData.username || '',
            bio: profileData.bio || '',
            dateOfBirth: profileData.date_of_birth || '',
            avatarUrl: profileData.avatar_url || '',
            interests: profileData.interests || [],
          });

          // Load followers count
          const { count: followers } = await supabase
            .from('followers')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', id);

          // Load following count
          const { count: following } = await supabase
            .from('followers')
            .select('*', { count: 'exact', head: true })
            .eq('follower_id', id);

          setFollowersCount(followers || 0);
          setFollowingCount(following || 0);

          // Check if current user is following this profile
          if (currentUser) {
            const { data: followData } = await supabase
              .from('followers')
              .select('*')
              .eq('follower_id', currentUser.id)
              .eq('following_id', id)
              .maybeSingle();

            setIsFollowing(!!followData);
          }
        }

        // Load posts
        const { data: postsData } = await supabase
          .from('posts')
          .select(
            `
            *,
            category:categories(*),
            likes(count),
            comments(count)
          `
          )
          .eq('user_id', id)
          .order('created_at', { ascending: false });

        if (postsData) {
          const postsWithCounts = postsData.map((post) => ({
            ...post,
            likes_count: post.likes?.[0]?.count || 0,
            comments_count: post.comments?.[0]?.count || 0,
          }));
          setPosts(postsWithCounts);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [id, currentUser]);

  const handleFollow = async () => {
    if (!currentUser || !profile) return;

    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('followers')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', profile.id);

        if (error) throw error;
        setFollowersCount((prev) => prev - 1);
        setIsFollowing(false);
      } else {
        const { error } = await supabase.from('followers').insert([
          {
            follower_id: currentUser.id,
            following_id: profile.id,
          },
        ]);

        if (error) throw error;
        setFollowersCount((prev) => prev + 1);
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const handleUpdateProfile = async () => {
    if (!profile) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: formData.username,
          full_name: formData.fullName,
          bio: formData.bio,
          date_of_birth: formData.dateOfBirth,
          avatar_url: formData.avatarUrl,
          interests: formData.interests,
        })
        .eq('id', profile.id);

      if (error) throw error;

      setProfile((prev) => ({
        ...prev!,
        username: formData.username,
        full_name: formData.fullName,
        bio: formData.bio,
        date_of_birth: formData.dateOfBirth,
        avatar_url: formData.avatarUrl,
        interests: formData.interests,
      }));
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const { error } = await supabase.from('posts').delete().eq('id', postId);

      if (error) throw error;

      setPosts(posts.filter((post) => post.id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleInterestToggle = (categoryId: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(categoryId)
        ? prev.interests.filter((id) => id !== categoryId)
        : [...prev.interests, categoryId],
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-700">Profile not found</h2>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        {editing ? (
          <div className="space-y-6">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {formData.avatarUrl ? (
                    <img
                      src={formData.avatarUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Camera size={40} className="text-gray-400" />
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        const url = await uploadFile(file, 'avatars', profile.id);
                        setFormData((prev) => ({
                          ...prev,
                          avatarUrl: url,
                        }));
                      } catch (error) {
                        console.error('Error uploading avatar:', error);
                      }
                    }
                  }}
                  className="mt-2 block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, fullName: e.target.value }))
                }
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                type="text"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.username}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, username: e.target.value }))
                }
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Bio
              </label>
              <textarea
                rows={3}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.bio}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, bio: e.target.value }))
                }
              />
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Date of Birth
              </label>
              <input
                type="date"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                value={formData.dateOfBirth}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    dateOfBirth: e.target.value,
                  }))
                }
              />
            </div>

            {/* Interests */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interests
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleInterestToggle(category.id)}
                    className={`p-3 rounded-lg text-sm font-medium ${
                      formData.interests.includes(category.id)
                        ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                        : 'bg-gray-100 text-gray-700 border-2 border-transparent'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleUpdateProfile}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Save size={20} className="mr-2" />
                Save Changes
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setFormData({
                    fullName: profile.full_name || '',
                    username: profile.username || '',
                    bio: profile.bio || '',
                    dateOfBirth: profile.date_of_birth || '',
                    avatarUrl: profile.avatar_url || '',
                    interests: profile.interests || [],
                  });
                }}
                className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                <X size={20} className="mr-2" />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.username}
                      className="w-32 h-32 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="text-blue-600" size={48} />
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold">
                    {profile.full_name || profile.username}
                  </h1>
                  <div className="flex items-center space-x-4 mt-2 text-gray-600">
                    <span>
                      <strong>{posts.length}</strong> posts
                    </span>
                    <span>
                      <strong>{followersCount}</strong> followers
                    </span>
                    <span>
                      <strong>{followingCount}</strong> following
                    </span>
                  </div>
                  <div className="flex items-center text-gray-500 text-sm mt-2">
                    <Calendar size={16} className="mr-1" />
                    <span>
                      {profile.date_of_birth
                        ? `Born ${new Date(
                            profile.date_of_birth
                          ).toLocaleDateString()}`
                        : `Joined ${new Date(
                            profile.created_at
                          ).toLocaleDateString()}`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                {isOwnProfile ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
                  >
                    <Edit size={20} />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  currentUser && (
                    <button
                      onClick={handleFollow}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                        isFollowing
                          ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {isFollowing ? (
                        <>
                          <UserMinus size={20} />
                          <span>Unfollow</span>
                        </>
                      ) : (
                        <>
                          <UserPlus size={20} />
                          <span>Follow</span>
                        </>
                      )}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="mb-6">
              <h2 className="font-semibold mb-2">Bio</h2>
              <p className="text-gray-600">
                {profile.bio || 'No bio provided yet.'}
              </p>
            </div>

            {profile.interests && profile.interests.length > 0 && (
              <div>
                <h2 className="font-semibold mb-2">Interests</h2>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest) => (
                    <span
                      key={interest}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {CATEGORIES.find((cat) => cat.id === interest)?.name ||
                        interest}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <h2 className="text-2xl font-bold mb-4">Posts</h2>
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
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold">{post.title}</h3>
                {isOwnProfile && (
                  <button
                    onClick={() => handleDeletePost(post.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
              <p className="text-gray-600 mb-4">{post.content}</p>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>in {post.category?.name}</span>
                <div className="flex items-center space-x-4">
                  <span className="flex items-center">
                    <Heart size={16} className="mr-1 text-red-500" />
                    {post.likes_count}
                  </span>
                  <span className="flex items-center">
                    <MessageSquare size={16} className="mr-1 text-blue-500" />
                    {post.comments_count}
                  </span>
                  <span>{new Date(post.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {posts.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <h3 className="text-xl font-medium text-gray-700">No posts yet</h3>
          </div>
        )}
      </div>
    </div>
  );
}