import requests
import os
from dotenv import load_dotenv
load_dotenv()

# You can grab a free API key at https://huggingface.co/settings/tokens
# Set it in your environment as HF_API_KEY, or hardcode here
API_KEY = os.environ.get("HF_API_KEY") 
# API_KEY = "hf_Your_Token_Here"

if not API_KEY:
    print("Warning: Please set your HF_API_KEY environment variable or hardcode it in the script.")
    print("You can get a free token by making an account at huggingface.co and visiting https://huggingface.co/settings/tokens")
    exit(1)

import sys

# Ensure arguments are provided
if len(sys.argv) < 3:
    print("Usage: python hf_image_gen.py <prompt> <output_filename>")
    exit(1)

# Prompt and filename from command line arguments
prompt = sys.argv[1]
filename = sys.argv[2]

# We use the free Hugging Face inference API and the lightning-fast FLUX model or SDXL
API_URL = "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

def query(payload):
    print(f"Sending request to Hugging Face API to generate: '{prompt}'...")
    response = requests.post(API_URL, headers=headers, json=payload)
    if response.status_code != 200:
        raise Exception(f"Request failed: {response.status_code} - {response.text}")
    return response.content

try:
    image_bytes = query({"inputs": prompt})
    
    with open(filename, "wb") as f:
        f.write(image_bytes)
        
    # Print exactly the absolute filename so the Node.js backend can grab it from stdout
    print(os.path.abspath(filename))
    
except Exception as e:
    print("Error:", e, file=sys.stderr)
    exit(1)
