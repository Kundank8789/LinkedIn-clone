import jwt from 'jsonwebtoken';

const isAuth = async (req, res, next) => {
    try {
        // Get token from cookie or Authorization header
        let token = req.cookies?.token;

        // Check for Authorization header if no cookie
        if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            console.log("No token found in request:", {
                cookies: req.cookies,
                headers: req.headers.authorization
            });
            return res.status(401).json({ message: "Not authenticated, please login" });
        }

        // Log token for debugging (only in development)
        if (process.env.NODE_ENVIRONMENT !== 'production') {
            console.log("Processing token:", token.substring(0, 10) + "...");
        }

        // Verify token
        let verifiedToken = jwt.verify(token, process.env.JWT_SECRET);

        if (!verifiedToken) {
            return res.status(400).json({ message: "User doesn't have a valid token" });
        }

        // Set userId in request object
        req.userId = verifiedToken.id;

        // Log successful authentication (only in development)
        if (process.env.NODE_ENVIRONMENT !== 'production') {
            console.log(`User authenticated: ${req.userId}`);
        }

        next();
    } catch (error) {
        console.log("Auth error:", error);

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: "Invalid token. Please login again." });
        } else if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: "Token expired. Please login again." });
        }

        return res.status(500).json({ message: "Authentication error. Please try again." });
    }
}

export default isAuth

