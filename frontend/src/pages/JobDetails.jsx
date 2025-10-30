import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Nav from '../components/nav.jsx';
import { AuthDataContext } from '../Context/AuthContext.jsx';

const JobDetails = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { serverUrl, currentUser } = useContext(AuthDataContext);

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [applications, setApplications] = useState([]);
  const [isOwner, setIsOwner] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  // Fetch job details
  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${serverUrl}/api/jobs/${jobId}`);
        setJob(response.data);

        // Check if current user is the job poster
        if (currentUser && response.data.postedBy._id === currentUser._id) {
          setIsOwner(true);

          // If owner, fetch applications
          const applicationsResponse = await axios.get(
            `${serverUrl}/api/jobs/${jobId}/applications?userId=${currentUser._id}`
          );
          setApplications(applicationsResponse.data);
        } else {
          // Check if user has already applied
          const userApplications = await axios.get(
            `${serverUrl}/api/jobs/applications/user/${currentUser._id}`
          );

          const hasAlreadyApplied = userApplications.data.some(
            app => app.job._id === jobId
          );

          if (hasAlreadyApplied) {
            setHasApplied(true);
            // Find application status
            const application = userApplications.data.find(
              app => app.job._id === jobId
            );
            if (application) {
              setApplicationStatus(application.status);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching job details:', err);
        setError('Failed to load job details');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchJobDetails();
    }
  }, [jobId, serverUrl, currentUser]);

  // Handle resume file change
  const handleResumeChange = (e) => {
    setResumeFile(e.target.files[0]);
  };

  // Handle job application submission
  const handleApply = async (e) => {
    e.preventDefault();

    if (!resumeFile) {
      setError('Please upload your resume');
      return;
    }

    try {
      setApplying(true);

      const formData = new FormData();
      formData.append('userId', currentUser._id);
      formData.append('resume', resumeFile);

      if (coverLetter) {
        formData.append('coverLetter', coverLetter);
      }

      const response = await axios.post(
        `${serverUrl}/api/jobs/${jobId}/apply`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data) {
        setHasApplied(true);
        setApplicationStatus('pending');
        setShowApplicationForm(false);
      }
    } catch (err) {
      console.error('Error applying for job:', err);
      setError(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  // Handle application status update
  const updateApplicationStatus = async (applicationId, status) => {
    try {
      await axios.put(`${serverUrl}/api/jobs/${jobId}/applications/${applicationId}`, {
        userId: currentUser._id,
        status
      });

      // Update local state
      setApplications(prev =>
        prev.map(app =>
          app._id === applicationId ? { ...app, status } : app
        )
      );
    } catch (err) {
      console.error('Error updating application status:', err);
      setError('Failed to update application status');
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

  // Delete job
  const handleDeleteJob = async () => {
    if (!window.confirm('Are you sure you want to delete this job posting?')) {
      return;
    }

    try {
      await axios.delete(`${serverUrl}/api/jobs/${jobId}`, {
        data: { userId: currentUser._id }
      });

      navigate('/jobs');
    } catch (err) {
      console.error('Error deleting job:', err);
      setError('Failed to delete job');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Nav />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 pt-20">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !job) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Nav />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 pt-20">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
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
            <div className="mt-4">
              <Link to="/jobs" className="text-blue-600 hover:text-blue-500">
                &larr; Back to Jobs
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Nav />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 pt-20">
        {error && (
          <div className="bg-red-50 p-4 border-l-4 border-red-400 mb-4">
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

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{job?.title}</h1>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">{job?.company} • {job?.location}</p>
            </div>
            <div>
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                job?.jobType === 'full-time' ? 'bg-green-100 text-green-800' :
                job?.jobType === 'part-time' ? 'bg-yellow-100 text-yellow-800' :
                job?.jobType === 'contract' ? 'bg-purple-100 text-purple-800' :
                job?.jobType === 'internship' ? 'bg-blue-100 text-blue-800' :
                'bg-red-100 text-red-800'
              }`}>
                {job?.jobType.replace('-', ' ')}
              </span>
            </div>
          </div>

          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Posted by</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <Link to={`/profile/${job?.postedBy._id}`} className="text-blue-600 hover:text-blue-500">
                    {job?.postedBy.firstName} {job?.postedBy.lastName}
                  </Link>
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Posted on</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(job?.createdAt)}</dd>
              </div>
              {job?.salary && (
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Salary</dt>
                  <dd className="mt-1 text-sm text-gray-900">{job.salary}</dd>
                </div>
              )}
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Expires on</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(job?.expiresAt)}</dd>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900">Job Description</h3>
              <div className="mt-2 text-sm text-gray-700 whitespace-pre-line">
                {job?.description}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900">Requirements</h3>
              <div className="mt-2 text-sm text-gray-700 whitespace-pre-line">
                {job?.requirements}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            {isOwner ? (
              <div>
                <div className="flex justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Applications ({applications.length})</h3>
                  <div className="flex space-x-2">
                    <Link
                      to={`/post-job?edit=${jobId}`}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Edit Job
                    </Link>
                    <button
                      onClick={handleDeleteJob}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Delete Job
                    </button>
                  </div>
                </div>

                {applications.length === 0 ? (
                  <p className="text-gray-500">No applications yet.</p>
                ) : (
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Applicant</th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Applied On</th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Resume</th>
                          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                          <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {applications.map((application) => (
                          <tr key={application._id}>
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                              <div className="flex items-center">
                                <div className="h-10 w-10 flex-shrink-0">
                                  <img className="h-10 w-10 rounded-full" src={application.user.profileImage || 'https://via.placeholder.com/40'} alt="" />
                                </div>
                                <div className="ml-4">
                                  <div className="font-medium text-gray-900">
                                    <Link to={`/profile/${application.user._id}`} className="hover:text-blue-600">
                                      {application.user.firstName} {application.user.lastName}
                                    </Link>
                                  </div>
                                  <div className="text-gray-500">{application.user.headline || 'LinkedIn Member'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {formatDate(application.createdAt)}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              <a
                                href={`${serverUrl}${application.resume}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-500"
                              >
                                View Resume
                              </a>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(application.status)}`}>
                                {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                              </span>
                            </td>
                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                              <select
                                value={application.status}
                                onChange={(e) => updateApplicationStatus(application._id, e.target.value)}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                              >
                                <option value="pending">Pending</option>
                                <option value="reviewed">Reviewed</option>
                                <option value="shortlisted">Shortlisted</option>
                                <option value="rejected">Rejected</option>
                                <option value="hired">Hired</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <div>
                {hasApplied ? (
                  <div className="bg-green-50 p-4 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-green-800">Application Submitted</h3>
                        <div className="mt-2 text-sm text-green-700">
                          <p>Your application has been submitted successfully. Current status:
                            <span className={`ml-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(applicationStatus)}`}>
                              {applicationStatus?.charAt(0).toUpperCase() + applicationStatus?.slice(1) || 'Pending'}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : showApplicationForm ? (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Apply for this position</h3>
                    <form onSubmit={handleApply} className="space-y-6">
                      <div>
                        <label htmlFor="resume" className="block text-sm font-medium text-gray-700">
                          Resume (PDF or Word document) <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-1">
                          <input
                            id="resume"
                            name="resume"
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={handleResumeChange}
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="coverLetter" className="block text-sm font-medium text-gray-700">
                          Cover Letter (optional)
                        </label>
                        <div className="mt-1">
                          <textarea
                            id="coverLetter"
                            name="coverLetter"
                            rows={4}
                            value={coverLetter}
                            onChange={(e) => setCoverLetter(e.target.value)}
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Tell us why you're a good fit for this position..."
                          />
                        </div>
                      </div>

                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setShowApplicationForm(false)}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={applying}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                        >
                          {applying ? 'Submitting...' : 'Submit Application'}
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowApplicationForm(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Apply Now
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <Link to="/jobs" className="text-blue-600 hover:text-blue-500">
              &larr; Back to Jobs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetails;
