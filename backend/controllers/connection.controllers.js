import User from "../models/user.model.js";

// Send connection request
export const sendConnectionRequest = async (req, res) => {
    try {
        const { userId, targetUserId } = req.body;

        // Validate input
        if (userId === targetUserId) {
            return res.status(400).json({ message: "You cannot connect with yourself" });
        }

        // Find both users
        const [user, targetUser] = await Promise.all([
            User.findById(userId),
            User.findById(targetUserId)
        ]);

        if (!user || !targetUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if already connected
        if (user.connections.includes(targetUserId)) {
            return res.status(400).json({ message: "Already connected with this user" });
        }

        // Check if request already sent
        if (targetUser.connectionRequests.includes(userId)) {
            return res.status(400).json({ message: "Connection request already sent" });
        }

        // Add to connection requests
        targetUser.connectionRequests.push(userId);
        await targetUser.save();

        // Emit socket event for real-time notification
        const io = req.app.get('io');
        if (io) {
            io.to(targetUserId).emit('connection_request', {
                targetUserId,
                senderInfo: {
                    id: userId,
                    name: `${user.firstName} ${user.lastName}`
                }
            });
        }

        res.status(200).json({ message: "Connection request sent successfully" });
    } catch (error) {
        console.error("Send connection request error:", error);
        res.status(500).json({ message: error.message || "Error sending connection request" });
    }
};

// Accept connection request
export const acceptConnectionRequest = async (req, res) => {
    try {
        const { userId, requesterId } = req.body;

        // Find both users
        const [user, requester] = await Promise.all([
            User.findById(userId),
            User.findById(requesterId)
        ]);

        if (!user || !requester) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if request exists
        if (!user.connectionRequests.includes(requesterId)) {
            return res.status(400).json({ message: "No connection request from this user" });
        }

        // Remove from connection requests
        user.connectionRequests = user.connectionRequests.filter(
            id => id.toString() !== requesterId
        );

        // Add to connections for both users
        user.connections.push(requesterId);
        requester.connections.push(userId);

        // Save both users
        await Promise.all([user.save(), requester.save()]);

        // Emit socket event for real-time notification
        const io = req.app.get('io');
        if (io) {
            io.to(requesterId).emit('connection_accepted', {
                targetUserId: requesterId,
                accepterInfo: {
                    id: userId,
                    name: `${user.firstName} ${user.lastName}`
                }
            });
        }

        res.status(200).json({ message: "Connection request accepted" });
    } catch (error) {
        console.error("Accept connection request error:", error);
        res.status(500).json({ message: error.message || "Error accepting connection request" });
    }
};

// Reject connection request
export const rejectConnectionRequest = async (req, res) => {
    try {
        const { userId, requesterId } = req.body;

        // Find user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if request exists
        if (!user.connectionRequests.includes(requesterId)) {
            return res.status(400).json({ message: "No connection request from this user" });
        }

        // Remove from connection requests
        user.connectionRequests = user.connectionRequests.filter(
            id => id.toString() !== requesterId
        );

        // Save user
        await user.save();

        res.status(200).json({ message: "Connection request rejected" });
    } catch (error) {
        console.error("Reject connection request error:", error);
        res.status(500).json({ message: error.message || "Error rejecting connection request" });
    }
};

// Remove connection
export const removeConnection = async (req, res) => {
    try {
        const { userId, connectionId } = req.body;

        // Find both users
        const [user, connection] = await Promise.all([
            User.findById(userId),
            User.findById(connectionId)
        ]);

        if (!user || !connection) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if connected
        if (!user.connections.includes(connectionId)) {
            return res.status(400).json({ message: "Not connected with this user" });
        }

        // Remove from connections for both users
        user.connections = user.connections.filter(
            id => id.toString() !== connectionId
        );
        connection.connections = connection.connections.filter(
            id => id.toString() !== userId
        );

        // Save both users
        await Promise.all([user.save(), connection.save()]);

        res.status(200).json({ message: "Connection removed successfully" });
    } catch (error) {
        console.error("Remove connection error:", error);
        res.status(500).json({ message: error.message || "Error removing connection" });
    }
};

// Get connection requests
export const getConnectionRequests = async (req, res) => {
    try {
        const { userId } = req.params;

        // Find user and populate connection requests
        const user = await User.findById(userId)
            .populate('connectionRequests', 'firstName lastName userName profileImage headline');

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user.connectionRequests);
    } catch (error) {
        console.error("Get connection requests error:", error);
        res.status(500).json({ message: error.message || "Error getting connection requests" });
    }
};

// Get connections
export const getConnections = async (req, res) => {
    try {
        const { userId } = req.params;

        // Find user and populate connections
        const user = await User.findById(userId)
            .populate('connections', 'firstName lastName userName profileImage headline');

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user.connections);
    } catch (error) {
        console.error("Get connections error:", error);
        res.status(500).json({ message: error.message || "Error getting connections" });
    }
};

// Follow a user
export const followUser = async (req, res) => {
    try {
        const { userId, targetUserId } = req.body;

        // Validate input
        if (userId === targetUserId) {
            return res.status(400).json({ message: "You cannot follow yourself" });
        }

        // Find both users
        const [user, targetUser] = await Promise.all([
            User.findById(userId),
            User.findById(targetUserId)
        ]);

        if (!user || !targetUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if already following
        if (user.following.includes(targetUserId)) {
            return res.status(400).json({ message: "Already following this user" });
        }

        // Add to following/followers
        user.following.push(targetUserId);
        targetUser.followers.push(userId);

        // Save both users
        await Promise.all([user.save(), targetUser.save()]);

        // Emit socket event for real-time notification
        const io = req.app.get('io');
        if (io) {
            io.to(targetUserId).emit('new_follower', {
                targetUserId,
                followerInfo: {
                    id: userId,
                    name: `${user.firstName} ${user.lastName}`
                }
            });
        }

        res.status(200).json({ message: "User followed successfully" });
    } catch (error) {
        console.error("Follow user error:", error);
        res.status(500).json({ message: error.message || "Error following user" });
    }
};

// Unfollow a user
export const unfollowUser = async (req, res) => {
    try {
        const { userId, targetUserId } = req.body;

        // Find both users
        const [user, targetUser] = await Promise.all([
            User.findById(userId),
            User.findById(targetUserId)
        ]);

        if (!user || !targetUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if following
        if (!user.following.includes(targetUserId)) {
            return res.status(400).json({ message: "Not following this user" });
        }

        // Remove from following/followers
        user.following = user.following.filter(
            id => id.toString() !== targetUserId
        );
        targetUser.followers = targetUser.followers.filter(
            id => id.toString() !== userId
        );

        // Save both users
        await Promise.all([user.save(), targetUser.save()]);

        res.status(200).json({ message: "User unfollowed successfully" });
    } catch (error) {
        console.error("Unfollow user error:", error);
        res.status(500).json({ message: error.message || "Error unfollowing user" });
    }
};

// Get followers
export const getFollowers = async (req, res) => {
    try {
        const { userId } = req.params;

        // Find user and populate followers
        const user = await User.findById(userId)
            .populate('followers', 'firstName lastName userName profileImage headline');

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user.followers);
    } catch (error) {
        console.error("Get followers error:", error);
        res.status(500).json({ message: error.message || "Error getting followers" });
    }
};

// Get following
export const getFollowing = async (req, res) => {
    try {
        const { userId } = req.params;

        // Find user and populate following
        const user = await User.findById(userId)
            .populate('following', 'firstName lastName userName profileImage headline');

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user.following);
    } catch (error) {
        console.error("Get following error:", error);
        res.status(500).json({ message: error.message || "Error getting following" });
    }
};

// Get connection status between two users
export const getConnectionStatus = async (req, res) => {
    try {
        const { userId, targetUserId } = req.params;

        // Find both users
        const [user, targetUser] = await Promise.all([
            User.findById(userId),
            User.findById(targetUserId)
        ]);

        if (!user || !targetUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check connection status
        let status = 'none';

        // Check if connected
        if (user.connections.includes(targetUserId)) {
            status = 'connected';

            // Check if also following
            if (user.following.includes(targetUserId)) {
                status = 'connected_following';
            }
        }
        // Check if following but not connected
        else if (user.following.includes(targetUserId)) {
            status = 'following';
        }
        // Check if pending connection request sent
        else if (targetUser.connectionRequests.includes(userId)) {
            status = 'pending_sent';
        }
        // Check if pending connection request received
        else if (user.connectionRequests.includes(targetUserId)) {
            status = 'pending_received';
        }

        // Get mutual connections
        const mutualConnections = user.connections.filter(conn =>
            targetUser.connections.includes(conn.toString())
        );

        // Get mutual connection count
        const mutualConnectionCount = mutualConnections.length;

        res.status(200).json({
            status,
            mutualConnectionCount,
            isFollowing: user.following.includes(targetUserId),
            isFollower: user.followers.includes(targetUserId)
        });
    } catch (error) {
        console.error("Get connection status error:", error);
        res.status(500).json({ message: error.message || "Error getting connection status" });
    }
};

// Get mutual connections between two users
export const getMutualConnections = async (req, res) => {
    try {
        const { userId, targetUserId } = req.params;

        // Find both users
        const [user, targetUser] = await Promise.all([
            User.findById(userId),
            User.findById(targetUserId)
        ]);

        if (!user || !targetUser) {
            return res.status(404).json({ message: "User not found" });
        }

        // Get mutual connections
        const mutualConnectionIds = user.connections.filter(conn =>
            targetUser.connections.includes(conn.toString())
        );

        // Get full user data for mutual connections
        const mutualConnections = await User.find(
            { _id: { $in: mutualConnectionIds } },
            'firstName lastName userName profileImage headline'
        );

        res.status(200).json(mutualConnections);
    } catch (error) {
        console.error("Get mutual connections error:", error);
        res.status(500).json({ message: error.message || "Error getting mutual connections" });
    }
};

// Get connection suggestions
export const getConnectionSuggestions = async (req, res) => {
    try {
        const { userId } = req.params;

        // Find user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Get user's connections and pending requests
        const excludeIds = [
            userId, // Exclude self
            ...user.connections, // Exclude existing connections
            ...user.connectionRequests // Exclude pending requests
        ];

        // Find users who are not already connected or have pending requests
        // Prioritize users with mutual connections
        const suggestions = await User.aggregate([
            { $match: { _id: { $nin: excludeIds.map(id => new mongoose.Types.ObjectId(id)) } } },
            // Add field for mutual connections count
            { $addFields: {
                mutualConnectionsCount: {
                    $size: {
                        $setIntersection: ["$connections", user.connections]
                    }
                }
            }},
            // Sort by mutual connections (descending) and then by name
            { $sort: { mutualConnectionsCount: -1, firstName: 1 } },
            // Limit to 10 suggestions
            { $limit: 10 },
            // Project only necessary fields
            { $project: {
                _id: 1,
                firstName: 1,
                lastName: 1,
                userName: 1,
                profileImage: 1,
                headline: 1,
                mutualConnectionsCount: 1
            }}
        ]);

        res.status(200).json(suggestions);
    } catch (error) {
        console.error("Get connection suggestions error:", error);
        res.status(500).json({ message: error.message || "Error getting connection suggestions" });
    }
};
