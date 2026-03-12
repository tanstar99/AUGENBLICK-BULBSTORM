import express from "express";
import {
  chat,
  getConversations,
  getConversation,
  analyzeMaterial,
  getReuseSuggestions,
  provideFeedback,
  deleteConversation,
  getStatus,
} from "../controllers/aiController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @route   GET /api/ai/status
 * @desc    Get AI service status and capabilities
 * @access  Public
 */
router.get("/status", getStatus);

// ========================================
// Authenticated routes below
// ========================================
router.use(authenticate);

/**
 * @route   POST /api/ai/chat
 * @desc    Chat with AI assistant
 * @body    message (required), conversationId (optional), type (optional), materialId (optional), context (optional)
 * @access  Private
 * 
 * Conversation types:
 *   - general_assistant: General Q&A about circular economy
 *   - reuse_suggestion: AI suggesting reuse ideas
 *   - material_analysis: Analyzing material listings
 *   - sustainability_qa: Environmental impact questions
 *   - price_suggestion: Pricing recommendations
 */
router.post("/chat", chat);

/**
 * @route   POST /api/ai/analyze-material
 * @desc    Analyze a material listing for reuse potential
 * @body    materialId (required)
 * @access  Private
 * 
 * Returns:
 *   - Reuse potential assessment
 *   - Suggested reuse opportunities
 *   - Environmental impact estimate
 *   - Pricing recommendations
 */
router.post("/analyze-material", analyzeMaterial);

/**
 * @route   POST /api/ai/reuse-suggestions
 * @desc    Get reuse suggestions for a material type
 * @body    materialType (required), condition (optional)
 * @access  Private
 */
router.post("/reuse-suggestions", getReuseSuggestions);

/**
 * @route   GET /api/ai/conversations
 * @desc    Get user's AI conversation history
 * @query   page, limit, type, status (active|completed|archived|all)
 * @access  Private
 */
router.get("/conversations", getConversations);

/**
 * @route   GET /api/ai/conversations/:id
 * @desc    Get a single conversation with all messages
 * @access  Private
 */
router.get("/conversations/:id", getConversation);

/**
 * @route   POST /api/ai/conversations/:id/feedback
 * @desc    Provide feedback on AI responses
 * @body    messageIndex (optional), rating (helpful|not_helpful|neutral), comment (optional), overallRating (1-5)
 * @access  Private
 */
router.post("/conversations/:id/feedback", provideFeedback);

/**
 * @route   DELETE /api/ai/conversations/:id
 * @desc    Archive a conversation
 * @access  Private
 */
router.delete("/conversations/:id", deleteConversation);

export default router;
