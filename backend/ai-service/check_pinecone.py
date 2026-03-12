import pinecone
try:
    print(f"Pinecone version: {pinecone.__version__}")
except AttributeError:
    from pinecone import Pinecone
    print("Pinecone imported from 'from pinecone import Pinecone'")
