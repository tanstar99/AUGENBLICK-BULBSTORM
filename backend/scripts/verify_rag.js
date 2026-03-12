import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || "http://localhost:5005";

async function verifyIntegration() {
  console.log("--- RAG Integration Verification ---");
  console.log(`Checking RAG Service at: ${RAG_SERVICE_URL}`);

  try {
    // 1. Check if service is up
    console.log("Step 1: Checking if RAG service is online...");
    try {
      await axios.get(RAG_SERVICE_URL);
      console.log("✅ RAG service responded.");
    } catch (e) {
      if (e.response) {
        console.log("✅ RAG service is online (404 is expected for root).");
      } else {
        throw new Error(`RAG service seems offline at ${RAG_SERVICE_URL}. Please start it first.`);
      }
    }

    // 2. Test a query
    console.log("\nStep 2: Testing RAG query...");
    const testQuestion = "What is the mission of Circula AI?";
    const response = await axios.post(`${RAG_SERVICE_URL}/rag-query`, {
      question: testQuestion
    });

    if (response.data && response.data.answer) {
      console.log(`✅ Success! Received answer:`);
      console.log(`   "${response.data.answer.substring(0, 100)}..."`);
    } else {
      console.log("❌ Failed: No answer in response.");
      console.log("Response:", response.data);
    }

  } catch (error) {
    console.error(`\n❌ Error during verification: ${error.message}`);
    if (error.response) {
      console.error("Response Data:", error.response.data);
    }
  }
}

verifyIntegration();
