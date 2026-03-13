"""
trellis_generate.py
====================
Convert a 2D image to a 3D GLB model using the Microsoft Trellis model
hosted on HuggingFace Spaces (JeffreyXiang/TRELLIS).

Runs entirely on HuggingFace servers — no local GPU required.

Requires:
    pip install gradio_client pillow

Usage:
    python trellis_generate.py <input_image_path> <output_glb_path>

Prints the absolute output path to stdout on success.
Exits with code 1 and prints error to stderr on failure.
"""

import sys
import os
import shutil
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()
hf_api_key = os.getenv("HF_API_KEY")

# ── Validate arguments ───────────────────────────────────────────────────────
if len(sys.argv) < 3:
    print("Usage: python trellis_generate.py <input_image_path> <output_glb_path>", file=sys.stderr)
    sys.exit(1)

input_image_path = os.path.abspath(sys.argv[1])
output_glb_path  = os.path.abspath(sys.argv[2])

if not os.path.exists(input_image_path):
    print(f"Error: Input image not found: {input_image_path}", file=sys.stderr)
    sys.exit(1)

# ── Ensure output directory exists ───────────────────────────────────────────
os.makedirs(os.path.dirname(output_glb_path), exist_ok=True)

# ── Import gradio_client ──────────────────────────────────────────────────────
try:
    from gradio_client import Client, handle_file
except ImportError:
    print(
        "Error: gradio_client is not installed.\n"
        "Run:  pip install gradio_client pillow",
        file=sys.stderr
    )
    sys.exit(1)

# ── Connect to the Trellis HuggingFace Space ──────────────────────────────────
print(f"Connecting to JeffreyXiang/TRELLIS on HuggingFace Spaces...", flush=True)

try:
    client = Client("JeffreyXiang/TRELLIS", token=hf_api_key)
    print("Initializing session...", flush=True)
    client.predict(api_name="/start_session")
except Exception as e:
    print(f"Error: Could not connect to HuggingFace Space or start session: {e}", file=sys.stderr)
    sys.exit(1)

# ── Step 1: Preprocess the image (session init) ───────────────────────────────
print(f"Uploading image: {input_image_path}", flush=True)

try:
    session_result = client.predict(
        image=handle_file(input_image_path),
        api_name="/preprocess_image"
    )
    # session_result is a server-side file path string — wrap it for the next API call
    preprocessed_image = handle_file(session_result)
    print("Image preprocessed successfully.", flush=True)
except Exception as e:
    print(f"Error during image preprocessing: {e}", file=sys.stderr)
    sys.exit(1)

# ── Step 2: Get a random seed via the /get_seed endpoint ─────────────────────
print("Fetching random seed...", flush=True)

try:
    seed = client.predict(
        randomize_seed=True,
        seed=0,
        api_name="/get_seed"
    )
    print(f"Using seed: {seed}", flush=True)
except Exception as e:
    # Fall back to a fixed seed if /get_seed fails
    seed = 42
    print(f"Could not fetch seed ({e}), falling back to seed={seed}", flush=True)

# ── Step 3: Run 3D generation ─────────────────────────────────────────────────
print("Running 3D generation (this may take 1-3 minutes)...", flush=True)

try:
    generation_result = client.predict(
        image=preprocessed_image,
        multiimages=[],           # single-image mode
        seed=seed,
        ss_guidance_strength=7.5,
        ss_sampling_steps=12,
        slat_guidance_strength=3.0,
        slat_sampling_steps=12,
        multiimage_algo="stochastic",
        api_name="/image_to_3d"
    )
    # generation_result is a dict; the 3D state is returned for extraction
    model_state = generation_result
    print("3D generation complete.", flush=True)
except Exception as e:
    print(f"Error during 3D generation: {e}", file=sys.stderr)
    sys.exit(1)

# ── Step 3: Extract GLB ───────────────────────────────────────────────────────
print("Extracting GLB model...", flush=True)

try:
    extract_result = client.predict(
        mesh_simplify=0.95,
        texture_size=1024,
        api_name="/extract_glb"
    )
    # The Space returns a file path to the GLB
    # extract_result is typically (video_path, glb_path) or just glb_path
    if isinstance(extract_result, (list, tuple)):
        glb_source = extract_result[-1]   # last element is the .glb path
    else:
        glb_source = extract_result

    print(f"GLB extracted: {glb_source}", flush=True)
except Exception as e:
    print(f"Error during GLB extraction: {e}", file=sys.stderr)
    sys.exit(1)

# ── Copy GLB to requested output path ────────────────────────────────────────
try:
    shutil.copy2(glb_source, output_glb_path)
    print(f"Model saved to: {output_glb_path}", flush=True)
except Exception as e:
    print(f"Error saving GLB to output path: {e}", file=sys.stderr)
    sys.exit(1)

# ── Print final absolute path so Node.js can read it from stdout ─────────────
print(os.path.abspath(output_glb_path))
