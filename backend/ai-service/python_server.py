import os
import sys
from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer
from pinecone import Pinecone
from groq import Groq
from dotenv import load_dotenv

import logging
logging.getLogger("sentence_transformers").setLevel(logging.ERROR)
import warnings
warnings.filterwarnings("ignore")

app = Flask(__name__)

# Load environment variables from parent directory's .env
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
load_dotenv(env_path)

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not PINECONE_API_KEY or not GROQ_API_KEY:
    print(f"API Keys not configured in {env_path}")
    sys.exit(1)

INDEX_NAME = "circula"
MODEL_NAME = "all-MiniLM-L6-v2"
GROQ_MODEL = "llama-3.1-8b-instant"

print("Initializing AI parameters... (This loads the ML models into RAM once)")
# Loading these once globally in memory, rather than per-request
model = SentenceTransformer(MODEL_NAME)
pc = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index(INDEX_NAME)
groq_client = Groq(api_key=GROQ_API_KEY)
print("Models loaded successfully! Flask server ready.")

@app.route('/vectorize-material', methods=['POST'])
def vectorize_material():
    data = request.json
    
    material_id = data.get("_id")
    if not material_id:
        return jsonify({"error": "No _id provided.", "success": False}), 400
        
    title = data.get("title", "")
    condition = data.get("condition", "")
    available_qty = data.get("availableQuantity", 0)
    unit = data.get("unit", "")
    
    address = data.get("address", {})
    city = address.get("city", "")
    state = address.get("state", "")
    
    description = data.get("description", "")
    tags = data.get("tags", "")
    if isinstance(tags, list):
        tags = " ".join(tags)
        
    status = data.get("status", "available")
    
    if int(available_qty) <= 0:
        return jsonify({"error": "Quantity <= 0, should use delete endpoint", "success": False}), 400
        
    embedding_text = f"Material: {title}\nCondition: {condition}\nQuantity Available: {available_qty} {unit}\nLocation: {city}, {state}\nDescription: {description}\nTags: {tags}"
    
    try:
        embedding = model.encode(embedding_text).tolist()
        
        metadata = {
            "material_id": str(material_id),
            "title": title,
            "city": city,
            "state": state,
            "availableQuantity": available_qty,
            "status": status,
            "text": embedding_text
        }
        
        index.upsert(
            vectors=[{
                "id": str(material_id),
                "values": embedding,
                "metadata": metadata
            }]
        )
        return jsonify({"success": True, "message": "Material vectorized and stored."})
    except Exception as e:
        print(f"Server Error (vectorize): {str(e)}")
        return jsonify({"error": str(e), "success": False}), 500

@app.route('/delete-material-vector', methods=['POST'])
def delete_material_vector():
    data = request.json
    material_id = data.get("material_id")
    if not material_id:
        return jsonify({"error": "No material_id provided.", "success": False}), 400
        
    try:
        index.delete(ids=[str(material_id)])
        return jsonify({"success": True, "message": f"Vector {material_id} deleted."})
    except Exception as e:
        print(f"Server Error (delete): {str(e)}")
        return jsonify({"error": str(e), "success": False}), 500

@app.route('/rag-query', methods=['POST'])
def rag_query():
    data = request.json
    question = data.get("question")
    if not question:
        return jsonify({"error": "No question provided.", "answer": None}), 400

    try:
        question_embedding = model.encode(question).tolist()

        query_response = index.query(
            vector=question_embedding,
            top_k=5,
            include_metadata=True
        )
        
        contexts = [item["metadata"]["text"] for item in query_response["matches"] if "text" in item["metadata"]]
        context_str = "\n\n".join(contexts) if contexts else ""

        prompt = f"""You are Circula AI, the sustainability assistant for the Augenblick circular economy marketplace in Mumbai.

Your role is to help people reuse materials instead of discarding them by:
• suggesting reuse ideas
• helping users discover available materials
• explaining sustainability benefits of reuse

Use ONLY the information provided in the context.

If the answer cannot be determined from the context, respond:
"I don't know based on the provided knowledge base."

Context:
{context_str}

User Question:
{question}

Helpful Answer:"""

        response = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": prompt}
            ],
            model=GROQ_MODEL,
        )

        answer = response.choices[0].message.content
        return jsonify({"error": None, "answer": answer})
        
    except Exception as e:
        print(f"Server Error (rag-query): {str(e)}")
        return jsonify({"error": str(e), "answer": None}), 500

@app.route('/chat', methods=['POST'])
def chat():
    # Alias for backwards compatibility with existing frontend
    return rag_query()

if __name__ == '__main__':
    # Run the internal persistent server on port 5005
    app.run(port=5005)
