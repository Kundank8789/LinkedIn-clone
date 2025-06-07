import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthDataContext } from '../context/AuthContext';
import { UserDataContext } from '../context/userContext';
import Nav from '../components/nav.jsx';
import ConnectionButton from '../components/ConnectionButton';
import axios from 'axios';
// Import a local image directly
import defaultProfilePic from '../assets/dp.webp';

const Profile = () => {
  const { userId } = useParams();
  const { serverUrl, currentUser } = useContext(AuthDataContext);
  // eslint-disable-next-line no-unused-vars
  const { userData } = useContext(UserDataContext);

  // Determine if this is the current user's profile
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('none');
  const [mutualConnections, setMutualConnections] = useState(0);

  // Profile data states
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [useExternalImage, setUseExternalImage] = useState(false);
  const [bio, setBio] = useState('');
  const [education, setEducation] = useState([{ school: '', degree: '', fieldOfStudy: '', startYear: '', endYear: '' }]);
  const [experience, setExperience] = useState([{ title: '', company: '', location: '', startDate: '', endDate: '', description: '' }]);

  // UI states
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [editMode, setEditMode] = useState({
    bio: false,
    education: false,
    experience: false
  });

  // Define fetchProfileData function before using it in useEffect
  const fetchProfileData = async (profileUserId) => {
    if (!profileUserId || !currentUser) return;

    try {
      setLoading(true);

      // Fetch profile data and connection status in parallel
      const [profileResponse, connectionResponse] = await Promise.all([
        axios.get(`${serverUrl}/api/profile/${profileUserId}`),
        !isCurrentUser ? axios.get(`${serverUrl}/api/connections/status/${currentUser._id}/${profileUserId}`) : null
      ]);

      if (profileResponse.data) {
        // Store full profile data
        setProfileData(profileResponse.data);

        // Set individual profile sections
        if (profileResponse.data.bio) setBio(profileResponse.data.bio);
        if (profileResponse.data.profileImage) setImagePreview(profileResponse.data.profileImage);
        if (profileResponse.data.education && profileResponse.data.education.length > 0) {
          setEducation(profileResponse.data.education);
        }
        if (profileResponse.data.experience && profileResponse.data.experience.length > 0) {
          setExperience(profileResponse.data.experience);
        }
      }

      // Set connection status and mutual connections if viewing another user's profile
      if (!isCurrentUser && connectionResponse && connectionResponse.data) {
        setConnectionStatus(connectionResponse.data.status);
        setMutualConnections(connectionResponse.data.mutualConnectionCount);
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      setMessage('Failed to load profile data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Determine if viewing own profile or someone else's
  useEffect(() => {
    if (currentUser) {
      const isOwn = userId === currentUser._id || !userId;
      setIsCurrentUser(isOwn);

      // If viewing own profile and no userId provided, use current user's ID
      fetchProfileData(isOwn ? currentUser._id : userId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, userId]);

  // Handle profile image change
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle external image URL
  const handleExternalImageUrl = (e) => {
    setImageUrl(e.target.value);
    if (e.target.value) {
      setImagePreview(e.target.value);
      setUseExternalImage(true);
      setProfileImage(null);
    }
  };

  // Handle profile image upload
  const handleImageUpload = async () => {
    if (!profileImage && !useExternalImage) return;

    try {
      setLoading(true);

      if (useExternalImage) {
        // Use external image URL
        const response = await axios.post(`${serverUrl}/api/profile/update-external-image`, {
          userId: currentUser._id,
          imageUrl: imageUrl
        });

        if (response.data.success) {
          setMessage('Profile image updated successfully!');
          setImagePreview(imageUrl);
        }
      } else {
        // Upload local image file
        const formData = new FormData();
        formData.append('profileImage', profileImage);
        formData.append('userId', currentUser._id);

        const response = await axios.post(`${serverUrl}/api/profile/upload-image`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        if (response.data.success) {
          setMessage('Profile image updated successfully!');
          // Update the image preview with the new URL from server
          setImagePreview(response.data.imageUrl);
        }
      }
    } catch (error) {
      console.error('Error updating profile image:', error);
      setMessage('Failed to update image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle bio update
  const handleBioUpdate = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${serverUrl}/api/profile/update-bio`, {
        userId: currentUser._id,
        bio
      });

      if (response.data.success) {
        setMessage('Bio updated successfully!');
        setEditMode({ ...editMode, bio: false });
      }
    } catch (error) {
      console.error('Error updating bio:', error);
      setMessage('Failed to update bio. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle education fields change
  const handleEducationChange = (index, field, value) => {
    const updatedEducation = [...education];
    updatedEducation[index][field] = value;
    setEducation(updatedEducation);
  };

  // Add new education entry
  const addEducation = () => {
    setEducation([...education, { school: '', degree: '', fieldOfStudy: '', startYear: '', endYear: '' }]);
  };

  // Remove education entry
  const removeEducation = (index) => {
    const updatedEducation = [...education];
    updatedEducation.splice(index, 1);
    setEducation(updatedEducation);
  };

  // Handle education update
  const handleEducationUpdate = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${serverUrl}/api/profile/update-education`, {
        userId: currentUser._id,
        education
      });

      if (response.data.success) {
        setMessage('Education updated successfully!');
        setEditMode({ ...editMode, education: false });
      }
    } catch (error) {
      console.error('Error updating education:', error);
      setMessage('Failed to update education. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle experience fields change
  const handleExperienceChange = (index, field, value) => {
    const updatedExperience = [...experience];
    updatedExperience[index][field] = value;
    setExperience(updatedExperience);
  };

  // Add new experience entry
  const addExperience = () => {
    setExperience([...experience, { title: '', company: '', location: '', startDate: '', endDate: '', description: '' }]);
  };

  // Remove experience entry
  const removeExperience = (index) => {
    const updatedExperience = [...experience];
    updatedExperience.splice(index, 1);
    setExperience(updatedExperience);
  };

  // Handle experience update
  const handleExperienceUpdate = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${serverUrl}/api/profile/update-experience`, {
        userId: currentUser._id,
        experience
      });

      if (response.data.success) {
        setMessage('Experience updated successfully!');
        setEditMode({ ...editMode, experience: false });
      }
    } catch (error) {
      console.error('Error updating experience:', error);
      setMessage('Failed to update experience. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Nav />
      <div className="pt-[80px] px-4 max-w-4xl mx-auto">
        {message && (
          <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-4">
            <p>{message}</p>
          </div>
        )}

        {/* Profile Header Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row items-center md:items-start">
            {/* Profile Image */}
            <div className="relative mb-4 md:mb-0 md:mr-6">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200">
                {imagePreview ? (
                  <img
                    src={
                      imagePreview.startsWith('data:') ? imagePreview :
                      imagePreview.startsWith('http') ? imagePreview :
                      `${serverUrl}${imagePreview}`
                    }
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = defaultProfilePic;
                    }}
                  />
                ) : (
                  <img
                    src={defaultProfilePic}
                    alt="Default Profile"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <label
                htmlFor="profile-image"
                className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full cursor-pointer hover:bg-blue-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
              </label>
              <input
                type="file"
                id="profile-image"
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
              />
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl font-bold">
                {profileData?.user?.firstName || currentUser?.firstName} {profileData?.user?.lastName || currentUser?.lastName}
              </h1>
              <p className="text-gray-600">{profileData?.user?.email || currentUser?.email}</p>
              <p className="text-gray-500 mt-1">{profileData?.user?.headline || currentUser?.headline}</p>

              {mutualConnections > 0 && !isCurrentUser && (
                <p className="text-sm text-blue-600 mt-1">
                  <Link to={`/network/mutual/${userId}`} className="hover:underline">
                    {mutualConnections} mutual connection{mutualConnections !== 1 ? 's' : ''}
                  </Link>
                </p>
              )}

              {isCurrentUser ? (
                <div className="mt-2">
                  {/* External image URL input */}
                  <div className="mb-2">
                    <input
                      type="text"
                      placeholder="Enter image URL from internet"
                      value={imageUrl}
                      onChange={handleExternalImageUrl}
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  </div>

                  {/* Upload button */}
                  <button
                    onClick={handleImageUpload}
                    disabled={loading || (!profileImage && !imageUrl)}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
                  >
                    {loading ? 'Updating...' : 'Update Profile Image'}
                  </button>
                </div>
              ) : !isCurrentUser && (
                <div className="mt-4">
                  <ConnectionButton
                    targetUserId={userId}
                    initialConnectionStatus={connectionStatus}
                    onStatusChange={(status) => setConnectionStatus(status)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bio Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">About</h2>
            {isCurrentUser && (
              <button
                onClick={() => setEditMode({ ...editMode, bio: !editMode.bio })}
                className="text-blue-500 hover:text-blue-700"
              >
                {editMode.bio ? 'Cancel' : 'Edit'}
              </button>
            )}
          </div>

          {editMode.bio ? (
            <div>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded min-h-[100px]"
                placeholder="Write something about yourself..."
              />
              <button
                onClick={handleBioUpdate}
                disabled={loading}
                className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          ) : (
            <p className="text-gray-700">
              {bio || 'No bio added yet. Click Edit to add your bio.'}
            </p>
          )}
        </div>

        {/* Education Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Education</h2>
            {isCurrentUser && (
              <button
                onClick={() => setEditMode({ ...editMode, education: !editMode.education })}
                className="text-blue-500 hover:text-blue-700"
              >
                {editMode.education ? 'Cancel' : 'Edit'}
              </button>
            )}
          </div>

          {editMode.education ? (
            <div>
              {education.map((edu, index) => (
                <div key={index} className="mb-6 p-4 border border-gray-200 rounded">
                  <div className="flex justify-between">
                    <h3 className="font-medium">Education #{index + 1}</h3>
                    {education.length > 1 && (
                      <button
                        onClick={() => removeEducation(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">School</label>
                      <input
                        type="text"
                        value={edu.school}
                        onChange={(e) => handleEducationChange(index, 'school', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                        placeholder="University/School name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Degree</label>
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) => handleEducationChange(index, 'degree', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                        placeholder="e.g. Bachelor's"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Field of Study</label>
                      <input
                        type="text"
                        value={edu.fieldOfStudy}
                        onChange={(e) => handleEducationChange(index, 'fieldOfStudy', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                        placeholder="e.g. Computer Science"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Year</label>
                        <input
                          type="text"
                          value={edu.startYear}
                          onChange={(e) => handleEducationChange(index, 'startYear', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded"
                          placeholder="YYYY"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Year</label>
                        <input
                          type="text"
                          value={edu.endYear}
                          onChange={(e) => handleEducationChange(index, 'endYear', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded"
                          placeholder="YYYY or Present"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex justify-between mt-4">
                <button
                  onClick={addEducation}
                  className="text-blue-500 hover:text-blue-700"
                >
                  + Add Another Education
                </button>

                <button
                  onClick={handleEducationUpdate}
                  disabled={loading}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
                >
                  {loading ? 'Saving...' : 'Save Education'}
                </button>
              </div>
            </div>
          ) : (
            <div>
              {education.length > 0 && education[0].school ? (
                education.map((edu, index) => (
                  <div key={index} className="mb-4 last:mb-0">
                    <h3 className="font-medium">{edu.school}</h3>
                    <p className="text-gray-700">{edu.degree} {edu.fieldOfStudy && `in ${edu.fieldOfStudy}`}</p>
                    <p className="text-gray-500 text-sm">{edu.startYear} - {edu.endYear}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-700">No education added yet. Click Edit to add your education history.</p>
              )}
            </div>
          )}
        </div>

        {/* Experience Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Experience</h2>
            {isCurrentUser && (
              <button
                onClick={() => setEditMode({ ...editMode, experience: !editMode.experience })}
                className="text-blue-500 hover:text-blue-700"
              >
                {editMode.experience ? 'Cancel' : 'Edit'}
              </button>
            )}
          </div>

          {editMode.experience ? (
            <div>
              {experience.map((exp, index) => (
                <div key={index} className="mb-6 p-4 border border-gray-200 rounded">
                  <div className="flex justify-between">
                    <h3 className="font-medium">Experience #{index + 1}</h3>
                    {experience.length > 1 && (
                      <button
                        onClick={() => removeExperience(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                      <input
                        type="text"
                        value={exp.title}
                        onChange={(e) => handleExperienceChange(index, 'title', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                        placeholder="e.g. Software Engineer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                      <input
                        type="text"
                        value={exp.company}
                        onChange={(e) => handleExperienceChange(index, 'company', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                        placeholder="Company name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                      <input
                        type="text"
                        value={exp.location}
                        onChange={(e) => handleExperienceChange(index, 'location', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                        placeholder="e.g. New York, NY"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input
                          type="text"
                          value={exp.startDate}
                          onChange={(e) => handleExperienceChange(index, 'startDate', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded"
                          placeholder="MM/YYYY"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <input
                          type="text"
                          value={exp.endDate}
                          onChange={(e) => handleExperienceChange(index, 'endDate', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded"
                          placeholder="MM/YYYY or Present"
                        />
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={exp.description}
                        onChange={(e) => handleExperienceChange(index, 'description', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded min-h-[80px]"
                        placeholder="Describe your responsibilities and achievements..."
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex justify-between mt-4">
                <button
                  onClick={addExperience}
                  className="text-blue-500 hover:text-blue-700"
                >
                  + Add Another Experience
                </button>

                <button
                  onClick={handleExperienceUpdate}
                  disabled={loading}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
                >
                  {loading ? 'Saving...' : 'Save Experience'}
                </button>
              </div>
            </div>
          ) : (
            <div>
              {experience.length > 0 && experience[0].title ? (
                experience.map((exp, index) => (
                  <div key={index} className="mb-6 last:mb-0">
                    <h3 className="font-medium">{exp.title}</h3>
                    <p className="text-gray-700">{exp.company} {exp.location && `• ${exp.location}`}</p>
                    <p className="text-gray-500 text-sm">{exp.startDate} - {exp.endDate}</p>
                    {exp.description && (
                      <p className="text-gray-700 mt-2">{exp.description}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-700">No experience added yet. Click Edit to add your work experience.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
