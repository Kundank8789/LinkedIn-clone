import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo2 from '../assets/logo2.png';
import { IoSearch } from "react-icons/io5";
import { TiHome } from "react-icons/ti";
import { FaUserFriends } from "react-icons/fa";
import { IoMdNotifications } from "react-icons/io";
import { MdWork } from "react-icons/md";
import { AiOutlineMessage } from "react-icons/ai";
import { AuthDataContext } from '../Context/AuthContext';
import axios from 'axios';
import defaultProfilePic from '../assets/dp.webp';

function Nav() {
  const navigate = useNavigate();
  const { serverUrl, currentUser, isLoggedIn, logout } = useContext(AuthDataContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications count
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!isLoggedIn || !currentUser) return;

      try {
        const response = await axios.get(
          `${serverUrl}/api/notifications/${currentUser._id}?page=1&limit=3`
        );

        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unreadCount);
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };

    fetchNotifications();

    // Set up interval to check for new notifications
    const intervalId = setInterval(fetchNotifications, 30000); // every 30 seconds

    return () => clearInterval(intervalId);
  }, [serverUrl, currentUser, isLoggedIn]);

  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    setSearchQuery('');
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <div className="w-full h-[60px] sm:h-[70px] md:h-[80px] bg-white fixed top-0 shadow-lg flex justify-center items-center z-50">
      <div className="container mx-auto px-2 sm:px-4 md:px-6 lg:px-8 flex justify-between items-center">
        {/* Left section - Logo and Search */}
        <div className='flex items-center gap-2 sm:gap-4 md:gap-6'>
          {/* Logo - responsive size */}
          <div>
            <img src={logo2} alt="LinkedIn" className='w-[35px] sm:w-[40px] md:w-[50px]'/>
          </div>

          {/* Mobile search icon */}
          <Link to="/search" className='md:hidden flex items-center justify-center cursor-pointer hover:bg-gray-100 p-2 rounded-full'>
            <IoSearch className='w-[20px] h-[20px] sm:w-[22px] sm:h-[22px] text-gray-600' />
          </Link>

          {/* Search form - hidden on mobile, visible on larger screens */}
          <form onSubmit={handleSearch} className='w-[200px] sm:w-[220px] md:w-[250px] lg:w-[300px] xl:w-[350px] h-[38px] md:h-[40px] bg-[#f0efe7] md:flex items-center gap-[10px] py-[5px] px-3 rounded-md hidden'>
            <div><IoSearch className='w-[20px] h-[20px] text-gray-600' /></div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='w-full h-full bg-transparent outline-none border-0 text-sm'
              placeholder='Search people, posts, jobs...'
            />
          </form>
        </div>

        {/* Right section - Navigation and Profile */}
        <div className='flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-6'>
          {/* Home */}
          <Link to="/feed" className='hidden lg:flex flex-col items-center justify-center text-gray-600 cursor-pointer hover:text-black'>
            <TiHome className='w-[22px] h-[22px] text-gray-600 hover:text-black'/>
            <div className='text-xs mt-1'>Home</div>
          </Link>

          {/* My Networks */}
          <Link to="/network" className='hidden lg:flex flex-col items-center justify-center text-gray-600 cursor-pointer hover:text-black'>
            <FaUserFriends className='w-[20px] h-[20px] text-gray-600 hover:text-black' />
            <div className='text-xs mt-1'>My Network</div>
          </Link>

          {/* Jobs */}
          <Link to="/jobs" className='hidden lg:flex flex-col items-center justify-center text-gray-600 cursor-pointer hover:text-black'>
            <MdWork className='w-[20px] h-[20px] text-gray-600 hover:text-black' />
            <div className='text-xs mt-1'>Jobs</div>
          </Link>

          {/* Messages */}
          <Link to="/messages" className='hidden lg:flex flex-col items-center justify-center text-gray-600 cursor-pointer hover:text-black'>
            <AiOutlineMessage className='w-[20px] h-[20px] text-gray-600 hover:text-black' />
            <div className='text-xs mt-1'>Messages</div>
          </Link>

          {/* Notifications */}
          <Link to="/notifications" className='hidden md:flex flex-col items-center justify-center text-gray-600 cursor-pointer hover:text-black relative group'>
            <div className="relative">
              <IoMdNotifications className='w-[22px] h-[22px] text-gray-600 group-hover:text-black' />
              {/* Notification badge */}
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-[16px] h-[16px] rounded-full flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </div>
              )}
            </div>
            <div className='text-xs mt-1 hidden lg:block'>Notifications</div>

            {/* Notification tooltip for medium devices */}
            <div className="absolute top-full right-0 mt-1 w-[300px] bg-white shadow-lg rounded-md p-2 border border-gray-200 hidden md:group-hover:block lg:hidden z-10">
              <div className="text-xs font-semibold mb-2 text-gray-800">Notifications</div>
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div key={notification._id} className="text-xs text-gray-600 border-b pb-1 mb-1">
                    {notification.content}
                  </div>
                ))
              ) : (
                <div className="text-xs text-gray-600">No new notifications</div>
              )}
              <div className="text-xs text-blue-600 mt-2 text-center">
                View all notifications
              </div>
            </div>
          </Link>

          {/* Profile picture with dropdown - always visible, responsive size */}
          <div className='relative group'>
            <div className='w-[35px] h-[35px] sm:w-[40px] sm:h-[40px] md:w-[45px] md:h-[45px] rounded-full overflow-hidden cursor-pointer border-2 border-transparent group-hover:border-gray-300'>
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
                className='w-full h-full object-cover'
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = defaultProfilePic;
                }}
              />
            </div>

            {/* Profile dropdown */}
            <div className="absolute top-full right-0 mt-1 w-[250px] bg-white shadow-lg rounded-md border border-gray-200 hidden group-hover:block z-10">
              {/* Profile section */}
              <div className="flex flex-col items-center py-4 border-b border-gray-200">
                <div className="w-[70px] h-[70px] rounded-full overflow-hidden mb-2">
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
                    className='w-full h-full object-cover'
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = defaultProfilePic;
                    }}
                  />
                </div>
                <div className="font-medium text-center">
                  {currentUser?.firstName} {currentUser?.lastName}
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  {currentUser?.headline || 'LinkedIn Member'}
                </div>
                <Link
                  to={`/profile/${currentUser?._id}`}
                  className="mt-2 text-blue-500 border border-blue-500 rounded-full py-1 px-6 text-sm hover:bg-blue-50 transition-colors"
                >
                  View Profile
                </Link>
              </div>

              {/* Menu items */}
              <div className="py-2 border-b border-gray-200">
                <Link to="/network" className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer">
                  <div className="mr-3">
                    <FaUserFriends className='w-[18px] h-[18px] text-gray-600' />
                  </div>
                  <div>My Network</div>
                </Link>
                <Link to="/jobs" className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer">
                  <div className="mr-3">
                    <MdWork className='w-[18px] h-[18px] text-gray-600' />
                  </div>
                  <div>Jobs</div>
                </Link>
                <Link to="/messages" className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer">
                  <div className="mr-3">
                    <AiOutlineMessage className='w-[18px] h-[18px] text-gray-600' />
                  </div>
                  <div>Messages</div>
                </Link>
              </div>

              {/* Sign out button */}
              <div className="py-2">
                <button
                  onClick={handleLogout}
                  className="w-[90%] mx-auto block text-red-500 border border-red-500 rounded-full py-2 text-sm hover:bg-red-50 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Nav
