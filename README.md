# LinkedIn Clone

A full-featured LinkedIn clone built with the MERN stack (MongoDB, Express, React, Node.js).

## Features

- User authentication (signup, login, password reset)
- User profiles with education, experience, and skills
- News feed with posts, likes, and comments
- Connection system (connect, follow, mutual connections)
- Messaging system with real-time chat
- Job posting and application system
- Notifications system
- Advanced search functionality

## Tech Stack

### Frontend
- React with Vite
- React Router for navigation
- Tailwind CSS for styling
- Socket.io client for real-time features
- Axios for API requests

### Backend
- Node.js with Express
- MongoDB with Mongoose
- JWT for authentication
- Socket.io for real-time features
- Multer for file uploads

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB database (local or Atlas)

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/linkedin-clone.git
cd linkedin-clone
```

2. Install dependencies
```bash
npm run install-all
```

3. Create a .env file in the backend directory with the following variables:
```
PORT=8000
MONGO_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
NODE_ENVIRONMENT=development
```

4. Start the development server
```bash
npm run dev
```

## Deployment

### Deploying to Heroku

1. Create a Heroku account and install the Heroku CLI
2. Login to Heroku CLI
```bash
heroku login
```

3. Create a new Heroku app
```bash
heroku create your-app-name
```

4. Add MongoDB add-on or set environment variables for your MongoDB Atlas connection
```bash
heroku config:set MONGO_URL=your_mongodb_connection_string
heroku config:set JWT_SECRET=your_jwt_secret
heroku config:set NODE_ENVIRONMENT=production
```

5. Deploy to Heroku
```bash
git push heroku main
```

### Deploying to Render

1. Create a Render account
2. Create a new Web Service
3. Connect your GitHub repository
4. Set the following:
   - Build Command: `npm run install-all && npm run build`
   - Start Command: `npm start`
5. Add environment variables in the Render dashboard
6. Deploy

## License

This project is licensed under the MIT License - see the LICENSE file for details.
