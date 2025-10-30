import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Nav from '../components/nav.jsx';
import { AuthDataContext } from '../Context/AuthContext.jsx';

const PostJob = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { serverUrl, currentUser } = useContext(AuthDataContext);

  // Get job ID from URL if editing
  const queryParams = new URLSearchParams(location.search);
  const editJobId = queryParams.get('edit');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    description: '',
    requirements: '',
    jobType: 'full-time', // Using lowercase to match the model's enum values
    salary: '',
    expiresInDays: '30'
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Fetch job data if editing
  useEffect(() => {
    const fetchJobData = async () => {
      if (!editJobId) return;

      try {
        setLoading(true);
        const response = await axios.get(`${serverUrl}/api/jobs/${editJobId}`);
        const job = response.data;

        // Check if current user is the job poster
        if (job.postedBy._id !== currentUser._id) {
          setError('You do not have permission to edit this job');
          navigate('/jobs');
          return;
        }

        // Calculate days until expiry
        const expiryDate = new Date(job.expiresAt);
        const today = new Date();
        const diffTime = expiryDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        setFormData({
          title: job.title,
          company: job.company,
          location: job.location,
          description: job.description,
          requirements: job.requirements,
          jobType: job.jobType,
          salary: job.salary || '',
          expiresInDays: diffDays > 0 ? diffDays.toString() : '30'
        });

        setIsEditing(true);
      } catch (err) {
        console.error('Error fetching job data:', err);
        setError('Failed to load job data');
      } finally {
        setLoading(false);
      }
    };

    if (editJobId && currentUser) {
      fetchJobData();
    }
  }, [editJobId, serverUrl, currentUser, navigate]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!formData.title || !formData.company || !formData.location ||
        !formData.description || !formData.requirements || !formData.jobType) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Make sure we have the current user
      if (!currentUser || !currentUser._id) {
        setError('You must be logged in to post a job');
        setLoading(false);
        return;
      }

      // Prepare job data with proper casing for job type
      const jobData = {
        ...formData,
        userId: currentUser._id,
        // Explicitly include jobType to ensure it's sent correctly
        jobType: formData.jobType
      };

      // Log the data being sent for debugging
      console.log('Submitting job data:', jobData);

      // Make sure axios is configured with the auth token
      if (localStorage.getItem('token')) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('token')}`;
      }

      let response;

      if (isEditing) {
        // Update existing job
        response = await axios.put(`${serverUrl}/api/jobs/${editJobId}`, jobData);
        setSuccess('Job updated successfully!');
      } else {
        // Create new job with explicit content type
        response = await axios.post(`${serverUrl}/api/jobs`, jobData, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        console.log('Job creation response:', response.data);
        setSuccess('Job posted successfully!');
      }

      // Redirect to job details page after short delay
      setTimeout(() => {
        navigate(`/jobs/${response.data._id || response.data}`);
      }, 1500);
    } catch (err) {
      console.error('Error posting job:', err);
      // More detailed error logging
      if (err.response) {
        console.error('Response data:', err.response.data);
        console.error('Response status:', err.response.status);
        console.error('Response headers:', err.response.headers);
      } else if (err.request) {
        console.error('No response received:', err.request);
      } else {
        console.error('Error setting up request:', err.message);
      }

      setError(err.response?.data?.message || 'Failed to post job. Please check the console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Nav />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 pt-20">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h1 className="text-lg font-medium leading-6 text-gray-900">
                {isEditing ? 'Edit Job Posting' : 'Post a New Job'}
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                {isEditing
                  ? 'Update the details of your job posting'
                  : 'Fill in the details to create a new job posting'}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 p-4 border-l-4 border-red-400 mx-4">
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

            {success && (
              <div className="bg-green-50 p-4 border-l-4 border-green-400 mx-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">{success}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="border-t border-gray-200">
              <form onSubmit={handleSubmit} className="p-4 sm:p-6">
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-3">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      Job Title <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="title"
                        id="title"
                        value={formData.title}
                        onChange={handleChange}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        required
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                      Company <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="company"
                        id="company"
                        value={formData.company}
                        onChange={handleChange}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        required
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                      Location <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="location"
                        id="location"
                        value={formData.location}
                        onChange={handleChange}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="e.g. New York, NY or Remote"
                        required
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="jobType" className="block text-sm font-medium text-gray-700">
                      Job Type <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1">
                      <select
                        id="jobType"
                        name="jobType"
                        value={formData.jobType}
                        onChange={handleChange}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        required
                      >
                        <option value="full-time">Full-time</option>
                        <option value="part-time">Part-time</option>
                        <option value="contract">Contract</option>
                        <option value="internship">Internship</option>
                        <option value="remote">Remote</option>
                      </select>
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="salary" className="block text-sm font-medium text-gray-700">
                      Salary (optional)
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="salary"
                        id="salary"
                        value={formData.salary}
                        onChange={handleChange}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="e.g. $50,000 - $70,000 per year"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="expiresInDays" className="block text-sm font-medium text-gray-700">
                      Job Posting Duration <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1">
                      <select
                        id="expiresInDays"
                        name="expiresInDays"
                        value={formData.expiresInDays}
                        onChange={handleChange}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        required
                      >
                        <option value="7">7 days</option>
                        <option value="14">14 days</option>
                        <option value="30">30 days</option>
                        <option value="60">60 days</option>
                        <option value="90">90 days</option>
                      </select>
                    </div>
                  </div>

                  <div className="sm:col-span-6">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Job Description <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="description"
                        name="description"
                        rows={5}
                        value={formData.description}
                        onChange={handleChange}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="Describe the role, responsibilities, and what a typical day looks like..."
                        required
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-6">
                    <label htmlFor="requirements" className="block text-sm font-medium text-gray-700">
                      Requirements <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="requirements"
                        name="requirements"
                        rows={5}
                        value={formData.requirements}
                        onChange={handleChange}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="List the skills, qualifications, and experience required for this role..."
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-5">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => navigate('/jobs')}
                      className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                    >
                      {loading ? 'Saving...' : isEditing ? 'Update Job' : 'Post Job'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostJob;
