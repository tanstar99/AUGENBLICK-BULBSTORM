import User from "../models/User.js";
import { generateAccessToken, generateRefreshToken, verifyToken } from "../utils/generateToken.js";
import { normalizePhoneForStorage } from "../utils/phone.js";

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res) => {
  try {
    const { email, password, name, phone, role } = req.body;

    // Validate required fields
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: "Please provide email, password, and name.",
      });
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    // Validate role (prevent self-registration as admin)
    const allowedRoles = ["buyer", "seller", "ngo", "logistics_partner"];
    const userRole = role && allowedRoles.includes(role) ? role : "buyer";

    const normalizedPhone = phone ? normalizePhoneForStorage(phone) : undefined;

    // Create user (password hashing happens in User model pre-save hook)
    const user = await User.create({
      email: email.toLowerCase(),
      password,
      name,
      phone: normalizedPhone || undefined,
      role: userRole,
    });

    // Generate tokens
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token to user
    user.refreshToken = refreshToken;
    await user.save();

    // Set cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    // Return response (exclude password)
    res.status(201).json({
      success: true,
      message: "Registration successful.",
      data: {
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
          avatar: user.avatar,
          isEmailVerified: user.isEmailVerified,
          createdAt: user.createdAt,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    // Handle validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    res.status(500).json({
      success: false,
      message: "Registration failed. Please try again.",
    });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password.",
      });
    }

    // Find user with password field (excluded by default)
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password"
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Check if user is banned
    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: "Your account has been suspended. Please contact support.",
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is deactivated.",
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token and update last login
    user.refreshToken = refreshToken;
    user.lastLoginAt = new Date();
    await user.save();

    // Set cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    // Return response
    res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
          avatar: user.avatar,
          address: user.address,
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified,
          impactStats: user.impactStats,
          rating: user.rating,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed. Please try again.",
    });
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res) => {
  try {
    // User is already attached by auth middleware
    const user = await User.findById(req.userId).select("-password -refreshToken");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user profile.",
    });
  }
};

/**
 * @desc    Update current user profile
 * @route   PATCH /api/auth/me
 * @access  Private
 */
export const updateMe = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      avatar,
      company,
      location,
    } = req.body;

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (name !== undefined) {
      user.name = String(name || "").trim();
    }

    if (email !== undefined) {
      const nextEmail = String(email || "").trim().toLowerCase();

      if (nextEmail && nextEmail !== user.email) {
        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!emailRegex.test(nextEmail)) {
          return res.status(400).json({
            success: false,
            message: "Please provide a valid email address.",
          });
        }

        const existingUser = await User.findOne({ email: nextEmail, _id: { $ne: user._id } });
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: "An account with this email already exists.",
          });
        }

        user.email = nextEmail;
      }
    }

    if (phone !== undefined) {
      const normalizedPhone = normalizePhoneForStorage(phone);
      user.phone = normalizedPhone || undefined;
    }

    if (avatar !== undefined) {
      user.avatar = avatar || null;
    }

    if (company !== undefined) {
      user.businessDetails = {
        ...(user.businessDetails || {}),
        companyName: String(company || "").trim(),
      };
    }

    if (location && typeof location === "object") {
      user.address = {
        ...(user.address || {}),
        street: location.address !== undefined ? String(location.address || "").trim() : user.address?.street,
        city: location.city !== undefined ? String(location.city || "").trim() : user.address?.city,
        state: location.state !== undefined ? String(location.state || "").trim() : user.address?.state,
        country: location.country !== undefined ? String(location.country || "").trim() : user.address?.country,
        pincode: location.postalCode !== undefined ? String(location.postalCode || "").trim() : user.address?.pincode,
      };
    }

    await user.save();

    const updatedUser = await User.findById(user._id).select("-password -refreshToken");

    res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update profile.",
    });
  }
};

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh-token
 * @access  Public (with refresh token)
 */
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken: tokenFromBody } = req.body;
    const tokenFromCookie = req.cookies?.refreshToken;

    const token = tokenFromBody || tokenFromCookie;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Refresh token required.",
      });
    }

    // Verify refresh token
    const decoded = verifyToken(token);
    if (!decoded || decoded.type !== "refresh") {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token.",
      });
    }

    // Find user and verify stored refresh token
    const user = await User.findById(decoded.userId).select("+refreshToken");
    if (!user || user.refreshToken !== token) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token.",
      });
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(user._id, user.role);
    const newRefreshToken = generateRefreshToken(user._id);

    // Update stored refresh token
    user.refreshToken = newRefreshToken;
    await user.save();

    // Set cookies
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: "Token refreshed successfully.",
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to refresh token.",
    });
  }
};

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logout = async (req, res) => {
  try {
    // Clear refresh token from database
    if (req.userId) {
      await User.findByIdAndUpdate(req.userId, { refreshToken: null });
    }

    // Clear cookies
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Logout failed.",
    });
  }
};

/**
 * @desc    Update password
 * @route   PUT /api/auth/update-password
 * @access  Private
 */
export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide current and new password.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long.",
      });
    }

    // Get user with password
    const user = await User.findById(req.userId).select("+password");

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    // Generate new tokens (invalidate old sessions)
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    // Set cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: "Password updated successfully.",
      data: {
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error("Update password error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update password.",
    });
  }
};

export default {
  register,
  login,
  getMe,
  updateMe,
  refreshToken,
  logout,
  updatePassword,
};
