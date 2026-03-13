// AI Image Studio Page — HuggingFace image generation + 3D model conversion
import { useState, type FormEvent } from "react";
import {
  Image as ImageIcon,
  Sparkles,
  Download,
  AlertCircle,
  Box,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/layouts";
import { API_BASE_URL } from "@/config/constants";

const BACKEND = API_BASE_URL; // e.g. http://localhost:5001

const AiImageStudioPage = () => {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [isConverting, setIsConverting] = useState(false);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [convertError, setConvertError] = useState<string | null>(null);

  // ── Generate Image ─────────────────────────────────────────────────
  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    setModelUrl(null);
    setImagePath(null);

    try {
      const response = await fetch(`${BACKEND}/api/image-studio/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const data: Record<string, string> = await response
          .json()
          .catch(() => ({}));
        throw new Error(data.error || "Failed to generate image.");
      }

      const serverPath = response.headers.get("X-Image-Path");
      if (serverPath) setImagePath(serverPath);

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      setImageUrl(objectUrl);
    } catch (err: unknown) {
      console.error("Generation error:", err);
      const message =
        err instanceof Error
          ? err.message
          : "Connection error. Is the backend running?";
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Convert to 3D ──────────────────────────────────────────────────
  const handleConvert3D = async () => {
    if (!imagePath) return;

    setIsConverting(true);
    setConvertError(null);
    setModelUrl(null);

    try {
      const response = await fetch(`${BACKEND}/api/image-studio/convert-3d`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imagePath }),
      });

      if (!response.ok) {
        const data: Record<string, string> = await response
          .json()
          .catch(() => ({}));
        throw new Error(data.error || "Failed to generate 3D model.");
      }

      const data = (await response.json()) as { modelUrl: string };
      setModelUrl(`${BACKEND}${data.modelUrl}`);
    } catch (err: unknown) {
      console.error("3D conversion error:", err);
      const message =
        err instanceof Error
          ? err.message
          : "Failed to generate 3D model.";
      setConvertError(message);
    } finally {
      setIsConverting(false);
    }
  };

  // ── Download image ──────────────────────────────────────────────────
  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `generated-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl shadow-lg shadow-violet-500/20">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-violet-200 via-fuchsia-200 to-pink-200">
              AI Image Studio
            </h1>
          </div>
          <p className="text-neutral-400 text-sm max-w-md mx-auto">
            Transform your imagination into stunning visuals — and 3D models —
            powered by HuggingFace AI
          </p>
        </div>

        {/* Prompt Form */}
        <form onSubmit={handleGenerate}>
          <div className="flex gap-3 items-center bg-neutral-900/60 border border-neutral-800 rounded-2xl p-2 pl-5 focus-within:border-violet-500/50 transition-all shadow-xl shadow-black/20">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you want to see..."
              disabled={isGenerating}
              className="flex-1 bg-transparent py-3 text-sm text-white placeholder-neutral-600 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isGenerating || !prompt.trim()}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-violet-500/20"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <ImageIcon className="w-4 h-4" />
                  Generate
                </>
              )}
            </button>
          </div>
        </form>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm"
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </motion.div>
        )}

        {/* Image Output */}
        <div
          className={`min-h-[400px] rounded-3xl overflow-hidden border transition-all duration-500 ${
            imageUrl
              ? "border-neutral-800/50 shadow-2xl shadow-black/30"
              : "border-neutral-800/30 bg-neutral-900/40"
          }`}
        >
          {!imageUrl && !isGenerating ? (
            <div className="h-[400px] flex flex-col items-center justify-center gap-4 text-neutral-600">
              <ImageIcon className="w-12 h-12" />
              <p className="text-sm font-medium">
                Your creation will appear here
              </p>
            </div>
          ) : isGenerating ? (
            <div className="h-[400px] flex flex-col items-center justify-center gap-5">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 animate-pulse shadow-lg shadow-violet-500/30" />
              <p className="text-violet-300 text-sm font-bold tracking-wide uppercase">
                Summoning pixels…
              </p>
            </div>
          ) : imageUrl ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="relative group"
            >
              <img
                src={imageUrl}
                alt={prompt}
                className="w-full h-auto block rounded-3xl"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-end p-6 rounded-3xl">
                <button
                  onClick={handleDownload}
                  title="Download Image"
                  className="p-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full hover:bg-white/20 transition-all"
                >
                  <Download className="w-5 h-5 text-white" />
                </button>
              </div>
            </motion.div>
          ) : null}
        </div>

        {/* Convert To 3D Section */}
        {imageUrl && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-6"
          >
            {!isConverting && !modelUrl && (
              <button
                onClick={handleConvert3D}
                disabled={!imagePath || isConverting}
                title={
                  !imagePath
                    ? "Image path not available — regenerate the image"
                    : "Convert image to 3D model"
                }
                className="flex items-center gap-2.5 px-8 py-3.5 bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-400 hover:to-violet-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm rounded-2xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5"
              >
                <Box className="w-5 h-5" />
                Convert to 3D Model
              </button>
            )}

            {isConverting && (
              <div className="w-full p-8 bg-neutral-900/60 border border-neutral-800 rounded-3xl flex flex-col items-center gap-5">
                {/* Orbiting loader */}
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-blue-500 border-r-violet-500 animate-spin" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 animate-pulse" />
                </div>
                <p className="text-white font-semibold text-sm">
                  Sculpting your 3D model via HuggingFace…
                </p>
                <p className="text-neutral-500 text-xs">
                  This typically takes 1–3 minutes
                </p>
              </div>
            )}

            {convertError && !isConverting && (
              <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm w-full">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>{convertError}</p>
              </div>
            )}

            {modelUrl && !isConverting && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full bg-neutral-900/60 border border-neutral-800 rounded-3xl overflow-hidden"
              >
                <div className="flex items-center gap-2 px-6 py-4 border-b border-neutral-800 text-neutral-400 text-xs font-bold uppercase tracking-widest">
                  <Box className="w-4 h-4 text-blue-400" />
                  3D Model — drag to rotate, scroll to zoom
                </div>
                {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                {/* @ts-ignore model-viewer is a web component loaded via CDN */}
                <model-viewer
                  id="studio-model-viewer"
                  src={modelUrl}
                  alt="Generated 3D model"
                  auto-rotate
                  camera-controls
                  shadow-intensity="1"
                  environment-image="neutral"
                  exposure="1"
                  style={{
                    width: "100%",
                    height: "480px",
                    borderRadius: "0",
                    background: "transparent",
                  }}
                />
                <a
                  href={modelUrl}
                  download
                  className="flex items-center justify-center gap-2 px-6 py-4 border-t border-neutral-800 text-neutral-400 hover:text-white text-sm font-medium transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download .glb
                </a>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AiImageStudioPage;
