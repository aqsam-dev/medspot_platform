const jwt = require('jsonwebtoken');


const verifyToken = (req, res, next) => {
     const authHeader = req.headers['authorization'];
     const token = authHeader && authHeader.startsWith('Bearer ') 
        ? authHeader.split(' ')[1] 
        : null;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Access Denied: Login required to access this profile."
        });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        console.error("Token Verification Error:", err.message);
        return res.status(403).json({
            success: false,
            message: "Invalid or Expired Token. Please login again."
        });
    }
};

module.exports = { verifyToken };