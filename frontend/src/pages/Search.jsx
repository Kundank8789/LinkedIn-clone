import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Nav from '../components/nav.jsx';
import { AuthDataContext } from '../context/AuthContext';

const Search = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { serverUrl } = useContext(AuthDataContext);

  // Get search query from URL
  const queryParams = new URLSearchParams(location.search);
  const initialQuery = queryParams.get('q') || '';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState('all');
  const [results, setResults] = useState({
    users: [],
    posts: [],
    jobs: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Perform search when query or tab changes
  useEffect(() => {
    if (!initialQuery) return;

    const performSearch = async () => {
      try {
        setLoading(true);
        setError('');

        let endpoint;
        if (activeTab === 'all') {
          endpoint = `${serverUrl}/api/search/global?query=${encodeURIComponent(initialQuery)}`;
        } else {
          endpoint = `${serverUrl}/api/search/${activeTab}?query=${encodeURIComponent(initialQuery)}`;
        }

        const response = await axios.get(endpoint);

        if (activeTab === 'all') {
          setResults(response.data);
        } else {
          // For specific tabs, structure the response to match the expected format
          setResults({
            users: activeTab === 'users' ? response.data.users : [],
            posts: activeTab === 'posts' ? response.data.posts : [],
            jobs: activeTab === 'jobs' ? response.data.jobs : []
          });
        }
      } catch (err) {
        console.error('Search error:', err);
        setError('Failed to perform search');
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [serverUrl, initialQuery, activeTab]);

  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Update URL with search query
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Truncate text
  const truncateText = (text, maxLength = 150) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Nav />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 pt-20">
        <div className="px-4 py-6 sm:px-0">
          {/* Search form */}
          <div className="mb-6">
            <form onSubmit={handleSearch} className="flex w-full">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Search for people, posts, jobs..."
                />
              </div>
              <button
                type="submit"
                className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Search
              </button>
            </form>
          </div>

          {initialQuery && (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              {/* Tabs */}
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex">
                  <button
                    className={`${
                      activeTab === 'all'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
                    onClick={() => setActiveTab('all')}
                  >
                    All Results
                  </button>
                  <button
                    className={`${
                      activeTab === 'users'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
                    onClick={() => setActiveTab('users')}
                  >
                    People
                  </button>
                  <button
                    className={`${
                      activeTab === 'posts'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
                    onClick={() => setActiveTab('posts')}
                  >
                    Posts
                  </button>
                  <button
                    className={`${
                      activeTab === 'jobs'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
                    onClick={() => setActiveTab('jobs')}
                  >
                    Jobs
                  </button>
                </nav>
              </div>

              {/* Search results */}
              <div className="p-4">
                {error && (
                  <div className="bg-red-50 p-4 rounded-md mb-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-red-800">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <div>
                    {/* People results */}
                    {(activeTab === 'all' || activeTab === 'users') && results.users.length > 0 && (
                      <div className="mb-8">
                        <div className="flex justify-between items-center mb-4">
                          <h2 className="text-lg font-medium text-gray-900">People</h2>
                          {activeTab === 'all' && results.users.length > 3 && (
                            <button
                              onClick={() => setActiveTab('users')}
                              className="text-sm text-blue-600 hover:text-blue-500"
                            >
                              See all
                            </button>
                          )}
                        </div>
                        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                          {results.users.slice(0, activeTab === 'all' ? 3 : undefined).map(user => (
                            <li key={user._id} className="col-span-1 bg-white rounded-lg shadow divide-y divide-gray-200">
                              <div className="w-full flex items-center justify-between p-6 space-x-6">
                                <div className="flex-1 truncate">
                                  <div className="flex items-center space-x-3">
                                    <h3 className="text-gray-900 text-sm font-medium truncate">
                                      {user.firstName} {user.lastName}
                                    </h3>
                                  </div>
                                  <p className="mt-1 text-gray-500 text-sm truncate">{user.headline || 'LinkedIn Member'}</p>
                                  {user.location && (
                                    <p className="mt-1 text-gray-500 text-sm truncate">{user.location}</p>
                                  )}
                                </div>
                                <img className="w-10 h-10 bg-gray-300 rounded-full flex-shrink-0" src={user.profileImage || 'https://via.placeholder.com/40'} alt="" />
                              </div>
                              <div>
                                <div className="-mt-px flex divide-x divide-gray-200">
                                  <div className="w-0 flex-1 flex">
                                    <Link
                                      to={`/profile/${user._id}`}
                                      className="relative -mr-px w-0 flex-1 inline-flex items-center justify-center py-4 text-sm text-gray-700 font-medium border border-transparent rounded-bl-lg hover:text-gray-500"
                                    >
                                      <span className="ml-3">View Profile</span>
                                    </Link>
                                  </div>
                                  <div className="-ml-px w-0 flex-1 flex">
                                    <Link
                                      to={`/messages/${user._id}`}
                                      className="relative w-0 flex-1 inline-flex items-center justify-center py-4 text-sm text-gray-700 font-medium border border-transparent rounded-br-lg hover:text-gray-500"
                                    >
                                      <span className="ml-3">Message</span>
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Posts results */}
                    {(activeTab === 'all' || activeTab === 'posts') && results.posts.length > 0 && (
                      <div className="mb-8">
                        <div className="flex justify-between items-center mb-4">
                          <h2 className="text-lg font-medium text-gray-900">Posts</h2>
                          {activeTab === 'all' && results.posts.length > 3 && (
                            <button
                              onClick={() => setActiveTab('posts')}
                              className="text-sm text-blue-600 hover:text-blue-500"
                            >
                              See all
                            </button>
                          )}
                        </div>
                        <ul className="divide-y divide-gray-200">
                          {results.posts.slice(0, activeTab === 'all' ? 3 : undefined).map(post => (
                            <li key={post._id} className="py-4">
                              <div className="flex space-x-3">
                                <img className="h-10 w-10 rounded-full" src={post.user.profileImage || 'https://via.placeholder.com/40'} alt="" />
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-medium">
                                      <Link to={`/profile/${post.user._id}`} className="hover:underline">
                                        {post.user.firstName} {post.user.lastName}
                                      </Link>
                                    </h3>
                                    <p className="text-sm text-gray-500">{formatDate(post.createdAt)}</p>
                                  </div>
                                  <p className="text-sm text-gray-500">{truncateText(post.text)}</p>
                                  {post.image && (
                                    <div className="mt-2">
                                      <img
                                        src={`${serverUrl.split('/api')[0]}${post.image}`}
                                        alt="Post attachment"
                                        className="h-32 w-auto object-cover rounded-md"
                                      />
                                    </div>
                                  )}
                                  <div className="mt-2 flex space-x-8">
                                    <span className="text-sm text-gray-500">
                                      <span className="font-medium text-gray-900">{post.likes.length}</span> likes
                                    </span>
                                    <span className="text-sm text-gray-500">
                                      <span className="font-medium text-gray-900">{post.comments.length}</span> comments
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Jobs results */}
                    {(activeTab === 'all' || activeTab === 'jobs') && results.jobs.length > 0 && (
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h2 className="text-lg font-medium text-gray-900">Jobs</h2>
                          {activeTab === 'all' && results.jobs.length > 3 && (
                            <button
                              onClick={() => setActiveTab('jobs')}
                              className="text-sm text-blue-600 hover:text-blue-500"
                            >
                              See all
                            </button>
                          )}
                        </div>
                        <ul className="divide-y divide-gray-200">
                          {results.jobs.slice(0, activeTab === 'all' ? 3 : undefined).map(job => (
                            <li key={job._id} className="py-4">
                              <Link to={`/jobs/${job._id}`} className="block hover:bg-gray-50">
                                <div className="flex items-center justify-between">
                                  <p className="text-lg font-medium text-blue-600 truncate">{job.title}</p>
                                  <div className="ml-2 flex-shrink-0 flex">
                                    <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      job.jobType === 'full-time' ? 'bg-green-100 text-green-800' :
                                      job.jobType === 'part-time' ? 'bg-yellow-100 text-yellow-800' :
                                      job.jobType === 'contract' ? 'bg-purple-100 text-purple-800' :
                                      job.jobType === 'internship' ? 'bg-blue-100 text-blue-800' :
                                      'bg-red-100 text-red-800'
                                    }`}>
                                      {job.jobType.replace('-', ' ')}
                                    </p>
                                  </div>
                                </div>
                                <div className="mt-2 sm:flex sm:justify-between">
                                  <div className="sm:flex">
                                    <p className="flex items-center text-sm text-gray-500">
                                      {job.company}
                                    </p>
                                    <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                      {job.location}
                                    </p>
                                  </div>
                                  <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                    <p>
                                      Posted on {formatDate(job.createdAt)}
                                    </p>
                                  </div>
                                </div>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* No results */}
                    {!loading &&
                     ((activeTab === 'all' && results.users.length === 0 && results.posts.length === 0 && results.jobs.length === 0) ||
                      (activeTab === 'users' && results.users.length === 0) ||
                      (activeTab === 'posts' && results.posts.length === 0) ||
                      (activeTab === 'jobs' && results.jobs.length === 0)) && (
                      <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Try adjusting your search query to find what you're looking for.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;
