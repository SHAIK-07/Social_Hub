import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, uploadFile } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import type { Category } from '../types/database';
import { Image, Loader, FileVideo, MessageSquare, BarChart2 } from 'lucide-react';

type PostType = 'text' | 'photo' | 'video' | 'poll';

interface PollOption {
  text: string;
}

export default function CreatePost() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<PostType>('text');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pollOptions, setPollOptions] = useState<PollOption[]>([
    { text: '' },
    { text: '' },
  ]);
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const loadCategories = async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) {
        setError('Failed to load categories');
        return;
      }

      setCategories(data || []);
      if (data && data.length > 0) {
        setCategoryId(data[0].id);
      }
    };

    loadCategories();
  }, []);

  const handleMediaChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      const preview = URL.createObjectURL(file);
      setMediaPreview(preview);
    }
  };

  const handleAddPollOption = () => {
    setPollOptions([...pollOptions, { text: '' }]);
  };

  const handlePollOptionChange = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index].text = value;
    setPollOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      let mediaUrl = '';
      if (mediaFile) {
        const bucket = postType === 'photo' ? 'posts' : 'videos';
        mediaUrl = await uploadFile(mediaFile, bucket, `${user.id}/${Date.now()}`);
      }

      const postData = {
        title,
        content,
        type: postType,
        image_url: postType === 'photo' ? mediaUrl : null,
        video_url: postType === 'video' ? mediaUrl : null,
        category_id: categoryId,
        user_id: user.id,
      };

      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert([postData])
        .select()
        .single();

      if (postError) throw postError;

      if (postType === 'poll' && post) {
        const { error: pollError } = await supabase.from('polls').insert([
          {
            post_id: post.id,
            question: content,
          },
        ]);

        if (pollError) throw pollError;

        const validOptions = pollOptions.filter((opt) => opt.text.trim());
        if (validOptions.length >= 2) {
          const { error: optionsError } = await supabase
            .from('poll_options')
            .insert(
              validOptions.map((opt) => ({
                poll_id: post.id,
                option_text: opt.text,
              }))
            );

          if (optionsError) throw optionsError;
        }
      }

      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">Create New Post</h2>

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="mb-6">
          <div className="flex space-x-4">
            {[
              { type: 'text', icon: MessageSquare, label: 'Text' },
              { type: 'photo', icon: Image, label: 'Photo' },
              { type: 'video', icon: FileVideo, label: 'Video' },
              { type: 'poll', icon: BarChart2, label: 'Poll' },
            ].map(({ type, icon: Icon, label }) => (
              <button
                key={type}
                onClick={() => setPostType(type as PostType)}
                className={`flex-1 p-4 rounded-lg flex flex-col items-center space-y-2 ${
                  postType === type
                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                    : 'bg-gray-100 text-gray-700 border-2 border-transparent'
                }`}
              >
                <Icon size={24} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter post title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {postType === 'poll' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Poll Question
                </label>
                <input
                  type="text"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your question"
                  required
                />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Options
                </label>
                {pollOptions.map((option, index) => (
                  <input
                    key={index}
                    type="text"
                    value={option.text}
                    onChange={(e) =>
                      handlePollOptionChange(index, e.target.value)
                    }
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={`Option ${index + 1}`}
                    required={index < 2}
                  />
                ))}
                {pollOptions.length < 4 && (
                  <button
                    type="button"
                    onClick={handleAddPollOption}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    + Add Option
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {(postType === 'photo' || postType === 'video') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {postType === 'photo' ? 'Upload Photo' : 'Upload Video'}
                  </label>
                  <input
                    type="file"
                    accept={
                      postType === 'photo' ? 'image/*' : 'video/*'
                    }
                    onChange={handleMediaChange}
                    className="mt-1 block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
                    required
                  />
                  {mediaPreview && postType === 'photo' && (
                    <img
                      src={mediaPreview}
                      alt="Preview"
                      className="mt-4 max-h-64 rounded-lg"
                    />
                  )}
                  {mediaPreview && postType === 'video' && (
                    <video
                      src={mediaPreview}
                      controls
                      className="mt-4 max-h-64 rounded-lg"
                    />
                  )}
                </div>
              )}

              {postType === 'text' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Content
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[200px]"
                    placeholder="Write your post content..."
                    required
                  />
                </div>
              )}
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200 flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader className="animate-spin mr-2" size={20} />
                Creating Post...
              </>
            ) : (
              'Create Post'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}