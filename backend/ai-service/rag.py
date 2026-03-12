import os
from docx import Document
from sentence_transformers import SentenceTransformer
from pinecone import Pinecone, ServerlessSpec
from groq import Groq
from dotenv import load_dotenv

# Load environment variables from parent directory
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
load_dotenv(env_path)

# Initialize API Keys
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Settings
INDEX_NAME = "circula"
MODEL_NAME = "all-MiniLM-L6-v2" 
GROQ_MODEL = "llama-3.1-8b-instant"

def extract_text_from_docx(file_path):
    doc = Document(file_path)
    return "\n".join([para.text for para in doc.paragraphs if para.text.strip()])

def chunk_text(text, chunk_size=200, overlap=30):
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunks.append(" ".join(words[i:i + chunk_size]))
    return chunks

def setup_pinecone(pc, index_name, dimension):
    if index_name not in pc.list_indexes().names():
        pc.create_index(
            name=index_name,
            dimension=dimension,
            metric="cosine",
            spec=ServerlessSpec(
                cloud="aws",
                region="us-east-1"
            )
        )
    return pc.Index(index_name)

def main():
    if not PINECONE_API_KEY or not GROQ_API_KEY:
        print("Please set PINECONE_API_KEY and GROQ_API_KEY in your .env file.")
        return

    print("Loading Sentence Transformer model...")
    model = SentenceTransformer(MODEL_NAME)
    dimension = model.get_sentence_embedding_dimension()

    print("Initializing Pinecone...")
    pc = Pinecone(api_key=PINECONE_API_KEY)
    
    print("Setting up Pinecone index...")
    index = setup_pinecone(pc, INDEX_NAME, dimension)

    print("Reading and chunking document...")
    doc_path = os.path.join(os.path.dirname(__file__), "RAGdoc.docx")
    if not os.path.exists(doc_path):
        print(f"Error: Could not find {doc_path}")
        return
        
    doc_text = extract_text_from_docx(doc_path)
    chunks = chunk_text(doc_text, chunk_size=200, overlap=30)
    print(f"Created {len(chunks)} chunks.")

    print("Generating embeddings and uploading to Pinecone...")
    vectors = []
    for i, chunk in enumerate(chunks):
        embedding = model.encode(chunk).tolist()
        vectors.append({
            "id": f"chunk-{i}",
            "values": embedding,
            "metadata": {"text": chunk}
        })
    
    # Upsert in batches of 100
    for i in range(0, len(vectors), 100):
        batch = vectors[i:i + 100]  # type: ignore[index]
        index.upsert(batch)  # type: ignore[arg-type]
    print("Ingestion complete.")

if __name__ == "__main__":
    main()
