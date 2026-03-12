import Transaction from "../models/Transaction.js";
import Material from "../models/Material.js";
import User from "../models/User.js";
import Category from "../models/Category.js";
import AnalyticsEvent from "../models/AnalyticsEvent.js";
import LogisticsJob from "../models/LogisticsJob.js";
import mongoose from "mongoose";

/**
 * @desc    Get sustainability dashboard
 * @route   GET /api/analytics/dashboard
 * @access  Private
 */
export const getDashboard = async (req, res) => {
  try {
    const userId = req.userId;
    const { period = "all" } = req.query; // "week", "month", "year", "all"

    // Build date filter
    let dateFilter = {};
    const now = new Date();
    if (period === "week") {
      dateFilter = { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) };
    } else if (period === "month") {
      dateFilter = { $gte: new Date(now - 30 * 24 * 60 * 60 * 1000) };
    } else if (period === "year") {
      dateFilter = { $gte: new Date(now - 365 * 24 * 60 * 60 * 1000) };
    }

    // =====================
    // User-specific metrics
    // =====================
    const userTransactionQuery = {
      $or: [{ supplier: userId }, { receiver: userId }],
      status: "completed",
    };
    if (Object.keys(dateFilter).length > 0) {
      userTransactionQuery.completedAt = dateFilter;
    }

    const userTransactions = await Transaction.find(userTransactionQuery).lean();

    // Calculate user's impact
    const userMetrics = userTransactions.reduce(
      (acc, txn) => {
        acc.totalTransactions += 1;
        acc.wasteDivertedKg += txn.impactMetrics?.landfillDiverted || 0;
        acc.co2SavedKg += txn.impactMetrics?.co2Saved || 0;
        acc.weightDivertedKg += txn.impactMetrics?.weightDiverted || 0;
        return acc;
      },
      {
        totalTransactions: 0,
        wasteDivertedKg: 0,
        co2SavedKg: 0,
        weightDivertedKg: 0,
      }
    );

    // User's active listings
    const userActiveListings = await Material.countDocuments({
      listedBy: userId,
      status: "available",
    });

    // User's role breakdown (as supplier vs receiver)
    const userAsSupplier = userTransactions.filter(
      (t) => t.supplier.toString() === userId.toString()
    ).length;
    const userAsReceiver = userTransactions.filter(
      (t) => t.receiver.toString() === userId.toString()
    ).length;

    // =======================
    // Platform-wide metrics
    // =======================
    const platformTransactionQuery = {
      status: "completed",
    };
    if (Object.keys(dateFilter).length > 0) {
      platformTransactionQuery.completedAt = dateFilter;
    }

    const platformAggregation = await Transaction.aggregate([
      { $match: platformTransactionQuery },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalWasteDiverted: { $sum: "$impactMetrics.landfillDiverted" },
          totalCo2Saved: { $sum: "$impactMetrics.co2Saved" },
          totalWeightDiverted: { $sum: "$impactMetrics.weightDiverted" },
        },
      },
    ]);

    const platformMetrics = platformAggregation[0] || {
      totalTransactions: 0,
      totalWasteDiverted: 0,
      totalCo2Saved: 0,
      totalWeightDiverted: 0,
    };

    // Total active listings on platform
    const platformActiveListings = await Material.countDocuments({
      status: "available",
    });

    // Total users
    const totalUsers = await User.countDocuments({ isActive: true });

    // =======================
    // Category breakdown
    // =======================
    const categoryBreakdown = await Transaction.aggregate([
      { $match: { status: "completed" } },
      {
        $lookup: {
          from: "materials",
          localField: "material",
          foreignField: "_id",
          as: "materialData",
        },
      },
      { $unwind: "$materialData" },
      {
        $lookup: {
          from: "categories",
          localField: "materialData.category",
          foreignField: "_id",
          as: "categoryData",
        },
      },
      { $unwind: { path: "$categoryData", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$materialData.category",
          categoryName: { $first: "$categoryData.name" },
          count: { $sum: 1 },
          wasteDiverted: { $sum: "$impactMetrics.landfillDiverted" },
          co2Saved: { $sum: "$impactMetrics.co2Saved" },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // =======================
    // Recent activity
    // =======================
    const recentTransactions = await Transaction.find({
      $or: [{ supplier: userId }, { receiver: userId }],
    })
      .populate("material", "title images")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // =======================
    // Environmental equivalents (fun facts)
    // =======================
    const totalCo2 = platformMetrics.totalCo2Saved || 0;
    const environmentalEquivalents = {
      treesEquivalent: Math.round((totalCo2 / 21) * 10) / 10, // 1 tree absorbs ~21kg CO2/year
      carsOffRoadDays: Math.round((totalCo2 / 12) * 10) / 10, // Average car emits ~12kg CO2/day
      flightsAvoided: Math.round((totalCo2 / 90) * 10) / 10, // ~90kg CO2 per hour of flight
      homeEnergyDays: Math.round((totalCo2 / 17) * 10) / 10, // ~17kg CO2 per day home energy
    };

    res.status(200).json({
      success: true,
      data: {
        period,
        user: {
          metrics: {
            reuseCount: userMetrics.totalTransactions,
            wasteDivertedKg: Math.round(userMetrics.wasteDivertedKg * 100) / 100,
            co2SavedKg: Math.round(userMetrics.co2SavedKg * 100) / 100,
            weightDivertedKg: Math.round(userMetrics.weightDivertedKg * 100) / 100,
          },
          activity: {
            activeListings: userActiveListings,
            asSupplier: userAsSupplier,
            asReceiver: userAsReceiver,
          },
          recentTransactions: recentTransactions.map((t) => ({
            id: t._id,
            material: t.material?.title,
            status: t.status,
            impactMetrics: t.impactMetrics,
            date: t.createdAt,
          })),
        },
        platform: {
          metrics: {
            reuseCount: platformMetrics.totalTransactions,
            wasteDivertedKg: Math.round(platformMetrics.totalWasteDiverted * 100) / 100,
            co2SavedKg: Math.round(platformMetrics.totalCo2Saved * 100) / 100,
            weightDivertedKg: Math.round(platformMetrics.totalWeightDiverted * 100) / 100,
          },
          stats: {
            activeListings: platformActiveListings,
            totalUsers,
          },
          environmentalEquivalents,
        },
        categoryBreakdown: categoryBreakdown.map((c) => ({
          categoryId: c._id,
          categoryName: c.categoryName || "Unknown",
          transactionCount: c.count,
          wasteDivertedKg: Math.round(c.wasteDiverted * 100) / 100,
          co2SavedKg: Math.round(c.co2Saved * 100) / 100,
        })),
      },
    });
  } catch (error) {
    console.error("Get dashboard error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard.",
    });
  }
};

/**
 * @desc    Get sustainability metrics for current user
 * @route   GET /api/analytics/impact
 * @access  Private
 */
export const getUserImpact = async (req, res) => {
  try {
    const userId = req.userId;

    // Get user's impact stats from their profile
    const user = await User.findById(userId).select("impactStats name").lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Calculate detailed impact from transactions
    const completedTransactions = await Transaction.find({
      $or: [{ supplier: userId }, { receiver: userId }],
      status: "completed",
    })
      .populate("material", "title category")
      .lean();

    // Monthly breakdown
    const monthlyImpact = await Transaction.aggregate([
      {
        $match: {
          $or: [{ supplier: userId }, { receiver: userId }],
          status: "completed",
          completedAt: { $exists: true },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$completedAt" },
            month: { $month: "$completedAt" },
          },
          transactions: { $sum: 1 },
          wasteDiverted: { $sum: "$impactMetrics.landfillDiverted" },
          co2Saved: { $sum: "$impactMetrics.co2Saved" },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 12 },
    ]);

    // Calculate ranking among users
    const userRanking = await User.aggregate([
      {
        $match: { isActive: true },
      },
      {
        $project: {
          name: 1,
          totalImpact: {
            $add: [
              { $ifNull: ["$impactStats.weightDiverted", 0] },
              { $multiply: [{ $ifNull: ["$impactStats.co2Saved", 0] }, 0.5] },
            ],
          },
        },
      },
      { $sort: { totalImpact: -1 } },
    ]);

    const userRank = userRanking.findIndex(
      (u) => u._id.toString() === userId.toString()
    ) + 1;

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalTransactions: user.impactStats?.totalTransactions || 0,
          totalListings: user.impactStats?.totalListings || 0,
          wasteDivertedKg: Math.round((user.impactStats?.weightDiverted || 0) * 100) / 100,
          co2SavedKg: Math.round((user.impactStats?.co2Saved || 0) * 100) / 100,
          landfillDivertedKg: Math.round((user.impactStats?.weightDiverted || 0) * 100) / 100,
        },
        ranking: {
          position: userRank,
          totalUsers: userRanking.length,
          percentile: Math.round((1 - userRank / userRanking.length) * 100),
        },
        monthlyBreakdown: monthlyImpact.map((m) => ({
          year: m._id.year,
          month: m._id.month,
          transactions: m.transactions,
          wasteDivertedKg: Math.round(m.wasteDiverted * 100) / 100,
          co2SavedKg: Math.round(m.co2Saved * 100) / 100,
        })),
        recentTransactions: completedTransactions.slice(0, 10).map((t) => ({
          id: t._id,
          material: t.material?.title,
          impactMetrics: t.impactMetrics,
          completedAt: t.completedAt,
        })),
      },
    });
  } catch (error) {
    console.error("Get user impact error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch impact metrics.",
    });
  }
};

/**
 * @desc    Get platform-wide leaderboard
 * @route   GET /api/analytics/leaderboard
 * @access  Public/Private
 */
export const getLeaderboard = async (req, res) => {
  try {
    const { metric = "co2Saved", limit = 20 } = req.query;

    const validMetrics = ["co2Saved", "weightDiverted", "totalTransactions"];
    const sortField = validMetrics.includes(metric) ? metric : "co2Saved";

    const leaderboard = await User.find({ isActive: true })
      .select("name avatar impactStats role")
      .sort({ [`impactStats.${sortField}`]: -1 })
      .limit(Math.min(100, parseInt(limit)))
      .lean();

    // Add rank to each entry
    const rankedLeaderboard = leaderboard.map((user, index) => ({
      rank: index + 1,
      id: user._id,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
      metrics: {
        co2SavedKg: Math.round((user.impactStats?.co2Saved || 0) * 100) / 100,
        wasteDivertedKg: Math.round((user.impactStats?.weightDiverted || 0) * 100) / 100,
        totalTransactions: user.impactStats?.totalTransactions || 0,
      },
    }));

    // If user is authenticated, find their rank
    let userPosition = null;
    if (req.userId) {
      const allUsers = await User.find({ isActive: true })
        .select("_id")
        .sort({ [`impactStats.${sortField}`]: -1 })
        .lean();
      
      const userIndex = allUsers.findIndex(
        (u) => u._id.toString() === req.userId.toString()
      );
      userPosition = userIndex >= 0 ? userIndex + 1 : null;
    }

    res.status(200).json({
      success: true,
      data: {
        metric: sortField,
        leaderboard: rankedLeaderboard,
        userPosition,
        totalParticipants: leaderboard.length,
      },
    });
  } catch (error) {
    console.error("Get leaderboard error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch leaderboard.",
    });
  }
};

/**
 * @desc    Track an analytics event
 * @route   POST /api/analytics/events
 * @access  Private/Public (with session)
 */
export const trackEvent = async (req, res) => {
  try {
    const {
      eventType,
      entities,
      properties,
      context,
      device,
      sessionId,
    } = req.body;

    if (!eventType) {
      return res.status(400).json({
        success: false,
        message: "Event type is required.",
      });
    }

    const event = new AnalyticsEvent({
      eventType,
      user: req.userId || null,
      sessionId: sessionId || null,
      entities: entities || {},
      properties: properties || {},
      context: context || { source: "web" },
      device: device || {},
    });

    await event.save();

    res.status(201).json({
      success: true,
      message: "Event tracked.",
      data: { eventId: event._id },
    });
  } catch (error) {
    console.error("Track event error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to track event.",
    });
  }
};

/**
 * @desc    Calculate sustainability metrics for a material/transaction
 * @route   POST /api/analytics/calculate-impact
 * @access  Private
 */
export const calculateImpact = async (req, res) => {
  try {
    const { categoryId, weightKg, quantity, unit } = req.body;

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: "Category ID is required.",
      });
    }

    // Get category impact factors
    const category = await Category.findById(categoryId).lean();
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    const { co2PerKg = 2.5, landfillDiversionFactor = 1.0 } = category.impactFactors || {};

    // Calculate weight if not provided
    let estimatedWeight = weightKg || 0;
    if (!weightKg && quantity && unit) {
      // Default weight estimates per unit type
      const unitWeights = {
        pieces: 1, // 1kg per piece (rough estimate)
        kg: 1,
        tons: 1000,
        cubic_meters: 500, // rough average
        square_meters: 10,
        liters: 1,
        units: 1,
      };
      estimatedWeight = quantity * (unitWeights[unit] || 1);
    }

    // Calculate metrics
    const co2Saved = estimatedWeight * co2PerKg;
    const landfillDiverted = estimatedWeight * landfillDiversionFactor;

    res.status(200).json({
      success: true,
      data: {
        category: {
          id: category._id,
          name: category.name,
          impactFactors: category.impactFactors,
        },
        estimatedImpact: {
          weightKg: Math.round(estimatedWeight * 100) / 100,
          co2SavedKg: Math.round(co2Saved * 100) / 100,
          landfillDivertedKg: Math.round(landfillDiverted * 100) / 100,
        },
        equivalents: {
          treesEquivalent: Math.round((co2Saved / 21) * 10) / 10,
          drivingKmAvoided: Math.round((co2Saved / 0.21) * 10) / 10, // ~0.21kg CO2 per km
        },
      },
    });
  } catch (error) {
    console.error("Calculate impact error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to calculate impact.",
    });
  }
};

/**
 * @desc    Get aggregated platform statistics (public)
 * @route   GET /api/analytics/stats
 * @access  Public
 */
export const getPlatformStats = async (req, res) => {
  try {
    // Aggregate all completed transactions
    const transactionStats = await Transaction.aggregate([
      { $match: { status: "completed" } },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalWasteDiverted: { $sum: "$impactMetrics.landfillDiverted" },
          totalCo2Saved: { $sum: "$impactMetrics.co2Saved" },
          totalWeight: { $sum: "$impactMetrics.weightDiverted" },
        },
      },
    ]);

    const stats = transactionStats[0] || {
      totalTransactions: 0,
      totalWasteDiverted: 0,
      totalCo2Saved: 0,
      totalWeight: 0,
    };

    // Count totals
    const [totalUsers, totalListings, totalCategories] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Material.countDocuments({ status: "available" }),
      Category.countDocuments({ isActive: true }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        impact: {
          reuseCount: stats.totalTransactions,
          wasteDivertedKg: Math.round(stats.totalWasteDiverted * 100) / 100,
          co2SavedKg: Math.round(stats.totalCo2Saved * 100) / 100,
        },
        platform: {
          totalUsers,
          activeListings: totalListings,
          categories: totalCategories,
        },
        equivalents: {
          treesPlanted: Math.round((stats.totalCo2Saved / 21) * 10) / 10,
          carsOffRoad: Math.round((stats.totalCo2Saved / 4600) * 10) / 10, // ~4600kg CO2/car/year
        },
      },
    });
  } catch (error) {
    console.error("Get platform stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch platform statistics.",
    });
  }
};

/**
 * @desc    Get logistics statistics
 * @route   GET /api/analytics/logistics
 * @access  Private
 */
export const getLogisticsStats = async (req, res) => {
  try {
    const userId = req.userId;

    // User's logistics jobs
    const userJobs = await LogisticsJob.find({
      $or: [{ supplier: userId }, { receiver: userId }],
    }).lean();

    const jobsByStatus = userJobs.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {});

    // Calculate total distance covered
    const completedJobs = userJobs.filter((j) => j.status === "delivered");
    const totalDistance = completedJobs.reduce(
      (sum, job) => sum + (job.distance?.value || 0),
      0
    );

    // Platform-wide logistics stats
    const platformLogisticsStats = await LogisticsJob.aggregate([
      { $match: { status: "delivered" } },
      {
        $group: {
          _id: null,
          totalDeliveries: { $sum: 1 },
          totalDistance: { $sum: "$distance.value" },
          avgDeliveryTime: {
            $avg: {
              $subtract: ["$actualDeliveryTime", "$actualPickupTime"],
            },
          },
        },
      },
    ]);

    const platformStats = platformLogisticsStats[0] || {
      totalDeliveries: 0,
      totalDistance: 0,
      avgDeliveryTime: 0,
    };

    res.status(200).json({
      success: true,
      data: {
        user: {
          totalJobs: userJobs.length,
          jobsByStatus,
          completedDeliveries: completedJobs.length,
          totalDistanceKm: Math.round(totalDistance / 1000 * 100) / 100,
        },
        platform: {
          totalDeliveries: platformStats.totalDeliveries,
          totalDistanceKm: Math.round(platformStats.totalDistance / 1000 * 100) / 100,
          avgDeliveryTimeMinutes: Math.round(platformStats.avgDeliveryTime / 60000),
        },
      },
    });
  } catch (error) {
    console.error("Get logistics stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch logistics statistics.",
    });
  }
};

export default {
  getDashboard,
  getUserImpact,
  getLeaderboard,
  trackEvent,
  calculateImpact,
  getPlatformStats,
  getLogisticsStats,
};
