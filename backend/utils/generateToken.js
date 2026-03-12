import jwt from "jsonwebtoken";

/**
 * Generate JWT access token
 * @param {string} userId - User's MongoDB ObjectId
 * @param {string} role - User's role
 * @returns {string} JWT token
 */
export const generateAccessToken = (userId, role = "buyer") => {
  return jwt.sign(
    {
      userId,
      role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    }
  );
};

/**
 * Generate JWT refresh token (longer expiry)
 * @param {string} userId - User's MongoDB ObjectId
 * @returns {string} JWT refresh token
 */
export const generateRefreshToken = (userId) => {
  return jwt.sign(
    {
      userId,
      type: "refresh",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "30d",
    }
  );
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {object|null} Decoded token payload or null if invalid
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Generate both access and refresh tokens
 * @param {string} userId - User's MongoDB ObjectId
 * @param {string} role - User's role
 * @returns {object} Object containing accessToken and refreshToken
 */
export const generateTokenPair = (userId, role = "buyer") => {
  return {
    accessToken: generateAccessToken(userId, role),
    refreshToken: generateRefreshToken(userId),
  };
};

export default {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  generateTokenPair,
};
