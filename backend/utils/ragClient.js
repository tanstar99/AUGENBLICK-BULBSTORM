import axios from "axios";

/**
 * Client for the Python RAG service
 */
const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || "http://localhost:5005";

/**
 * Query the RAG service
 * @param {string} question - The user's question
 * @returns {Promise<Object>} - The RAG response
 */
export const queryRAG = async (question) => {
  try {
    const response = await axios.post(`${RAG_SERVICE_URL}/rag-query`, {
      question,
    });
    
    return {
      success: true,
      answer: response.data.answer,
      error: response.data.error,
    };
  } catch (error) {
    console.error("RAG Service error:", error.message);
    return {
      success: false,
      answer: null,
      error: error.message,
    };
  }
};

/**
 * Check if the RAG service is online
 * @returns {Promise<boolean>}
 */
export const checkRAGStatus = async () => {
  try {
    // We can use a simple check or the /vectorize-material endpoint with empty data
    // For now, let's just assume it's up if it doesn't timeout
    await axios.get(RAG_SERVICE_URL, { timeout: 2000 });
    return true;
  } catch (error) {
    // Flask usually returns 404 for root if not defined, which means it IS up
    if (error.response) return true;
    return false;
  }
};

export default {
  queryRAG,
  checkRAGStatus,
};
