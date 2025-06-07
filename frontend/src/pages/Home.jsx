import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Nav from '../components/nav.jsx';
import PostItem from '../components/PostItem';
import { AuthDataContext } from '../context/AuthContext';
import { io } from 'socket.io-client';
import defaultProfilePic from '../assets/dp.webp';
function Home() {
  const { serverUrl, currentUser, token } = useContext(AuthDataContext);

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [postText, setPostText] = useState('');
  const [postImage, setPostImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fileInputRef = useRef(null);

  // Set up axios with auth token
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, [token]);

  // Fetch posts for the feed
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${serverUrl}/api/posts?page=${page}&limit=10`);

        if (page === 1) {
          setPosts(response.data.posts);
        } else {
          setPosts(prev => [...prev, ...response.data.posts]);
        }

        setHasMore(page < response.data.totalPages);
      } catch (err) {
        console.error('Error fetching posts:', err);
        setError('Failed to load posts');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [serverUrl, page]);

  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPostImage(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle post submission
  const handleSubmitPost = async (e) => {
    e.preventDefault();

    if (!postText.trim() && !postImage) {
      setError('Please add some text or an image to your post');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const formData = new FormData();
      formData.append('userId', currentUser._id);
      formData.append('text', postText);

      if (postImage) {
        formData.append('image', postImage);
      }

      const response = await axios.post(`${serverUrl}/api/posts`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Add new post to state
      setPosts(prev => [response.data, ...prev]);

      // Reset form
      setPostText('');
      setPostImage(null);
      setImagePreview('');
    } catch (err) {
      console.error('Error creating post:', err);
      setError(err.response?.data?.message || 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };



  // Load more posts
  const loadMorePosts = () => {
    if (hasMore && !loading) {
      setPage(prev => prev + 1);
    }
  };



  // Socket.io connection
  useEffect(() => {
    // Only connect if user is logged in
    if (!currentUser) return;

    const socket = io(serverUrl);

    // Join user's room for private messages and notifications
    socket.emit('join', currentUser._id);

    // Listen for new posts
    socket.on('new_post', (newPost) => {
      // Only add if it's not already in the list
      setPosts(prev => {
        if (prev.some(p => p._id === newPost._id)) return prev;
        return [newPost, ...prev];
      });
    });

    // Listen for post updates
    socket.on('update_post', (updatedPost) => {
      setPosts(prev =>
        prev.map(post => post._id === updatedPost._id ? updatedPost : post)
      );
    });

    // Listen for post deletions
    socket.on('delete_post', (deletedPostId) => {
      setPosts(prev => prev.filter(post => post._id !== deletedPostId));
    });

    return () => {
      socket.disconnect();
    };
  }, [currentUser, serverUrl]);

  return (
    <div className="min-h-screen bg-gray-100">
      <Nav />
      <div className="max-w-2xl mx-auto py-6 sm:px-6 lg:px-8 pt-20">
        {/* Create post card */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="p-4">
            <div className="flex items-start space-x-3">
              <img
                src={
                  currentUser?.profileImage ? (
                    currentUser.profileImage.startsWith('http') ?
                      currentUser.profileImage :
                      `${serverUrl}${currentUser.profileImage}`
                  ) : (
                    defaultProfilePic
                  )
                }
                alt="Profile"
                className="h-10 w-10 rounded-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = defaultProfilePic;
                }}
              />
              <div className="min-w-0 flex-1">
                <form onSubmit={handleSubmitPost}>
                  <div>
                    <textarea
                      rows={3}
                      name="postText"
                      id="postText"
                      value={postText}
                      onChange={(e) => setPostText(e.target.value)}
                      className="shadow-sm block w-full focus:ring-blue-500 focus:border-blue-500 sm:text-sm border border-gray-300 rounded-md"
                      placeholder="What's on your mind?"
                    />
                  </div>

                  {imagePreview && (
                    <div className="mt-3 relative">
                      <img
                        src={imagePreview}
                        alt="Post preview"
                        className="max-h-60 rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPostImage(null);
                          setImagePreview('');
                        }}
                        className="absolute top-2 right-2 bg-gray-800 bg-opacity-75 text-white rounded-full p-1"
                      >
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  )}

                  {error && (
                    <div className="mt-2 text-sm text-red-600">{error}</div>
                  )}

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current.click()}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                        Photo
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submitting || (!postText.trim() && !postImage)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                    >
                      {submitting ? 'Posting...' : 'Post'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Posts feed */}
        {loading && posts.length === 0 ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <p className="text-gray-500">No posts yet. Be the first to post!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <PostItem
                key={post._id}
                post={post}
                onDelete={(postId) => {
                  setPosts(prev => prev.filter(p => p._id !== postId));
                }}
                onUpdate={(updatedPost) => {
                  setPosts(prev =>
                    prev.map(p => p._id === updatedPost._id ? updatedPost : p)
                  );
                }}
              />
            ))}

            {/* Load more button */}
            {hasMore && (
              <div className="flex justify-center">
                <button
                  onClick={loadMorePosts}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-blue-500 rounded-full"></div>
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Home