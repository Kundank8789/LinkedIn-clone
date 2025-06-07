import express from 'express';
import authRouter from './routes/auth.routes.js';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import userRouter from './routes/user.routes.js';
import profileRouter from './routes/profileRoutes.js';
import postRouter from './routes/post.routes.js';
import connectionRouter from './routes/connection.routes.js';
import jobRouter from './routes/job.routes.js';
import messageRouter from './routes/message.routes.js';
import notificationRouter from './routes/notification.routes.js';
import searchRouter from './routes/search.routes.js';
import endorsementRouter from './routes/endorsement.routes.js';
import recommendationRouter from './routes/recommendation.routes.js';
import companyRouter from './routes/company.routes.js';
import analyticsRouter from './routes/analytics.routes.js';
import premiumRouter from './routes/premium.routes.js';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { Server } from 'socket.io';
import net from 'net';
dotenv.config();


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let app = express();
app.use(express.json());
app.use(cookieParser());
// Allow CORS from any origin during development
app.use(cors({
    origin: true, // Allow any origin
    credentials: true
}))


// Port is defined at the bottom of the file
app.get('/', (req, res) => {
    res.send('Hello World!');
})
// Serve static files from public directory
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Serve static files from sec directory
app.use('/sec', express.static(path.join(__dirname, '..', 'sec')));

// API Routes
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/profile", profileRouter);
app.use("/api/posts", postRouter);
app.use("/api/connections", connectionRouter);
app.use("/api/jobs", jobRouter);
app.use("/api/messages", messageRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/search", searchRouter);
app.use("/api/endorsements", endorsementRouter);
app.use("/api/recommendations", recommendationRouter);
app.use("/api/companies", companyRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/premium", premiumRouter);

// Create HTTP server
const server = http.createServer(app);

// Set up Socket.IO with more permissive CORS
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins
        methods: ["GET", "POST"],
        credentials: true,
        allowedHeaders: ["my-custom-header"],
        transports: ['websocket', 'polling']
    },
    pingTimeout: 60000 // Increase timeout
});

// Make io available to our controllers
app.set('io', io);

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Join a room (for private messaging)
    socket.on('join', (userId) => {
        socket.join(userId);
        console.log(`User ${userId} joined room ${userId}`);
    });

    // Join the global feed room
    socket.join('feed');
    console.log(`User joined feed room`);

    // Handle private message
    socket.on('private_message', async (data) => {
        const { message, recipientId } = data;

        // Emit to recipient's room
        io.to(recipientId).emit('receive_message', message);

        // Emit notification
        io.to(recipientId).emit('notification', {
            type: 'message',
            sender: message.sender,
            content: 'New message received'
        });
    });

    // Handle post actions
    socket.on('post_created', (post) => {
        // Broadcast to all users in the feed room
        io.to('feed').emit('new_post', post);
    });

    socket.on('post_updated', (post) => {
        io.to('feed').emit('update_post', post);
    });

    socket.on('post_deleted', (postId) => {
        io.to('feed').emit('delete_post', postId);
    });

    socket.on('post_liked', (data) => {
        io.to('feed').emit('update_post', data.post);

        // Notify post owner if someone else liked their post
        if (data.userId !== data.post.user._id) {
            io.to(data.post.user._id).emit('notification', {
                type: 'like',
                sender: data.userName,
                content: 'liked your post'
            });
        }
    });

    socket.on('comment_added', (data) => {
        io.to('feed').emit('update_post', data.post);

        // Notify post owner if someone else commented on their post
        if (data.userId !== data.post.user._id) {
            io.to(data.post.user._id).emit('notification', {
                type: 'comment',
                sender: data.userName,
                content: 'commented on your post'
            });
        }
    });

    // Handle connection events
    socket.on('connection_request', (data) => {
        const { targetUserId, senderInfo } = data;
        io.to(targetUserId).emit('notification', {
            type: 'connection_request',
            sender: senderInfo.name,
            senderId: senderInfo.id,
            content: 'sent you a connection request'
        });
    });

    socket.on('connection_accepted', (data) => {
        const { targetUserId, accepterInfo } = data;
        io.to(targetUserId).emit('notification', {
            type: 'connection_accepted',
            sender: accepterInfo.name,
            senderId: accepterInfo.id,
            content: 'accepted your connection request'
        });
    });

    socket.on('new_follower', (data) => {
        const { targetUserId, followerInfo } = data;
        io.to(targetUserId).emit('notification', {
            type: 'new_follower',
            sender: followerInfo.name,
            senderId: followerInfo.id,
            content: 'started following you'
        });
    });

    // Handle notifications
    socket.on('notification', (data) => {
        const { recipientId, notification } = data;
        io.to(recipientId).emit('notification', notification);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
    });
});

// Serve static files from the React app in production
if (process.env.NODE_ENVIRONMENT === 'production') {
    // Set static folder
    const frontendBuildPath = path.resolve(__dirname, '..', 'frontend', 'dist');
    app.use(express.static(frontendBuildPath));

    // Any routes not matched by API will be handled by the React app
    app.get('*', (req, res) => {
        res.sendFile(path.join(frontendBuildPath, 'index.html'));
    });
}

// Use a fixed port that's very unlikely to be in use
const PORT = 54321;

// Start the server with a simple approach
server.listen(PORT, () => {
    connectDB();
    console.log(`Server is running on port ${PORT}`);
    console.log(`Make sure your frontend is configured to use http://localhost:${PORT}`);

    // Add a route to expose the port to the frontend
    app.get('/api/server-info', (req, res) => {
        res.json({ port: PORT });
    });
});