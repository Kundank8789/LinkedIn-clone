import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Nav from '../components/nav.jsx';
import { AuthDataContext } from '../context/AuthContext';

const Jobs = () => {
  const { serverUrl, currentUser } = useContext(AuthDataContext);

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    jobType: '',
    location: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState('browse');
  const [myApplications, setMyApplications] = useState([]);
  const [myJobs, setMyJobs] = useState([]);

  // Fetch jobs
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);

        // Build query parameters
        const params = new URLSearchParams();
        params.append('page', currentPage);
        params.append('limit', 10);

        if (searchQuery) {
          params.append('search', searchQuery);
        }

        if (filters.jobType) {
          params.append('jobType', filters.jobType);
        }

        if (filters.location) {
          params.append('location', filters.location);
        }

        const response = await axios.get(`${serverUrl}/api/jobs?${params.toString()}`);

        setJobs(response.data.jobs);
        setTotalPages(response.data.totalPages);
      } catch (err) {
        console.error('Error fetching jobs:', err);
        setError('Failed to load jobs');
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'browse') {
      fetchJobs();
    }
  }, [serverUrl, currentPage, searchQuery, filters, activeTab]);

  // Fetch user's job applications
  useEffect(() => {
    const fetchMyApplications = async () => {
      if (!currentUser || activeTab !== 'applications') return;

      try {
        setLoading(true);
        const response = await axios.get(`${serverUrl}/api/jobs/applications/user/${currentUser._id}`);
        setMyApplications(response.data);
      } catch (err) {
        console.error('Error fetching applications:', err);
        setError('Failed to load your applications');
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'applications') {
      fetchMyApplications();
    }
  }, [serverUrl, currentUser, activeTab]);

  // Fetch jobs posted by the user
  useEffect(() => {
    const fetchMyJobs = async () => {
      if (!currentUser || activeTab !== 'posted') return;

      try {
        setLoading(true);
        const response = await axios.get(`${serverUrl}/api/jobs?postedBy=${currentUser._id}`);
        setMyJobs(response.data);
      } catch (err) {
        console.error('Error fetching posted jobs:', err);
        setError('Failed to load your posted jobs');
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'posted') {
      fetchMyJobs();
    }
  }, [serverUrl, currentUser, activeTab]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on new search
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setCurrentPage(1); // Reset to first page on filter change
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get application status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'shortlisted':
        return 'bg-green-100 text-green-800';
      case 'hired':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Nav />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 pt-20">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Jobs</h1>
            <Link
              to="/post-job"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Post a Job
            </Link>
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex">
                <button
                  className={`${
                    activeTab === 'browse'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
                  onClick={() => setActiveTab('browse')}
                >
                  Browse Jobs
                </button>
                <button
                  className={`${
                    activeTab === 'applications'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
                  onClick={() => setActiveTab('applications')}
                >
                  My Applications
                </button>
                <button
                  className={`${
                    activeTab === 'posted'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
                  onClick={() => setActiveTab('posted')}
                >
                  Jobs I've Posted
                </button>
              </nav>
            </div>

            {error && (
              <div className="bg-red-50 p-4 border-l-4 border-red-400">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'browse' && (
              <>
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <label htmlFor="search" className="sr-only">Search</label>
                      <input
                        type="text"
                        name="search"
                        id="search"
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="Search jobs by title, company, or keyword"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="w-full md:w-48">
                      <label htmlFor="jobType" className="sr-only">Job Type</label>
                      <select
                        id="jobType"
                        name="jobType"
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        value={filters.jobType}
                        onChange={handleFilterChange}
                      >
                        <option value="">All Job Types</option>
                        <option value="full-time">Full-time</option>
                        <option value="part-time">Part-time</option>
                        <option value="contract">Contract</option>
                        <option value="internship">Internship</option>
                        <option value="remote">Remote</option>
                      </select>
                    </div>
                    <div className="w-full md:w-48">
                      <label htmlFor="location" className="sr-only">Location</label>
                      <input
                        type="text"
                        name="location"
                        id="location"
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="Location"
                        value={filters.location}
                        onChange={handleFilterChange}
                      />
                    </div>
                    <button
                      type="submit"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Search
                    </button>
                  </form>
                </div>

                <div className="p-4">
                  {loading ? (
                    <div className="flex justify-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  ) : jobs.length === 0 ? (
                    <div className="text-center py-12">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs found</h3>
                      <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter to find what you're looking for.</p>
                    </div>
                  ) : (
                    <div className="overflow-hidden">
                      <ul className="divide-y divide-gray-200">
                        {jobs.map((job) => (
                          <li key={job._id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                            <Link to={`/jobs/${job._id}`} className="block">
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
                              {job.salary && (
                                <div className="mt-2">
                                  <p className="text-sm text-gray-500">
                                    Salary: {job.salary}
                                  </p>
                                </div>
                              )}
                            </Link>
                          </li>
                        ))}
                      </ul>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <nav className="border-t border-gray-200 px-4 flex items-center justify-between sm:px-0 mt-6">
                          <div className="w-0 flex-1 flex">
                            <button
                              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                              disabled={currentPage === 1}
                              className={`${
                                currentPage === 1 ? 'cursor-not-allowed text-gray-300' : 'text-gray-500 hover:text-gray-700'
                              } border-t-2 border-transparent pt-4 pr-1 inline-flex items-center text-sm font-medium`}
                            >
                              Previous
                            </button>
                          </div>
                          <div className="hidden md:flex">
                            {[...Array(totalPages).keys()].map(page => (
                              <button
                                key={page + 1}
                                onClick={() => setCurrentPage(page + 1)}
                                className={`${
                                  currentPage === page + 1
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } border-t-2 pt-4 px-4 inline-flex items-center text-sm font-medium`}
                              >
                                {page + 1}
                              </button>
                            ))}
                          </div>
                          <div className="w-0 flex-1 flex justify-end">
                            <button
                              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                              disabled={currentPage === totalPages}
                              className={`${
                                currentPage === totalPages ? 'cursor-not-allowed text-gray-300' : 'text-gray-500 hover:text-gray-700'
                              } border-t-2 border-transparent pt-4 pl-1 inline-flex items-center text-sm font-medium`}
                            >
                              Next
                            </button>
                          </div>
                        </nav>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === 'applications' && (
              <div className="p-4">
                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : myApplications.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No applications yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Start applying for jobs to see your applications here.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {myApplications.map((application) => (
                      <li key={application.job._id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                        <Link to={`/jobs/${application.job._id}`} className="block">
                          <div className="flex items-center justify-between">
                            <p className="text-lg font-medium text-blue-600 truncate">{application.job.title}</p>
                            <div className="ml-2 flex-shrink-0 flex">
                              <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(application.status)}`}>
                                {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 sm:flex sm:justify-between">
                            <div className="sm:flex">
                              <p className="flex items-center text-sm text-gray-500">
                                {application.job.company}
                              </p>
                              <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                {application.job.location}
                              </p>
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                              <p>
                                Applied on {formatDate(application.appliedAt)}
                              </p>
                            </div>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {activeTab === 'posted' && (
              <div className="p-4">
                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : myJobs.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs posted</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      <Link to="/post-job" className="text-blue-600 hover:text-blue-500">
                        Post a job
                      </Link> to see it listed here.
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {myJobs.map((job) => (
                      <li key={job._id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                        <Link to={`/jobs/${job._id}`} className="block">
                          <div className="flex items-center justify-between">
                            <p className="text-lg font-medium text-blue-600 truncate">{job.title}</p>
                            <div className="ml-2 flex-shrink-0 flex">
                              <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                job.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {job.isActive ? 'Active' : 'Inactive'}
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
                          <div className="mt-2">
                            <p className="text-sm text-gray-500">
                              {job.applications?.length || 0} applications received
                            </p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Jobs;
