import React, { useState, useContext, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';
import { AuthDataContext } from '../context/AuthContext';
import defaultProfilePic from '../assets/dp.webp';

const PostItem = ({ post, onDelete, onUpdate }) => {
  const { serverUrl, currentUser } = useContext(AuthDataContext);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(post.text || '');
  const [editImage, setEditImage] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef(null);

  // Handle image selection for edit
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditImage(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle post update
  const handleUpdatePost = async (e) => {
    e.preventDefault();

    if (!editText.trim() && !editImage && !post.image) {
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append('userId', currentUser._id);
      formData.append('text', editText);

      if (editImage) {
        formData.append('image', editImage);
      }

      const response = await axios.put(`${serverUrl}/api/posts/${post._id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Call the onUpdate callback with the updated post
      onUpdate(response.data);

      // Reset edit state
      setIsEditing(false);
      setEditImage(null);
      setEditImagePreview('');
    } catch (err) {
      console.error('Error updating post:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle post deletion
  const handleDeletePost = async () => {
    try {
      await axios.delete(`${serverUrl}/api/posts/${post._id}`, {
        data: { userId: currentUser._id }
      });

      // Call the onDelete callback with the post id
      onDelete(post._id);
    } catch (err) {
      console.error('Error deleting post:', err);
    }
  };

  // Handle like/unlike post
  const handleLikePost = async () => {
    try {
      const response = await axios.post(`${serverUrl}/api/posts/${post._id}/like`, {
        userId: currentUser._id
      });

      // Call the onUpdate callback with the updated post
      const updatedPost = {
        ...post,
        likes: response.data.isLiked
          ? [...post.likes, currentUser._id]
          : post.likes.filter(id => id !== currentUser._id)
      };

      onUpdate(updatedPost);
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  // Handle comment submission
  const handleAddComment = async (e) => {
    e.preventDefault();

    if (!commentText.trim()) return;

    try {
      const response = await axios.post(`${serverUrl}/api/posts/${post._id}/comments`, {
        userId: currentUser._id,
        text: commentText.trim()
      });

      // Call the onUpdate callback with the updated post
      const updatedPost = {
        ...post,
        comments: [...post.comments, response.data]
      };

      onUpdate(updatedPost);
      setCommentText('');
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  // Handle comment deletion
  const handleDeleteComment = async (commentId) => {
    try {
      await axios.delete(`${serverUrl}/api/posts/${post._id}/comments/${commentId}`, {
        data: { userId: currentUser._id }
      });

      // Call the onUpdate callback with the updated post
      const updatedPost = {
        ...post,
        comments: post.comments.filter(comment => comment._id !== commentId)
      };

      onUpdate(updatedPost);
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  // Format date using moment.js
  const formatDate = (dateString) => {
    return moment(dateString).fromNow();
  };

  // Check if the current user is the post owner
  const isPostOwner = currentUser && post.user && post.user._id === currentUser._id;

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* Post header */}
      <div className="p-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <img
              className="h-10 w-10 rounded-full object-cover"
              src={
                post.user?.profileImage ? (
                  post.user.profileImage.startsWith('http') ?
                    post.user.profileImage :
                    `${serverUrl}${post.user.profileImage}`
                ) : (
                  defaultProfilePic
                )
              }
              alt={`${post.user?.firstName} ${post.user?.lastName}`}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = defaultProfilePic;
              }}
            />
            <div className="ml-3">
              <Link to={`/profile/${post.user?._id}`} className="text-sm font-medium text-gray-900 hover:underline">
                {post.user?.firstName} {post.user?.lastName}
              </Link>
              <p className="text-xs text-gray-500">
                {post.user?.headline || 'LinkedIn Member'} • {formatDate(post.createdAt)}
              </p>
            </div>
          </div>

          {isPostOwner && (
            <div className="relative">
              <button
                onClick={() => setShowOptions(!showOptions)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>

              {showOptions && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setEditText(post.text || '');
                        setShowOptions(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Edit Post
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this post?')) {
                          handleDeletePost();
                        }
                        setShowOptions(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      Delete Post
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Post content */}
      {isEditing ? (
        <div className="px-4 sm:px-6 pb-4">
          <form onSubmit={handleUpdatePost}>
            <textarea
              rows={3}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="shadow-sm block w-full focus:ring-blue-500 focus:border-blue-500 sm:text-sm border border-gray-300 rounded-md mb-3"
              placeholder="What's on your mind?"
            />

            {editImagePreview ? (
              <div className="mt-3 relative">
                <img
                  src={editImagePreview}
                  alt="Post preview"
                  className="max-h-60 rounded-md"
                />
                <button
                  type="button"
                  onClick={() => {
                    setEditImage(null);
                    setEditImagePreview('');
                  }}
                  className="absolute top-2 right-2 bg-gray-800 bg-opacity-75 text-white rounded-full p-1"
                >
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ) : post.image && !editImage ? (
              <div className="mt-3 relative">
                <img
                  src={`${serverUrl}${post.image}`}
                  alt="Current post image"
                  className="max-h-60 rounded-md"
                />
                <button
                  type="button"
                  onClick={() => {
                    // This would require a backend endpoint to remove just the image
                    // For now, we'll just mark it for removal on save
                    setEditImage(null);
                    setEditImagePreview('');
                  }}
                  className="absolute top-2 right-2 bg-gray-800 bg-opacity-75 text-white rounded-full p-1"
                >
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ) : null}

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
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || (!editText.trim() && !editImage && !post.image)}
                  className="inline-flex items-center px-4 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                >
                  {submitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : (
        <div className="px-4 sm:px-6 pb-2">
          {post.text && (
            <p className="text-gray-800 whitespace-pre-line">{post.text}</p>
          )}
          {post.image && (
            <div className="mt-3">
              <img
                src={`${serverUrl}${post.image}`}
                alt="Post attachment"
                className="max-h-96 w-auto rounded-md"
              />
            </div>
          )}
        </div>
      )}

      {/* Post stats */}
      <div className="px-4 sm:px-6 py-2 border-t border-gray-200">
        <div className="flex justify-between text-xs text-gray-500">
          <div>
            {post.likes.length > 0 && (
              <span>{post.likes.length} {post.likes.length === 1 ? 'like' : 'likes'}</span>
            )}
          </div>
          <div>
            {post.comments.length > 0 && (
              <button
                onClick={() => setShowComments(!showComments)}
                className="hover:underline"
              >
                {post.comments.length} {post.comments.length === 1 ? 'comment' : 'comments'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Post actions */}
      <div className="px-4 sm:px-6 py-2 border-t border-gray-200">
        <div className="flex justify-between">
          <button
            onClick={handleLikePost}
            className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md ${
              post.likes.includes(currentUser?._id) ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'
            }`}
          >
            <svg className="mr-1.5 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
            </svg>
            Like
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 rounded-md hover:text-blue-600"
          >
            <svg className="mr-1.5 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
            </svg>
            Comment
          </button>
          <button
            className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 rounded-md hover:text-blue-600"
          >
            <svg className="mr-1.5 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
            </svg>
            Share
          </button>
        </div>
      </div>

      {/* Comments section */}
      {showComments && post.comments.length > 0 && (
        <div className="px-4 sm:px-6 py-2 border-t border-gray-200 bg-gray-50">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Comments</h3>
          <div className="space-y-3">
            {post.comments.map((comment) => (
              <div key={comment._id} className="flex items-start space-x-3">
                <img
                  className="h-8 w-8 rounded-full object-cover"
                  src={
                    comment.user?.profileImage ? (
                      comment.user.profileImage.startsWith('http') ?
                        comment.user.profileImage :
                        `${serverUrl}${comment.user.profileImage}`
                    ) : (
                      defaultProfilePic
                    )
                  }
                  alt={`${comment.user?.firstName} ${comment.user?.lastName}`}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = defaultProfilePic;
                  }}
                />
                <div className="bg-white rounded-lg px-3 py-2 flex-1">
                  <div className="flex items-center justify-between">
                    <Link to={`/profile/${comment.user?._id}`} className="text-xs font-medium text-gray-900 hover:underline">
                      {comment.user?.firstName} {comment.user?.lastName}
                    </Link>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                      {(currentUser?._id === comment.user?._id || currentUser?._id === post.user?._id) && (
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this comment?')) {
                              handleDeleteComment(comment._id);
                            }
                          }}
                          className="text-xs text-gray-400 hover:text-red-500"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-800 mt-1">{comment.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add comment form */}
      <div className="px-4 sm:px-6 py-3 border-t border-gray-200">
        <form
          onSubmit={handleAddComment}
          className="flex items-center space-x-2"
        >
          <img
            className="h-8 w-8 rounded-full object-cover"
            src={
              currentUser?.profileImage ? (
                currentUser.profileImage.startsWith('http') ?
                  currentUser.profileImage :
                  `${serverUrl}${currentUser.profileImage}`
              ) : (
                defaultProfilePic
              )
            }
            alt="Your profile"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = defaultProfilePic;
            }}
          />
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="flex-1 min-w-0 block w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Add a comment..."
          />
          <button
            type="submit"
            disabled={!commentText.trim()}
            className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
          >
            Post
          </button>
        </form>
      </div>
    </div>
  );
};

export default PostItem;
