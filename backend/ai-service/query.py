import os
import sys
import json
import logging
from sentence_transformers import SentenceTransformer
from pinecone import Pinecone
from groq import Groq
from dotenv import load_dotenv

# Suppress warnings that might break JSON stdout
logging.getLogger("sentence_transformers").setLevel(logging.ERROR)
import warnings
warnings.filterwarnings("ignore")

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No question provided.", "answer": None}))
        sys.exit(1)

    question = sys.argv[1]

    # Load environment variables from the parent directory
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
    load_dotenv(env_path)

    PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")

    if not PINECONE_API_KEY or not GROQ_API_KEY:
        print(json.dumps({"error": "API Keys not configured in .env", "answer": None}))
        sys.exit(1)

    INDEX_NAME = "circula"
    MODEL_NAME = "all-MiniLM-L6-v2"
    GROQ_MODEL = "llama-3.1-8b-instant"

    try:
        # Redirect stdout to prevent pollution
        import io
        old_stdout = sys.stdout
        sys.stdout = io.StringIO()

        model = SentenceTransformer(MODEL_NAME)
        pc = Pinecone(api_key=PINECONE_API_KEY)
        index = pc.Index(INDEX_NAME)
        groq_client = Groq(api_key=GROQ_API_KEY)

        question_embedding = model.encode(question).tolist()

        query_response = index.query(
            vector=question_embedding,
            top_k=3,
            include_metadata=True
        )
        
        contexts = [item["metadata"]["text"] for item in query_response["matches"]]
        context_str = "\n\n".join(contexts) if contexts else ""

        prompt = f"""You are an AI Sustainability Assistant for Circula, a Circular Economy Marketplace in Mumbai.

Your role is to help users find reuse opportunities for materials, suggest organizations that may need them, and explain sustainability benefits of reusing resources.

Use ONLY the information provided in the context below to answer the user's question.

Guidelines:
- If the context contains relevant information, answer clearly and concisely.
- When possible, suggest reuse ideas or organizations in Mumbai.
- If the answer cannot be determined from the context, respond with:
"I don't know based on the provided knowledge base."

Context:
{context_str}

User Question:
{question}

Answer:\n"""
        
        response = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": prompt}
            ],
            model=GROQ_MODEL,
        )

        answer = response.choices[0].message.content
        output_data = {"error": None, "answer": answer}
        
    except Exception as e:
        output_data = {"error": str(e), "answer": None}
    finally:
        # Restore stdout and print ONLY the final JSON string
        sys.stdout = old_stdout
        print(json.dumps(output_data))

if __name__ == "__main__":
    main()
