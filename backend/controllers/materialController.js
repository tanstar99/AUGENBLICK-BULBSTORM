import Material from "../models/Material.js";
import Category from "../models/Category.js";
import mongoose from "mongoose";

/**
 * @desc    Create a new material listing
 * @route   POST /api/materials
 * @access  Private
 */
export const createMaterial = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      subcategory,
      condition,
      quantity,
      unit,
      images,
      location,
      address,
      price,
      priceType,
      availableFrom,
      availableUntil,
      estimatedWeight,
      dimensions,
      tags,
      logisticsOptions,
    } = req.body;

    // Validate required fields
    if (!title || !description || !category || !quantity) {
      return res.status(400).json({
        success: false,
        message: "Please provide title, description, category, and quantity.",
      });
    }

    // Validate location
    if (!location?.coordinates || location.coordinates.length !== 2) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid location coordinates [longitude, latitude].",
      });
    }

    const [longitude, latitude] = location.coordinates;
    if (
      typeof longitude !== "number" ||
      typeof latitude !== "number" ||
      longitude < -180 ||
      longitude > 180 ||
      latitude < -90 ||
      latitude > 90
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid coordinates. Longitude must be -180 to 180, latitude -90 to 90.",
      });
    }

    // Validate category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: "Invalid category.",
      });
    }

    // Create material
    const material = await Material.create({
      title,
      description,
      category,
      subcategory,
      condition: condition || "good",
      quantity,
      availableQuantity: quantity,
      unit: unit || "pieces",
      images: images || [],
      location: {
        type: "Point",
        coordinates: location.coordinates,
      },
      address: address || {},
      listedBy: req.userId,
      price: price || 0,
      priceType: priceType || "free",
      availableFrom: availableFrom || new Date(),
      availableUntil,
      estimatedWeight,
      dimensions,
      tags: tags || [],
      logisticsOptions: logisticsOptions || { selfPickup: true, deliveryAvailable: false },
    });

    // Populate category for response
    await material.populate("category", "name slug icon");
    await material.populate("listedBy", "name avatar rating");

    res.status(201).json({
      success: true,
      message: "Material listed successfully.",
      data: {
        material,
      },
    });
  } catch (error) {
    console.error("Create material error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create material listing.",
    });
  }
};

/**
 * @desc    Get all materials with filtering and pagination
 * @route   GET /api/materials
 * @access  Public
 */
export const getMaterials = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      subcategory,
      condition,
      priceType,
      minPrice,
      maxPrice,
      city,
      status = "available",
      sortBy = "createdAt",
      sortOrder = "desc",
      search,
      listedBy,
    } = req.query;

    // Build query
    const query = {
      status,
      isApproved: true,
    };

    // Filters
    if (category) {
      query.category = mongoose.Types.ObjectId.isValid(category)
        ? category
        : null;
    }
    if (subcategory) query.subcategory = subcategory;
    if (condition) query.condition = condition;
    if (priceType) query.priceType = priceType;
    if (city) query["address.city"] = { $regex: city, $options: "i" };
    if (listedBy) query.listedBy = listedBy;

    // Price range
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);
    }

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Sort
    const sortOptions = {};
    const validSortFields = ["createdAt", "price", "views", "quantity"];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt";
    sortOptions[sortField] = sortOrder === "asc" ? 1 : -1;

    // Execute query
    const [materials, total] = await Promise.all([
      Material.find(query)
        .populate("category", "name slug icon")
        .populate("listedBy", "name avatar rating")
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Material.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        materials,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
          hasMore: pageNum * limitNum < total,
        },
      },
    });
  } catch (error) {
    console.error("Get materials error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch materials.",
    });
  }
};

/**
 * @desc    Get nearby materials using geospatial query
 * @route   GET /api/materials/nearby
 * @access  Public
 */
export const getNearbyMaterials = async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      radius = 10, // Default 10km
      limit = 20,
      category,
      condition,
      priceType,
    } = req.query;

    // Validate coordinates
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Please provide latitude and longitude.",
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const radiusKm = Math.min(100, Math.max(1, parseFloat(radius))); // 1-100km
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({
        success: false,
        message: "Invalid coordinates.",
      });
    }

    // Build base query
    const matchQuery = {
      status: "available",
      isApproved: true,
    };

    if (category && mongoose.Types.ObjectId.isValid(category)) {
      matchQuery.category = new mongoose.Types.ObjectId(category);
    }
    if (condition) matchQuery.condition = condition;
    if (priceType) matchQuery.priceType = priceType;

    // Use $geoNear aggregation for distance calculation
    const materials = await Material.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [lng, lat], // MongoDB uses [longitude, latitude]
          },
          distanceField: "distance", // Distance in meters
          maxDistance: radiusKm * 1000, // Convert km to meters
          spherical: true,
          query: matchQuery,
          key: "location", // Explicitly specify which 2dsphere index to use
        },
      },
      {
        $addFields: {
          distanceKm: { $round: [{ $divide: ["$distance", 1000] }, 2] },
        },
      },
      { $limit: limitNum },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
          pipeline: [{ $project: { name: 1, slug: 1, icon: 1 } }],
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "listedBy",
          foreignField: "_id",
          as: "listedBy",
          pipeline: [{ $project: { name: 1, avatar: 1, rating: 1 } }],
        },
      },
      { $unwind: { path: "$listedBy", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          title: 1,
          description: 1,
          category: 1,
          condition: 1,
          quantity: 1,
          availableQuantity: 1,
          unit: 1,
          images: 1,
          location: 1,
          address: 1,
          listedBy: 1,
          price: 1,
          priceType: 1,
          distance: 1,
          distanceKm: 1,
          createdAt: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        materials,
        searchParams: {
          latitude: lat,
          longitude: lng,
          radiusKm,
        },
        count: materials.length,
      },
    });
  } catch (error) {
    console.error("Get nearby materials error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch nearby materials.",
    });
  }
};

/**
 * @desc    Get single material by ID
 * @route   GET /api/materials/:id
 * @access  Public
 */
export const getMaterial = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid material ID.",
      });
    }

    const material = await Material.findById(id)
      .populate("category", "name slug icon description impactFactors")
      .populate("listedBy", "name avatar rating phone address createdAt");

    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Material not found.",
      });
    }

    // Increment view count (non-blocking)
    Material.findByIdAndUpdate(id, { $inc: { views: 1 } }).exec();

    res.status(200).json({
      success: true,
      data: {
        material,
      },
    });
  } catch (error) {
    console.error("Get material error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch material.",
    });
  }
};

/**
 * @desc    Update material
 * @route   PATCH /api/materials/:id
 * @access  Private (owner only)
 */
export const updateMaterial = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid material ID.",
      });
    }

    // Find material
    const material = await Material.findById(id);

    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Material not found.",
      });
    }

    // Check ownership
    if (material.listedBy.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own listings.",
      });
    }

    // Fields that can be updated
    const allowedUpdates = [
      "title",
      "description",
      "subcategory",
      "condition",
      "quantity",
      "availableQuantity",
      "unit",
      "images",
      "location",
      "address",
      "price",
      "priceType",
      "availableFrom",
      "availableUntil",
      "estimatedWeight",
      "dimensions",
      "tags",
      "logisticsOptions",
      "status",
    ];

    const updates = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    // Handle location update
    if (updates.location?.coordinates) {
      const [lng, lat] = updates.location.coordinates;
      if (
        typeof lng !== "number" ||
        typeof lat !== "number" ||
        lng < -180 ||
        lng > 180 ||
        lat < -90 ||
        lat > 90
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid coordinates.",
        });
      }
      updates.location = {
        type: "Point",
        coordinates: [lng, lat],
      };
    }

    // Update material
    const updatedMaterial = await Material.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate("category", "name slug icon")
      .populate("listedBy", "name avatar rating");

    res.status(200).json({
      success: true,
      message: "Material updated successfully.",
      data: {
        material: updatedMaterial,
      },
    });
  } catch (error) {
    console.error("Update material error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update material.",
    });
  }
};

/**
 * @desc    Delete material
 * @route   DELETE /api/materials/:id
 * @access  Private (owner or admin)
 */
export const deleteMaterial = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid material ID.",
      });
    }

    const material = await Material.findById(id);

    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Material not found.",
      });
    }

    // Check ownership or admin
    const isOwner = material.listedBy.toString() === req.userId.toString();
    const isAdmin = req.user?.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own listings.",
      });
    }

    // Check if material has active requests/transactions
    if (material.status === "reserved" || material.status === "partially_reserved") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete material with active requests. Cancel pending requests first.",
      });
    }

    // Soft delete by changing status
    material.status = "removed";
    await material.save();

    res.status(200).json({
      success: true,
      message: "Material deleted successfully.",
    });
  } catch (error) {
    console.error("Delete material error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete material.",
    });
  }
};

/**
 * @desc    Get current user's listings
 * @route   GET /api/materials/my-listings
 * @access  Private
 */
export const getMyListings = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const query = { listedBy: req.userId };
    if (status) query.status = status;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [materials, total] = await Promise.all([
      Material.find(query)
        .populate("category", "name slug icon")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Material.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        materials,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error("Get my listings error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch your listings.",
    });
  }
};

/**
 * @desc    Search materials with text search
 * @route   GET /api/materials/search
 * @access  Public
 */
export const searchMaterials = async (req, res) => {
  try {
    const {
      q,
      page = 1,
      limit = 20,
      category,
      city,
      latitude,
      longitude,
      radius,
    } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Search query must be at least 2 characters.",
      });
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query = {
      $text: { $search: q.trim() },
      status: "available",
      isApproved: true,
    };

    if (category && mongoose.Types.ObjectId.isValid(category)) {
      query.category = category;
    }
    if (city) {
      query["address.city"] = { $regex: city, $options: "i" };
    }

    // If coordinates provided, add geo filter
    if (latitude && longitude && radius) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      const radiusKm = parseFloat(radius);

      if (!isNaN(lat) && !isNaN(lng) && !isNaN(radiusKm)) {
        query.location = {
          $nearSphere: {
            $geometry: {
              type: "Point",
              coordinates: [lng, lat],
            },
            $maxDistance: radiusKm * 1000,
          },
        };
      }
    }

    const [materials, total] = await Promise.all([
      Material.find(query, { score: { $meta: "textScore" } })
        .populate("category", "name slug icon")
        .populate("listedBy", "name avatar rating")
        .sort({ score: { $meta: "textScore" } })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Material.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        materials,
        query: q,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error("Search materials error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search materials.",
    });
  }
};

/**
 * @desc    Get all categories
 * @route   GET /api/materials/categories
 * @access  Public
 */
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    res.status(200).json({
      success: true,
      data: {
        categories,
      },
    });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories.",
    });
  }
};

export default {
  createMaterial,
  getMaterials,
  getNearbyMaterials,
  getMaterial,
  updateMaterial,
  deleteMaterial,
  getMyListings,
  searchMaterials,
  getCategories,
};
