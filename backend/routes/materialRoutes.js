import express from "express";
import {
  createMaterial,
  getMaterials,
  getNearbyMaterials,
  getMaterial,
  updateMaterial,
  deleteMaterial,
  getMyListings,
  searchMaterials,
  getCategories,
} from "../controllers/materialController.js";
import { authenticate, optionalAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// ==========================================
// Public routes (no auth required)
// ==========================================

/**
 * @route   GET /api/materials/categories
 * @desc    Get all material categories
 * @access  Public
 */
router.get("/categories", getCategories);

/**
 * @route   GET /api/materials/nearby
 * @desc    Get materials near a location
 * @access  Public
 * @query   latitude, longitude, radius (km), limit, category, condition, priceType
 */
router.get("/nearby", getNearbyMaterials);

/**
 * @route   GET /api/materials/search
 * @desc    Search materials with text search
 * @access  Public
 * @query   q (search query), page, limit, category, city, latitude, longitude, radius
 */
router.get("/search", searchMaterials);

/**
 * @route   GET /api/materials
 * @desc    Get all materials with filtering and pagination
 * @access  Public
 * @query   page, limit, category, subcategory, condition, priceType, minPrice, maxPrice, city, status, sortBy, sortOrder, search, listedBy
 */
router.get("/", getMaterials);

// ==========================================
// Protected routes (auth required)
// ==========================================

/**
 * @route   GET /api/materials/my-listings
 * @desc    Get current user's material listings
 * @access  Private
 * @query   page, limit, status
 */
router.get("/my-listings", authenticate, getMyListings);

/**
 * @route   POST /api/materials
 * @desc    Create a new material listing
 * @access  Private
 */
router.post("/", authenticate, createMaterial);

/**
 * @route   GET /api/materials/:id
 * @desc    Get single material by ID
 * @access  Public
 */
router.get("/:id", optionalAuth, getMaterial);

/**
 * @route   PATCH /api/materials/:id
 * @desc    Update a material listing
 * @access  Private (owner only)
 */
router.patch("/:id", authenticate, updateMaterial);

/**
 * @route   DELETE /api/materials/:id
 * @desc    Delete a material listing (soft delete)
 * @access  Private (owner or admin)
 */
router.delete("/:id", authenticate, deleteMaterial);

export default router;
