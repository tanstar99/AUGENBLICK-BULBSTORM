import AiConversation from "../models/AiConversation.js";
import Material from "../models/Material.js";
import User from "../models/User.js";
import aiClient from "../utils/aiClient.js";
import mongoose from "mongoose";

// Map user-friendly types to valid enum values
const CONVERSATION_TYPE_MAP = {
  reuse_suggestion: "reuse_suggestion",
  categorization: "categorization",
  matching: "matching",
  general_assistant: "general_assistant",
  impact_analysis: "impact_analysis",
  price_suggestion: "price_suggestion",
  description_generation: "description_generation",
  // Additional user-friendly aliases
  sustainability_qa: "impact_analysis",
  sustainability: "impact_analysis",
  general: "general_assistant",
  chat: "general_assistant",
  reuse: "reuse_suggestion",
  categorize: "categorization",
  match: "matching",
  price: "price_suggestion",
  describe: "description_generation",
  impact: "impact_analysis",
};

/**
 * @desc    Chat with AI assistant
 * @route   POST /api/ai/chat
 * @access  Private
 */
export const chat = async (req, res) => {
  try {
    const {
      message,
      conversationId,
      type: rawType = "general_assistant",
      materialId,
      context: userContext = {},
    } = req.body;

    // Map user type to valid enum value
    const type = CONVERSATION_TYPE_MAP[rawType] || "general_assistant";

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Message is required.",
      });
    }

    const userId = req.userId;
    let conversation;
    let material = null;

    // Load material context if provided
    if (materialId && mongoose.Types.ObjectId.isValid(materialId)) {
      material = await Material.findById(materialId)
        .populate("category", "name impactFactors")
        .lean();
    }

    // Find or create conversation
    if (conversationId && mongoose.Types.ObjectId.isValid(conversationId)) {
      conversation = await AiConversation.findOne({
        _id: conversationId,
        user: userId,
        status: { $ne: "archived" },
      });

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: "Conversation not found.",
        });
      }
    } else {
      // Create new conversation
      conversation = new AiConversation({
        user: userId,
        type,
        title: message.substring(0, 100),
        material: materialId || null,
        messages: [],
        context: {
          materialData: material || null,
          userPreferences: userContext.preferences || null,
          locationData: userContext.location || null,
          previousInteractions: 0,
        },
        modelConfig: {
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          temperature: 0.7,
          maxTokens: 1000,
        },
      });
    }

    // Add user message
    conversation.messages.push({
      role: "user",
      content: message.trim(),
      timestamp: new Date(),
    });

    // Build message history for AI (last 10 messages for context)
    const messageHistory = conversation.messages.slice(-10).map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Prepare context for AI
    const aiContext = {
      material: material
        ? {
            title: material.title,
            description: material.description,
            category: material.category?.name,
            condition: material.condition,
            quantity: material.quantity,
            unit: material.unit,
            address: material.address,
          }
        : null,
      userPreferences: userContext.preferences,
    };

    // Call AI
    const aiResponse = await aiClient.chat({
      messages: messageHistory,
      context: aiContext,
      type: type.replace("_assistant", "").replace("_", " "),
      model: conversation.modelConfig.model,
      temperature: conversation.modelConfig.temperature,
      maxTokens: conversation.modelConfig.maxTokens,
    });

    // Add assistant response
    const assistantMessage = {
      role: "assistant",
      content: aiResponse.content,
      tokens: aiResponse.usage,
      model: aiResponse.model,
      responseTime: aiResponse.responseTime,
      timestamp: new Date(),
    };
    conversation.messages.push(assistantMessage);

    // Update usage statistics
    conversation.usage.totalTokens += aiResponse.usage?.total_tokens || 0;
    conversation.usage.totalMessages += 2;
    conversation.usage.totalResponseTime += aiResponse.responseTime || 0;
    
    // Estimate cost (rough estimate for GPT-4)
    const promptCost = (aiResponse.usage?.prompt_tokens || 0) * 0.00003;
    const completionCost = (aiResponse.usage?.completion_tokens || 0) * 0.00006;
    conversation.usage.estimatedCost += (promptCost + completionCost) * 100; // Convert to cents

    // Save conversation
    await conversation.save();

    res.status(200).json({
      success: true,
      data: {
        conversationId: conversation._id,
        message: {
          role: "assistant",
          content: aiResponse.content,
          timestamp: assistantMessage.timestamp,
        },
        usage: {
          tokens: aiResponse.usage,
          responseTime: aiResponse.responseTime,
          source: aiResponse.source,
        },
        isNewConversation: !conversationId,
      },
    });
  } catch (error) {
    console.error("AI chat error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process chat message.",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};

/**
 * @desc    Get conversation history
 * @route   GET /api/ai/conversations
 * @access  Private
 */
export const getConversations = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status = "active" } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const query = { user: req.userId };
    if (type) query.type = type;
    if (status !== "all") query.status = status;

    const [conversations, total] = await Promise.all([
      AiConversation.find(query)
        .select("title type status createdAt updatedAt usage.totalMessages")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      AiConversation.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        conversations,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error("Get conversations error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch conversations.",
    });
  }
};

/**
 * @desc    Get a single conversation with messages
 * @route   GET /api/ai/conversations/:id
 * @access  Private
 */
export const getConversation = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation ID.",
      });
    }

    const conversation = await AiConversation.findOne({
      _id: id,
      user: req.userId,
    })
      .populate("material", "title images")
      .lean();

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found.",
      });
    }

    res.status(200).json({
      success: true,
      data: { conversation },
    });
  } catch (error) {
    console.error("Get conversation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch conversation.",
    });
  }
};

/**
 * @desc    Analyze a material listing
 * @route   POST /api/ai/analyze-material
 * @access  Private
 */
export const analyzeMaterial = async (req, res) => {
  try {
    const { materialId } = req.body;

    if (!materialId || !mongoose.Types.ObjectId.isValid(materialId)) {
      return res.status(400).json({
        success: false,
        message: "Valid material ID is required.",
      });
    }

    const material = await Material.findById(materialId)
      .populate("category", "name impactFactors")
      .populate("listedBy", "name")
      .lean();

    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Material not found.",
      });
    }

    // Call AI to analyze
    const analysis = await aiClient.analyzeMaterial({
      title: material.title,
      description: material.description,
      category: material.category?.name,
      condition: material.condition,
      quantity: material.quantity,
      unit: material.unit,
      address: material.address,
    });

    // Create a conversation record for this analysis (optional - don't fail if it doesn't save)
    let conversationId = null;
    try {
      const conversation = new AiConversation({
        user: req.userId,
        type: "material_analysis",
        title: `Analysis: ${material.title}`.substring(0, 200),
        material: materialId,
        messages: [
          {
            role: "user",
            content: `Analyze material: ${material.title}`,
            timestamp: new Date(),
          },
          {
            role: "assistant",
            content: analysis.content,
            tokens: {
              prompt: analysis.usage?.prompt_tokens || 0,
              completion: analysis.usage?.completion_tokens || 0,
              total: analysis.usage?.total_tokens || 0,
            },
            model: analysis.model,
            responseTime: analysis.responseTime,
            timestamp: new Date(),
          },
        ],
        status: "completed",
      });
      await conversation.save();
      conversationId = conversation._id;
    } catch (saveError) {
      console.error("Failed to save conversation (non-critical):", saveError.message);
    }

    res.status(200).json({
      success: true,
      data: {
        analysis: analysis.content,
        material: {
          id: material._id,
          title: material.title,
        },
        conversationId,
        source: analysis.source,
      },
    });
  } catch (error) {
    console.error("Analyze material error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to analyze material.",
      ...(process.env.NODE_ENV === "development" && { error: error.message }),
    });
  }
};

/**
 * @desc    Get reuse suggestions for a material type
 * @route   POST /api/ai/reuse-suggestions
 * @access  Private
 */
export const getReuseSuggestions = async (req, res) => {
  try {
    const { materialType, condition = "good" } = req.body;

    if (!materialType) {
      return res.status(400).json({
        success: false,
        message: "Material type is required.",
      });
    }

    const suggestions = await aiClient.getReuseSuggestions(materialType, condition);

    res.status(200).json({
      success: true,
      data: {
        suggestions: suggestions.content,
        materialType,
        condition,
        source: suggestions.source,
      },
    });
  } catch (error) {
    console.error("Get reuse suggestions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get reuse suggestions.",
    });
  }
};

/**
 * @desc    Provide feedback on AI response
 * @route   POST /api/ai/conversations/:id/feedback
 * @access  Private
 */
export const provideFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { messageIndex, rating, comment, overallRating } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation ID.",
      });
    }

    const conversation = await AiConversation.findOne({
      _id: id,
      user: req.userId,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found.",
      });
    }

    // Update specific message feedback
    if (messageIndex !== undefined && conversation.messages[messageIndex]) {
      conversation.messages[messageIndex].feedback = {
        rating: rating || "neutral",
        comment: comment || "",
        givenAt: new Date(),
      };
    }

    // Update overall feedback
    if (overallRating) {
      conversation.overallFeedback = {
        rating: overallRating,
        comment: comment || "",
        givenAt: new Date(),
      };
    }

    await conversation.save();

    res.status(200).json({
      success: true,
      message: "Feedback recorded. Thank you!",
    });
  } catch (error) {
    console.error("Provide feedback error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to record feedback.",
    });
  }
};

/**
 * @desc    Delete/archive a conversation
 * @route   DELETE /api/ai/conversations/:id
 * @access  Private
 */
export const deleteConversation = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation ID.",
      });
    }

    const conversation = await AiConversation.findOneAndUpdate(
      { _id: id, user: req.userId },
      { status: "archived" },
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Conversation archived.",
    });
  } catch (error) {
    console.error("Delete conversation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to archive conversation.",
    });
  }
};

/**
 * @desc    Get AI service status
 * @route   GET /api/ai/status
 * @access  Public
 */
export const getStatus = async (req, res) => {
  try {
    const isOpenAIConfigured = aiClient.isOpenAIConfigured();

    res.status(200).json({
      success: true,
      data: {
        available: true,
        provider: isOpenAIConfigured ? "openai" : "mock",
        capabilities: [
          "chat",
          "material_analysis",
          "reuse_suggestions",
          "sustainability_qa",
        ],
        note: isOpenAIConfigured
          ? "Full AI capabilities available"
          : "Running with built-in responses. Set OPENAI_API_KEY for enhanced AI.",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to check AI status.",
    });
  }
};

export default {
  chat,
  getConversations,
  getConversation,
  analyzeMaterial,
  getReuseSuggestions,
  provideFeedback,
  deleteConversation,
  getStatus,
};
