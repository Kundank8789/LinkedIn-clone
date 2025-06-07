import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Nav from '../components/nav.jsx';
import { AuthDataContext } from '../context/AuthContext';
import defaultProfilePic from '../assets/dp.webp';

const JobDetail = () => {
  const { jobId } = useParams();
  const { currentUser, serverUrl } = useContext(AuthDataContext);
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [applying, setApplying] = useState(false);
  const [applicationData, setApplicationData] = useState({
    resume: '',
    coverLetter: ''
  });
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [showApplicants, setShowApplicants] = useState(false);

  // Fetch job details
  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${serverUrl}/api/jobs/${jobId}`);
        
        if (response.data.success) {
          setJob(response.data.job);
          
          // Check if current user has already applied
          if (currentUser && response.data.job.applicants) {
            const userApplication = response.data.job.applicants.find(
              app => app.user._id === currentUser._id
            );
            
            if (userApplication) {
              setApplicationStatus(userApplication.status);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching job details:', err);
        setError('Failed to load job details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchJobDetails();
    }
  }, [jobId, serverUrl, currentUser]);

  // Handle application form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setApplicationData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Submit job application
  const handleApply = async (e) => {
    e.preventDefault();
    
    try {
      setApplying(true);
      
      const response = await axios.post(
        `${serverUrl}/api/jobs/${jobId}/apply`,
        applicationData
      );
      
      if (response.data.success) {
        setJob(response.data.job);
        setApplicationStatus('Pending');
        setApplying(false);
      }
    } catch (err) {
      console.error('Error applying for job:', err);
      setError('Failed to submit application. Please try again later.');
      setApplying(false);
    }
  };

  // Update application status (for job posters)
  const handleUpdateStatus = async (applicationId, newStatus) => {
    try {
      const response = await axios.put(
        `${serverUrl}/api/jobs/${jobId}/applications/${applicationId}`,
        { status: newStatus }
      );
      
      if (response.data.success) {
        setJob(response.data.job);
      }
    } catch (err) {
      console.error('Error updating application status:', err);
      setError('Failed to update application status. Please try again later.');
    }
  };

  // Delete job
  const handleDeleteJob = async () => {
    if (!window.confirm('Are you sure you want to delete this job posting? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await axios.delete(`${serverUrl}/api/jobs/${jobId}`);
      
      if (response.data.success) {
        navigate('/jobs');
      }
    } catch (err) {
      console.error('Error deleting job:', err);
      setError('Failed to delete job. Please try again later.');
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Reviewed':
        return 'bg-blue-100 text-blue-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      case 'Shortlisted':
        return 'bg-green-100 text-green-800';
      case 'Hired':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Nav />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 pt-20">
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Nav />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 pt-20">
          <div className="bg-red-50 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <Link
                    to="/jobs"
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Go back to jobs
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Nav />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 pt-20">
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Job not found</h3>
            <p className="mt-1 text-sm text-gray-500">The job you're looking for doesn't exist or has been removed.</p>
            <div className="mt-6">
              <Link
                to="/jobs"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go back to jobs
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isJobPoster = currentUser && job.postedBy._id === currentUser._id;
  const hasApplied = applicationStatus !== null;
  const isExpired = new Date(job.expiresAt) < new Date();
  const isActive = job.active;

  return (
    <div className="min-h-screen bg-gray-100">
      <Nav />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 pt-20">
        <div className="px-4 py-6 sm:px-0">
          {/* Job Header */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  {job.company} • {job.location}
                </p>
              </div>
              <div className="flex flex-col items-end">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  job.type === 'Full-time' ? 'bg-green-100 text-green-800' :
                  job.type === 'Part-time' ? 'bg-yellow-100 text-yellow-800' :
                  job.type === 'Contract' ? 'bg-purple-100 text-purple-800' :
                  job.type === 'Internship' ? 'bg-blue-100 text-blue-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {job.type}
                </span>
                {!isActive && (
                  <span className="mt-2 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                    Inactive
                  </span>
                )}
                {isExpired && (
                  <span className="mt-2 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                    Expired
                  </span>
                )}
              </div>
            </div>
            
            {/* Job Actions */}
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <img
                    className="h-10 w-10 rounded-full mr-4"
                    src={
                      job.postedBy.profileImage ? (
                        job.postedBy.profileImage.startsWith('http') ? 
                          job.postedBy.profileImage : 
                          `${serverUrl}${job.postedBy.profileImage}`
                      ) : (
                        defaultProfilePic
                      )
                    }
                    alt={`${job.postedBy.firstName} ${job.postedBy.lastName}`}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = defaultProfilePic;
                    }}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Posted by {job.postedBy.firstName} {job.postedBy.lastName}
                    </p>
                    <p className="text-sm text-gray-500">
                      on {formatDate(job.createdAt)}
                    </p>
                  </div>
                </div>
                
                {isJobPoster ? (
                  <div className="flex space-x-3">
                    <Link
                      to={`/jobs/${job._id}/edit`}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Edit Job
                    </Link>
                    <button
                      onClick={handleDeleteJob}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Delete Job
                    </button>
                    <button
                      onClick={() => setShowApplicants(!showApplicants)}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {showApplicants ? 'Hide Applicants' : `View Applicants (${job.applicants.length})`}
                    </button>
                  </div>
                ) : (
                  <div>
                    {hasApplied ? (
                      <div className="flex items-center">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(applicationStatus)} mr-2`}>
                          {applicationStatus}
                        </span>
                        <span className="text-sm text-gray-500">Application submitted</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => setApplying(true)}
                        disabled={isExpired || !isActive}
                        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                          isExpired || !isActive
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                        }`}
                      >
                        {isExpired ? 'Job Expired' : !isActive ? 'Job Inactive' : 'Apply Now'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Job Details */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg font-medium text-gray-900">Job Details</h2>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Job Type</dt>
                  <dd className="mt-1 text-sm text-gray-900">{job.type}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Location</dt>
                  <dd className="mt-1 text-sm text-gray-900">{job.location}</dd>
                </div>
                {job.salary && (
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Salary</dt>
                    <dd className="mt-1 text-sm text-gray-900">{job.salary}</dd>
                  </div>
                )}
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Expires On</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(job.expiresAt)}</dd>
                </div>
                {job.skills && job.skills.length > 0 && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Skills</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      <div className="flex flex-wrap gap-2">
                        {job.skills.map((skill, index) => (
                          <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </dd>
                  </div>
                )}
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">{job.description}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Requirements</dt>
                  <dd className="mt-1 text-sm text-gray-900 whitespace-pre-line">{job.requirements}</dd>
                </div>
              </dl>
            </div>
          </div>
          
          {/* Application Form */}
          {applying && !hasApplied && (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
              <div className="px-4 py-5 sm:px-6">
                <h2 className="text-lg font-medium text-gray-900">Apply for this Job</h2>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Please fill out the form below to apply for this position.
                </p>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                <form onSubmit={handleApply}>
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="resume" className="block text-sm font-medium text-gray-700">
                        Resume/CV (URL or text)
                      </label>
                      <div className="mt-1">
                        <textarea
                          id="resume"
                          name="resume"
                          rows={4}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          placeholder="Paste a link to your resume or write a summary of your qualifications"
                          value={applicationData.resume}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="coverLetter" className="block text-sm font-medium text-gray-700">
                        Cover Letter
                      </label>
                      <div className="mt-1">
                        <textarea
                          id="coverLetter"
                          name="coverLetter"
                          rows={6}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          placeholder="Write a cover letter explaining why you're a good fit for this position"
                          value={applicationData.coverLetter}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setApplying(false)}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Submit Application
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}
          
          {/* Applicants List (for job poster) */}
          {isJobPoster && showApplicants && (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h2 className="text-lg font-medium text-gray-900">Applicants ({job.applicants.length})</h2>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Review and manage applications for this job posting.
                </p>
              </div>
              <div className="border-t border-gray-200">
                {job.applicants.length === 0 ? (
                  <div className="px-4 py-5 sm:px-6 text-center">
                    <p className="text-sm text-gray-500">No applications yet.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {job.applicants.map((applicant) => (
                      <li key={applicant._id} className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <img
                              className="h-10 w-10 rounded-full mr-4"
                              src={
                                applicant.user.profileImage ? (
                                  applicant.user.profileImage.startsWith('http') ? 
                                    applicant.user.profileImage : 
                                    `${serverUrl}${applicant.user.profileImage}`
                                ) : (
                                  defaultProfilePic
                                )
                              }
                              alt={`${applicant.user.firstName} ${applicant.user.lastName}`}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = defaultProfilePic;
                              }}
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {applicant.user.firstName} {applicant.user.lastName}
                              </p>
                              <p className="text-xs text-gray-500">
                                Applied on {formatDate(applicant.appliedAt)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(applicant.status)} mr-2`}>
                              {applicant.status}
                            </span>
                            <select
                              value={applicant.status}
                              onChange={(e) => handleUpdateStatus(applicant._id, e.target.value)}
                              className="block w-full pl-3 pr-10 py-1 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                            >
                              <option value="Pending">Pending</option>
                              <option value="Reviewed">Reviewed</option>
                              <option value="Shortlisted">Shortlisted</option>
                              <option value="Rejected">Rejected</option>
                              <option value="Hired">Hired</option>
                            </select>
                          </div>
                        </div>
                        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <h4 className="text-xs font-medium text-gray-500">Resume/CV</h4>
                            <div className="mt-1 text-sm text-gray-900 p-2 bg-gray-50 rounded-md">
                              {applicant.resume.startsWith('http') ? (
                                <a 
                                  href={applicant.resume} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-500"
                                >
                                  View Resume
                                </a>
                              ) : (
                                <p className="whitespace-pre-line">{applicant.resume}</p>
                              )}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-xs font-medium text-gray-500">Cover Letter</h4>
                            <div className="mt-1 text-sm text-gray-900 p-2 bg-gray-50 rounded-md">
                              <p className="whitespace-pre-line">{applicant.coverLetter}</p>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobDetail;
