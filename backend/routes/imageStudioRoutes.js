import express from "express";
import { exec } from "child_process";
import path from "path";
import fs from "fs";
import multer from "multer";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// ── Directories ──────────────────────────────────────────────────────────────
const IMAGES_DIR = path.resolve(__dirname, "../image-studio-images");
const MODELS_DIR = path.resolve(__dirname, "../image-studio-models");
[IMAGES_DIR, MODELS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ── Multer for direct image uploads ──────────────────────────────────────────
const upload = multer({ dest: path.join(IMAGES_DIR, "uploads/") });

// ── Helper ───────────────────────────────────────────────────────────────────
const sanitizePrompt = (str) => str.replace(/"/g, '\\"');

// ── Path to the Python scripts (local copies in image-studio/) ───────────────
const HF_IMAGE_GEN_SCRIPT = path.resolve(
  __dirname,
  "../image-studio/hf_image_gen.py"
);
const TRELLIS_SCRIPT = path.resolve(
  __dirname,
  "../image-studio/trellis_generate.py"
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /generate
// Generates a 2D image via HuggingFace and returns the binary + X-Image-Path
// ─────────────────────────────────────────────────────────────────────────────
router.post("/generate", (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  console.log(`[image-studio:generate] prompt: "${prompt}"`);

  const outputFilename = `generated_${Date.now()}.jpg`;
  const outputPath = path.join(IMAGES_DIR, outputFilename);

  const safePrompt = sanitizePrompt(prompt);
  const command = `python "${HF_IMAGE_GEN_SCRIPT}" "${safePrompt}" "${outputPath}"`;

  console.log(`[image-studio:generate] Executing: ${command}`);

  // Pass HF_API_KEY from the BULBSTORM backend's env into the child process
  const childEnv = { ...process.env };

  exec(command, { env: childEnv }, (error, stdout, stderr) => {
    if (error) {
      console.error(`[image-studio:generate] Script error: ${error.message}`);
      return res
        .status(500)
        .json({ error: "Failed to generate image", details: stderr });
    }

    const lines = stdout.trim().split("\n");
    const generatedFilePath = lines[lines.length - 1].trim();

    console.log(`[image-studio:generate] Image at: ${generatedFilePath}`);

    if (fs.existsSync(generatedFilePath)) {
      res.setHeader("X-Image-Path", generatedFilePath);
      res.sendFile(generatedFilePath, (err) => {
        if (err) {
          console.error("[image-studio:generate] Error sending file:", err);
          res.status(500).json({ error: "Failed to send image" });
        }
      });
    } else {
      console.error(
        `[image-studio:generate] Image not found at: ${generatedFilePath}`
      );
      return res
        .status(500)
        .json({ error: "Image was not generated successfully" });
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /convert-3d
// Accepts JSON { imagePath } OR a multipart file upload.
// Calls trellis_generate.py and returns { modelUrl }
// ─────────────────────────────────────────────────────────────────────────────
router.post("/convert-3d", upload.single("image"), (req, res) => {
  let imagePath;

  if (req.file) {
    imagePath = req.file.path;
    console.log(`[image-studio:convert-3d] Using uploaded file: ${imagePath}`);
  } else if (req.body && req.body.imagePath) {
    imagePath = req.body.imagePath;
    console.log(`[image-studio:convert-3d] Using server path: ${imagePath}`);
  } else {
    return res
      .status(400)
      .json({ error: "Provide imagePath in JSON body or upload a file." });
  }

  if (!fs.existsSync(imagePath)) {
    return res
      .status(404)
      .json({ error: `Image not found on server: ${imagePath}` });
  }

  const outputFilename = `model_${Date.now()}.glb`;
  const outputPath = path.join(MODELS_DIR, outputFilename);

  const command = `python "${TRELLIS_SCRIPT}" "${imagePath}" "${outputPath}"`;

  console.log(`[image-studio:convert-3d] Executing: ${command}`);

  // 5-minute timeout for HuggingFace processing
  const MAX_MS = 5 * 60 * 1000;
  const childEnv = { ...process.env };

  exec(command, { timeout: MAX_MS, env: childEnv }, (error, stdout, stderr) => {
    if (error) {
      console.error(
        `[image-studio:convert-3d] Script error: ${error.message}`
      );
      console.error(`[image-studio:convert-3d] stderr: ${stderr}`);
      return res.status(500).json({
        error: "Failed to generate 3D model",
        details: stderr || error.message,
      });
    }

    const lines = stdout.trim().split("\n");
    const generatedGlbPath = lines[lines.length - 1].trim();

    console.log(`[image-studio:convert-3d] GLB at: ${generatedGlbPath}`);

    if (fs.existsSync(generatedGlbPath)) {
      const modelUrl = `/image-studio-models/${path.basename(
        generatedGlbPath
      )}`;
      return res.json({ modelUrl });
    } else {
      console.error(
        `[image-studio:convert-3d] GLB not found at: ${generatedGlbPath}`
      );
      return res
        .status(500)
        .json({ error: "3D model was not generated successfully" });
    }
  });
});

export default router;
