import { useState, useEffect, useRef, useCallback } from "react";
import { Camera, Upload, RotateCcw, Download, Share2, ShoppingCart, ArrowLeft, AlertCircle, Loader2, X, Sparkles, ChevronDown, ChevronUp, Wand2 } from "lucide-react";

console.log("[Widget] Module loaded - version 3");

// Types
interface ProductInfo {
  image: string;
  name?: string;
  id?: string;
  category?: string;
  price?: number;
  currency?: string;
  url?: string;
  specification?: string;
  description?: string;
}

interface SessionData {
  merchantKey: string;
  product: ProductInfo;
  userImage?: string;
  userId?: string;
  modelImage?: string;
  theme: "light" | "dark" | "auto";
  locale: string;
  skipPhotoStep: boolean;
  allowCamera: boolean;
  allowUpload: boolean;
}

interface TryOnResult {
  sessionId: string;
  imageUrl: string;
  thumbnailUrl?: string;
  downloadUrl: string;
  expiresAt: string;
  processingTime: number;
}

type Step = "photo" | "preview" | "processing" | "result" | "error";

// Processing status messages for typewriter effect
const processingMessages = [
  "Analyzing your photo...",
  "Detecting body pose...",
  "Applying fashion item...",
  "Adjusting fit and style...",
  "Adding finishing touches...",
  "Almost there..."
];

// Parse URL parameters
function getSessionFromUrl(): SessionData | null {
  const params = new URLSearchParams(window.location.search);
  const merchantKey = params.get("merchantKey");
  const productImage = params.get("productImage");

  if (!merchantKey || !productImage) {
    return null;
  }

  return {
    merchantKey,
    product: {
      image: productImage,
      name: params.get("productName") || undefined,
      id: params.get("productId") || undefined,
      category: params.get("productCategory") || undefined,
      price: params.get("productPrice") ? parseFloat(params.get("productPrice")!) : undefined,
      currency: params.get("productCurrency") || undefined,
      url: params.get("productUrl") || undefined,
      specification: params.get("productSpecification") || undefined,
      description: params.get("productDescription") || undefined,
    },
    userImage: params.get("userImage") || undefined,
    userId: params.get("userId") || undefined,
    modelImage: params.get("modelImage") || undefined,
    theme: (params.get("theme") as "light" | "dark" | "auto") || "auto",
    locale: params.get("locale") || "en",
    skipPhotoStep: params.get("skipPhotoStep") === "true",
    allowCamera: params.get("allowCamera") !== "false",
    allowUpload: params.get("allowUpload") !== "false",
  };
}

// Post message to parent
function postToParent(type: string, payload?: any) {
  if (window.parent !== window) {
    window.parent.postMessage({ type, payload }, "*");
  }
}

// Format price
function formatPrice(price?: number, currency?: string): string {
  if (!price) return "";
  const formatter = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "USD",
  });
  return formatter.format(price);
}

// Fetch model image from URL and convert to base64
async function fetchModelImageFromUrl(url: string): Promise<{ dataUrl: string; file: File } | null> {
  try {
    // Use proxy endpoint to fetch external images (avoids CORS issues)
    const response = await fetch(`/api/widget/fetch-image?url=${encodeURIComponent(url)}`);
    if (!response.ok) {
      console.error("[Widget] Failed to fetch model image:", response.statusText);
      return null;
    }

    const blob = await response.blob();

    // Validate it's an image
    if (!blob.type.startsWith("image/")) {
      console.error("[Widget] URL did not return an image:", blob.type);
      return null;
    }

    // Convert blob to data URL
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const file = new File([blob], "model.jpg", { type: blob.type });
        resolve({ dataUrl, file });
      };
      reader.onerror = () => {
        console.error("[Widget] Failed to read model image blob");
        resolve(null);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("[Widget] Error fetching model image:", error);
    return null;
  }
}

export default function WidgetEmbed() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [step, setStep] = useState<Step>("photo");
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [userPhotoFile, setUserPhotoFile] = useState<File | null>(null);
  const [result, setResult] = useState<TryOnResult | null>(null);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [progress, setProgress] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [creativePrompt, setCreativePrompt] = useState<string>("");
  const [showCreativeOptions, setShowCreativeOptions] = useState(false);
  const [processingMessage, setProcessingMessage] = useState(processingMessages[0]);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [modelImageLoading, setModelImageLoading] = useState(false);
  const [modelImageError, setModelImageError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize session from URL
  useEffect(() => {
    const sessionData = getSessionFromUrl();
    if (!sessionData) {
      setError({ code: "INVALID_SESSION", message: "Invalid session parameters" });
      setStep("error");
      return;
    }

    setSession(sessionData);

    // Apply theme
    const effectiveTheme =
      sessionData.theme === "auto"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : sessionData.theme;
    document.documentElement.setAttribute("data-theme", effectiveTheme);

    // If user image provided and skip step enabled, go directly to preview
    if (sessionData.userImage && sessionData.skipPhotoStep) {
      setUserPhoto(sessionData.userImage);
      setStep("preview");
    }

    // If modelImage URL is provided, try to fetch it automatically
    if (sessionData.modelImage) {
      setModelImageLoading(true);
      setModelImageError(null);
      fetchModelImageFromUrl(sessionData.modelImage)
        .then((result) => {
          if (result) {
            setUserPhoto(result.dataUrl);
            setUserPhotoFile(result.file);
            setStep("preview");
            postToParent("mirrorme:photoSelected", { source: "modelUrl" });
          } else {
            setModelImageError("Failed to load model image from URL");
            // Fall back to photo selection step
          }
        })
        .finally(() => {
          setModelImageLoading(false);
        });
    }

    // Notify parent that we're ready
    postToParent("mirrorme:ready");
  }, []);

  // Rotate processing messages
  useEffect(() => {
    if (step !== "processing") return;

    let messageIndex = 0;
    const interval = setInterval(() => {
      messageIndex = (messageIndex + 1) % processingMessages.length;
      setProcessingMessage(processingMessages[messageIndex]);
    }, 2500);

    return () => clearInterval(interval);
  }, [step]);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  // Handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError({ code: "INVALID_FILE", message: "Please select an image file" });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError({ code: "FILE_TOO_LARGE", message: "Image must be less than 10MB" });
      return;
    }

    setIsImageLoading(true);
    setUserPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setUserPhoto(event.target?.result as string);
      setTimeout(() => {
        setIsImageLoading(false);
        setStep("preview");
      }, 300);
      postToParent("mirrorme:photoSelected", { source: "upload" });
    };
    reader.readAsDataURL(file);
  }, []);

  // Handle camera capture
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setCameraStream(stream);
      setShowCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError({ code: "CAMERA_ERROR", message: "Could not access camera" });
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Mirror the image for selfie feel
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setUserPhoto(dataUrl);

    // Convert to file for upload
    canvas.toBlob(
      (blob) => {
        if (blob) {
          setUserPhotoFile(new File([blob], "capture.jpg", { type: "image/jpeg" }));
        }
      },
      "image/jpeg",
      0.9
    );

    // Stop camera
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
    setStep("preview");
    postToParent("mirrorme:photoSelected", { source: "camera" });
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  // Process try-on
  const processTryOn = async () => {
    if (!session || !userPhoto) return;

    setStep("processing");
    setProgress(0);
    setProcessingMessage(processingMessages[0]);
    postToParent("mirrorme:processingStart");

    try {
      // Create session first
      const sessionResponse = await fetch("/api/widget/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Merchant-Key": session.merchantKey,
        },
        body: JSON.stringify({
          product: {
            image: session.product.image,
            name: session.product.name,
            id: session.product.id,
            category: session.product.category,
            price: session.product.price,
            currency: session.product.currency,
            url: session.product.url,
            specification: session.product.specification,
            description: session.product.description,
          },
          user: {
            id: session.userId,
            image: userPhoto.startsWith("http") ? userPhoto : undefined,
          },
        }),
      });

      if (!sessionResponse.ok) {
        const errData = await sessionResponse.json();
        throw new Error(errData.error?.message || "Failed to create session");
      }

      const sessionData = await sessionResponse.json();
      setSessionId(sessionData.session.id);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((p) => {
          const newProgress = Math.min(p + Math.random() * 12, 90);
          postToParent("mirrorme:processingProgress", { progress: newProgress });
          return newProgress;
        });
      }, 600);

      // Submit try-on request
      const formData = new FormData();
      formData.append("sessionId", sessionData.session.id);

      if (creativePrompt.trim()) {
        formData.append("creativePrompt", creativePrompt.trim());
      }

      if (userPhotoFile) {
        formData.append("photo", userPhotoFile);
      } else if (userPhoto.startsWith("http")) {
        formData.append("photoUrl", userPhoto);
      } else {
        const response = await fetch(userPhoto);
        const blob = await response.blob();
        formData.append("photo", new File([blob], "photo.jpg", { type: "image/jpeg" }));
      }

      const tryOnResponse = await fetch("/api/widget/try-on", {
        method: "POST",
        headers: {
          "X-Merchant-Key": session.merchantKey,
        },
        body: formData,
      });

      clearInterval(progressInterval);

      if (!tryOnResponse.ok) {
        const errData = await tryOnResponse.json();
        throw new Error(errData.error?.message || "Try-on processing failed");
      }

      const resultData = await tryOnResponse.json();
      setProgress(100);

      const resultImageUrl = `/api/widget/result/${sessionData.session.id}`;

      setResult({
        sessionId: sessionData.session.id,
        imageUrl: resultImageUrl,
        thumbnailUrl: resultImageUrl,
        downloadUrl: resultData.result.downloadUrl,
        expiresAt: resultData.result.expiresAt,
        processingTime: resultData.result.processingTime,
      });

      setTimeout(() => setStep("result"), 500);
      postToParent("mirrorme:result", resultData.result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError({ code: "PROCESSING_ERROR", message: errorMessage });
      setStep("error");
      postToParent("mirrorme:error", { code: "PROCESSING_ERROR", message: errorMessage });
    }
  };

  // Handle download
  const handleDownload = async () => {
    if (!result) return;

    try {
      const response = await fetch(result.downloadUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mirror-me-${result.sessionId}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  // Handle share
  const handleShare = async () => {
    if (!result) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Virtual Try-On: ${session?.product.name || "Fashion Item"}`,
          text: "Check out how this looks on me!",
          url: result.imageUrl,
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(result.imageUrl);
      alert("Link copied to clipboard!");
    }
  };

  // Handle buy
  const handleBuy = () => {
    if (session?.product.url) {
      window.open(session.product.url, "_blank");
    }
    postToParent("mirrorme:close", { reason: "buy" });
  };

  // Reset
  const handleRetry = () => {
    setUserPhoto(null);
    setUserPhotoFile(null);
    setResult(null);
    setError(null);
    setProgress(0);
    setCreativePrompt("");
    setShowCreativeOptions(false);
    setStep("photo");
  };

  // Handle close
  const handleClose = () => {
    postToParent("mirrorme:close", { reason: "user" });
  };

  if (!session && step !== "error") {
    return (
      <div className="widget-embed widget-loading">
        <div className="loading-spinner" />
        <p>Loading...</p>
        <style>{embedStyles}</style>
      </div>
    );
  }

  // Show loading state while fetching model image from URL
  if (modelImageLoading) {
    return (
      <div className="widget-embed widget-loading">
        <div className="loading-spinner" />
        <p>Loading your photo...</p>
        <style>{embedStyles}</style>
      </div>
    );
  }

  return (
    <div className="widget-embed" data-step={step}>
      {/* Animated background */}
      <div className="bg-gradient" />
      <div className="bg-particles">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="particle" style={{ '--delay': `${i * 0.5}s`, '--x': `${Math.random() * 100}%` } as React.CSSProperties} />
        ))}
      </div>

      {/* Photo Selection Step */}
      {step === "photo" && (
        <div className="widget-step photo-step fade-in">
          <div className="step-header">
            <div className="header-icon">
              <Camera size={24} />
            </div>
            <h2>Upload Your Photo</h2>
            <p>Take a photo or upload one to see how this item looks on you</p>
          </div>

          {showCamera ? (
            <div className="camera-view glass-card">
              <video ref={videoRef} autoPlay playsInline muted className="camera-video" />
              <canvas ref={canvasRef} style={{ display: "none" }} />
              <div className="camera-overlay" />
              <div className="camera-controls">
                <button onClick={stopCamera} className="btn btn-glass btn-round">
                  <X size={20} />
                </button>
                <button onClick={capturePhoto} className="btn btn-capture">
                  <div className="capture-ring" />
                </button>
                <div style={{ width: 48 }} />
              </div>
            </div>
          ) : (
            <div className="photo-options">
              {session?.allowCamera && (
                <button onClick={startCamera} className="photo-option glass-card">
                  <div className="option-icon">
                    <Camera size={28} />
                  </div>
                  <span>Take a Photo</span>
                  <div className="option-glow" />
                </button>
              )}

              {session?.allowUpload && (
                <button onClick={() => fileInputRef.current?.click()} className="photo-option glass-card">
                  <div className="option-icon">
                    <Upload size={28} />
                  </div>
                  <span>Upload Photo</span>
                  <div className="option-glow" />
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: "none" }}
              />
            </div>
          )}

          <div className="product-preview glass-card">
            <div className="product-image-wrapper">
              <img src={session?.product.image} alt={session?.product.name || "Product"} />
              <div className="product-shine" />
            </div>
            {session?.product.name && <p className="product-name">{session.product.name}</p>}
          </div>
        </div>
      )}

      {/* Preview Step */}
      {step === "preview" && userPhoto && (
        <div className="widget-step preview-step fade-in">
          <div className="step-header">
            <div className="header-icon success">
              <Sparkles size={24} />
            </div>
            <h2>Looking Good!</h2>
            <p>Ready to see how it looks on you?</p>
          </div>

          <div className="preview-images">
            <div className="preview-image glass-card slide-in-left">
              <img src={userPhoto} alt="Your photo" />
              <span className="label">Your Photo</span>
            </div>

            <div className="preview-connector">
              <div className="connector-line" />
              <div className="connector-icon">
                <Wand2 size={20} />
              </div>
              <div className="connector-line" />
            </div>

            <div className="preview-image glass-card slide-in-right">
              <img src={session?.product.image} alt={session?.product.name || "Product"} />
              <span className="label">{session?.product.name || "Product"}</span>
            </div>
          </div>

          {/* Creative Options */}
          <div className="creative-options glass-card">
            <button
              onClick={() => setShowCreativeOptions(!showCreativeOptions)}
              className="creative-toggle"
              type="button"
            >
              <Sparkles size={16} className="sparkle-icon" />
              <span>Add creative styling</span>
              {showCreativeOptions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showCreativeOptions && (
              <div className="creative-input-wrapper slide-down">
                <textarea
                  value={creativePrompt}
                  onChange={(e) => setCreativePrompt(e.target.value)}
                  placeholder="Describe the setting or style you'd like...&#10;e.g., 'Evening party with elegant makeup' or 'Beach vacation, casual vibes'"
                  className="creative-input"
                  rows={3}
                  maxLength={500}
                />
                <span className="creative-hint">
                  Your styling preferences take priority
                </span>
              </div>
            )}
          </div>

          <div className="preview-actions">
            <button onClick={handleRetry} className="btn btn-glass">
              <ArrowLeft size={18} />
              Change Photo
            </button>
            <button onClick={processTryOn} className="btn btn-primary btn-mirror-me pulse-glow">
              <Wand2 size={18} />
              <span>Mirror Me</span>
            </button>
          </div>
        </div>
      )}

      {/* Processing Step */}
      {step === "processing" && (
        <div className="widget-step processing-step fade-in">
          <div className="processing-visual">
            {/* User photo */}
            <div className="processing-image left glass-card">
              <img src={userPhoto || ""} alt="Your photo" />
              <div className="image-pulse" />
            </div>

            {/* Magic connection */}
            <div className="processing-magic">
              <div className="magic-orb">
                <div className="orb-core" />
                <div className="orb-ring ring-1" />
                <div className="orb-ring ring-2" />
                <div className="orb-ring ring-3" />
              </div>
              <div className="magic-particles">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="magic-particle" style={{ '--i': i } as React.CSSProperties} />
                ))}
              </div>
              <div className="magic-beam left-beam" />
              <div className="magic-beam right-beam" />
            </div>

            {/* Product photo */}
            <div className="processing-image right glass-card">
              <img src={session?.product.image || ""} alt="Product" />
              <div className="image-pulse" />
            </div>
          </div>

          <div className="processing-info">
            <div className="progress-bar-wrapper">
              <div className="progress-bar" style={{ width: `${progress}%` }} />
              <div className="progress-glow" style={{ left: `${progress}%` }} />
            </div>
            <span className="progress-text">{Math.round(progress)}%</span>
          </div>

          <div className="processing-status">
            <p className="status-message typewriter">{processingMessage}</p>
          </div>
        </div>
      )}

      {/* Result Step */}
      {step === "result" && result && (
        <div className="widget-step result-step fade-in">
          <div className="result-reveal">
            <div className="result-image glass-card scale-in">
              <img src={result.imageUrl} alt="Virtual try-on result" />
              <div className="result-shine" />
            </div>
            <div className="result-sparkles">
              {[...Array(8)].map((_, i) => (
                <Sparkles key={i} className="result-sparkle" style={{ '--i': i } as React.CSSProperties} size={16} />
              ))}
            </div>
          </div>

          <div className="result-info">
            {session?.product.name && <h3>{session.product.name}</h3>}
            {session?.product.price && (
              <p className="price">{formatPrice(session.product.price, session.product.currency)}</p>
            )}
          </div>

          <div className="result-actions">
            <button onClick={handleDownload} className="btn btn-glass btn-round" title="Download">
              <Download size={20} />
            </button>
            <button onClick={handleShare} className="btn btn-glass btn-round" title="Share">
              <Share2 size={20} />
            </button>
            <button onClick={handleRetry} className="btn btn-glass btn-round" title="Try Another">
              <RotateCcw size={20} />
            </button>
            {session?.product.url && (
              <button onClick={handleBuy} className="btn btn-primary btn-buy">
                <ShoppingCart size={18} />
                Buy Now
              </button>
            )}
          </div>

          <div className="widget-footer">
            <span className="powered-by">Powered by</span>
            <span className="brand-name">Mirror.me</span>
          </div>
        </div>
      )}

      {/* Error Step */}
      {step === "error" && error && (
        <div className="widget-step error-step fade-in">
          <div className="error-icon glass-card">
            <AlertCircle size={48} />
          </div>
          <h2>Oops! Something went wrong</h2>
          <p>{error.message}</p>
          <div className="error-actions">
            <button onClick={handleRetry} className="btn btn-primary">
              Try Again
            </button>
            <button onClick={handleClose} className="btn btn-glass">
              Close
            </button>
          </div>
        </div>
      )}

      <style>{embedStyles}</style>
    </div>
  );
}

// Modern glassmorphism styles
const embedStyles = `
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  :root {
    --primary: #8b5cf6;
    --primary-light: #a78bfa;
    --primary-dark: #7c3aed;
    --accent: #f472b6;
    --background: #0f0f23;
    --background-light: #1a1a2e;
    --surface: rgba(255, 255, 255, 0.05);
    --surface-hover: rgba(255, 255, 255, 0.1);
    --glass: rgba(255, 255, 255, 0.08);
    --glass-border: rgba(255, 255, 255, 0.15);
    --text: #f8fafc;
    --text-muted: #94a3b8;
    --text-dim: #64748b;
    --error: #f87171;
    --success: #34d399;
    --radius: 16px;
    --radius-lg: 24px;
  }

  [data-theme="light"] {
    --background: #f8fafc;
    --background-light: #ffffff;
    --surface: rgba(0, 0, 0, 0.03);
    --surface-hover: rgba(0, 0, 0, 0.06);
    --glass: rgba(255, 255, 255, 0.7);
    --glass-border: rgba(0, 0, 0, 0.1);
    --text: #1e293b;
    --text-muted: #64748b;
    --text-dim: #94a3b8;
  }

  body {
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    background: var(--background);
    color: var(--text);
    line-height: 1.6;
    overflow-x: hidden;
  }

  /* Main Container */
  .widget-embed {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    padding: 24px;
    position: relative;
    overflow: hidden;
  }

  /* Animated Background */
  .bg-gradient {
    position: fixed;
    inset: 0;
    background:
      radial-gradient(ellipse at 20% 20%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 80%, rgba(244, 114, 182, 0.1) 0%, transparent 50%),
      radial-gradient(ellipse at 50% 50%, rgba(139, 92, 246, 0.05) 0%, transparent 70%);
    animation: bgPulse 8s ease-in-out infinite;
    pointer-events: none;
  }

  @keyframes bgPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  .bg-particles {
    position: fixed;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
  }

  .particle {
    position: absolute;
    width: 4px;
    height: 4px;
    background: var(--primary-light);
    border-radius: 50%;
    left: var(--x);
    bottom: -10px;
    opacity: 0.4;
    animation: particleFloat 15s linear infinite;
    animation-delay: var(--delay);
  }

  @keyframes particleFloat {
    0% { transform: translateY(0) scale(1); opacity: 0; }
    10% { opacity: 0.4; }
    90% { opacity: 0.4; }
    100% { transform: translateY(-100vh) scale(0.5); opacity: 0; }
  }

  /* Glass Card Effect */
  .glass-card {
    background: var(--glass);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .glass-card:hover {
    background: var(--surface-hover);
    border-color: rgba(139, 92, 246, 0.3);
    transform: translateY(-2px);
  }

  /* Loading State */
  .widget-loading {
    align-items: center;
    justify-content: center;
    gap: 16px;
    color: var(--text-muted);
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--surface);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Widget Steps */
  .widget-step {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    position: relative;
    z-index: 1;
  }

  /* Animations */
  .fade-in {
    animation: fadeIn 0.5s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .slide-in-left {
    animation: slideInLeft 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  }

  @keyframes slideInLeft {
    from { opacity: 0; transform: translateX(-30px); }
    to { opacity: 1; transform: translateX(0); }
  }

  .slide-in-right {
    animation: slideInRight 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  }

  @keyframes slideInRight {
    from { opacity: 0; transform: translateX(30px); }
    to { opacity: 1; transform: translateX(0); }
  }

  .slide-down {
    animation: slideDown 0.3s ease-out;
  }

  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .scale-in {
    animation: scaleIn 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }

  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.9); }
    to { opacity: 1; transform: scale(1); }
  }

  /* Step Header */
  .step-header {
    text-align: center;
    max-width: 320px;
  }

  .header-icon {
    width: 56px;
    height: 56px;
    margin: 0 auto 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
    border-radius: 16px;
    color: white;
    box-shadow: 0 8px 32px rgba(139, 92, 246, 0.3);
  }

  .header-icon.success {
    background: linear-gradient(135deg, var(--success) 0%, #10b981 100%);
    box-shadow: 0 8px 32px rgba(52, 211, 153, 0.3);
  }

  .step-header h2 {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 8px;
    background: linear-gradient(135deg, var(--text) 0%, var(--text-muted) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .step-header p {
    color: var(--text-muted);
    font-size: 14px;
  }

  /* Photo Options */
  .photo-options {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .photo-option {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 32px 40px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    color: var(--text);
    background: var(--glass);
  }

  .option-icon {
    width: 64px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
    border-radius: 16px;
    color: white;
    transition: transform 0.3s ease;
  }

  .photo-option:hover .option-icon {
    transform: scale(1.1) rotate(-5deg);
  }

  .photo-option span {
    font-weight: 500;
    font-size: 14px;
  }

  .option-glow {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.2) 0%, transparent 70%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .photo-option:hover .option-glow {
    opacity: 1;
  }

  /* Camera View */
  .camera-view {
    width: 100%;
    max-width: 380px;
    position: relative;
    overflow: hidden;
    padding: 4px;
  }

  .camera-video {
    width: 100%;
    display: block;
    transform: scaleX(-1);
    border-radius: 12px;
  }

  .camera-overlay {
    position: absolute;
    inset: 4px;
    border: 2px dashed rgba(255, 255, 255, 0.3);
    border-radius: 12px;
    pointer-events: none;
  }

  .camera-controls {
    position: absolute;
    bottom: 20px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 24px;
  }

  .btn-capture {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: white;
    border: 4px solid rgba(255, 255, 255, 0.5);
    padding: 4px;
    cursor: pointer;
    transition: transform 0.2s ease;
  }

  .btn-capture:hover {
    transform: scale(1.05);
  }

  .btn-capture:active {
    transform: scale(0.95);
  }

  .capture-ring {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  }

  /* Product Preview */
  .product-preview {
    text-align: center;
    padding: 16px;
    max-width: 180px;
  }

  .product-image-wrapper {
    position: relative;
    overflow: hidden;
    border-radius: 12px;
  }

  .product-preview img {
    width: 100%;
    height: 140px;
    object-fit: contain;
  }

  .product-shine {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, transparent 40%, rgba(255, 255, 255, 0.1) 50%, transparent 60%);
    animation: shine 3s ease-in-out infinite;
  }

  @keyframes shine {
    0%, 100% { transform: translateX(-100%); }
    50% { transform: translateX(100%); }
  }

  .product-name {
    margin-top: 12px;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-muted);
  }

  /* Preview Step */
  .preview-images {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .preview-image {
    text-align: center;
    padding: 8px;
  }

  .preview-image img {
    width: 130px;
    height: 170px;
    object-fit: cover;
    border-radius: 12px;
  }

  .preview-image .label {
    display: block;
    margin-top: 10px;
    font-size: 12px;
    color: var(--text-muted);
    font-weight: 500;
  }

  .preview-connector {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 0 8px;
  }

  .connector-line {
    width: 2px;
    height: 20px;
    background: linear-gradient(to bottom, transparent, var(--primary), transparent);
  }

  .connector-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
    border-radius: 12px;
    color: white;
    animation: connectorPulse 2s ease-in-out infinite;
  }

  @keyframes connectorPulse {
    0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.4); }
    50% { transform: scale(1.1); box-shadow: 0 0 20px 5px rgba(139, 92, 246, 0.2); }
  }

  .preview-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    justify-content: center;
  }

  /* Creative Options */
  .creative-options {
    width: 100%;
    max-width: 340px;
    padding: 4px;
  }

  .creative-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 12px 16px;
    background: transparent;
    border: none;
    border-radius: 12px;
    color: var(--text-muted);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .creative-toggle:hover {
    color: var(--primary);
    background: var(--surface);
  }

  .sparkle-icon {
    color: var(--primary);
    animation: sparkle 2s ease-in-out infinite;
  }

  @keyframes sparkle {
    0%, 100% { transform: scale(1) rotate(0deg); }
    50% { transform: scale(1.2) rotate(10deg); }
  }

  .creative-input-wrapper {
    padding: 12px;
  }

  .creative-input {
    width: 100%;
    padding: 14px;
    border: 1px solid var(--glass-border);
    border-radius: 12px;
    background: var(--surface);
    color: var(--text);
    font-size: 13px;
    font-family: inherit;
    resize: none;
    transition: all 0.2s ease;
  }

  .creative-input:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
  }

  .creative-input::placeholder {
    color: var(--text-dim);
  }

  .creative-hint {
    display: block;
    margin-top: 8px;
    font-size: 11px;
    color: var(--text-dim);
    text-align: center;
  }

  /* Processing Step */
  .processing-step {
    justify-content: center;
  }

  .processing-visual {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 32px;
  }

  .processing-image {
    width: 100px;
    height: 130px;
    padding: 4px;
    position: relative;
  }

  .processing-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 10px;
  }

  .image-pulse {
    position: absolute;
    inset: 0;
    border-radius: var(--radius);
    border: 2px solid var(--primary);
    animation: imagePulse 2s ease-in-out infinite;
  }

  @keyframes imagePulse {
    0%, 100% { opacity: 0.3; transform: scale(1); }
    50% { opacity: 0.8; transform: scale(1.02); }
  }

  .processing-magic {
    position: relative;
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .magic-orb {
    position: relative;
    width: 40px;
    height: 40px;
  }

  .orb-core {
    position: absolute;
    inset: 8px;
    background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
    border-radius: 50%;
    animation: orbPulse 1.5s ease-in-out infinite;
  }

  @keyframes orbPulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.2); opacity: 0.8; }
  }

  .orb-ring {
    position: absolute;
    inset: 0;
    border: 2px solid var(--primary);
    border-radius: 50%;
    opacity: 0.5;
  }

  .ring-1 {
    animation: ringExpand 2s ease-out infinite;
  }

  .ring-2 {
    animation: ringExpand 2s ease-out infinite 0.5s;
  }

  .ring-3 {
    animation: ringExpand 2s ease-out infinite 1s;
  }

  @keyframes ringExpand {
    0% { transform: scale(1); opacity: 0.5; }
    100% { transform: scale(2.5); opacity: 0; }
  }

  .magic-particles {
    position: absolute;
    inset: 0;
  }

  .magic-particle {
    position: absolute;
    width: 4px;
    height: 4px;
    background: var(--primary-light);
    border-radius: 50%;
    left: 50%;
    top: 50%;
    animation: particleOrbit 3s linear infinite;
    animation-delay: calc(var(--i) * 0.25s);
  }

  @keyframes particleOrbit {
    0% { transform: rotate(0deg) translateX(30px) scale(1); opacity: 1; }
    100% { transform: rotate(360deg) translateX(30px) scale(0.5); opacity: 0.3; }
  }

  .magic-beam {
    position: absolute;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--primary), transparent);
    top: 50%;
    transform: translateY(-50%);
  }

  .left-beam {
    right: 50%;
    width: 60px;
    animation: beamPulse 1.5s ease-in-out infinite;
  }

  .right-beam {
    left: 50%;
    width: 60px;
    animation: beamPulse 1.5s ease-in-out infinite 0.5s;
  }

  @keyframes beamPulse {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 1; }
  }

  .processing-info {
    text-align: center;
    width: 100%;
    max-width: 280px;
  }

  .progress-bar-wrapper {
    height: 6px;
    background: var(--surface);
    border-radius: 3px;
    overflow: hidden;
    position: relative;
  }

  .progress-bar {
    height: 100%;
    background: linear-gradient(90deg, var(--primary) 0%, var(--accent) 100%);
    border-radius: 3px;
    transition: width 0.3s ease;
  }

  .progress-glow {
    position: absolute;
    top: -2px;
    width: 20px;
    height: 10px;
    background: var(--primary);
    border-radius: 50%;
    filter: blur(6px);
    transition: left 0.3s ease;
  }

  .progress-text {
    display: block;
    margin-top: 12px;
    font-size: 24px;
    font-weight: 700;
    background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .processing-status {
    margin-top: 16px;
    min-height: 24px;
  }

  .status-message {
    color: var(--text-muted);
    font-size: 14px;
    animation: fadeInUp 0.5s ease;
  }

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(5px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* Result Step */
  .result-step {
    gap: 20px;
  }

  .result-reveal {
    position: relative;
  }

  .result-image {
    max-width: 360px;
    overflow: hidden;
    padding: 8px;
    position: relative;
  }

  .result-image img {
    width: 100%;
    display: block;
    border-radius: 12px;
  }

  .result-shine {
    position: absolute;
    inset: 8px;
    background: linear-gradient(135deg, transparent 40%, rgba(255, 255, 255, 0.15) 50%, transparent 60%);
    border-radius: 12px;
    animation: resultShine 2s ease-in-out 0.5s;
  }

  @keyframes resultShine {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }

  .result-sparkles {
    position: absolute;
    inset: -20px;
    pointer-events: none;
  }

  .result-sparkle {
    position: absolute;
    color: var(--primary);
    animation: sparkleFloat 1s ease-out forwards;
    animation-delay: calc(var(--i) * 0.1s);
    opacity: 0;
  }

  .result-sparkle:nth-child(1) { top: 10%; left: 10%; }
  .result-sparkle:nth-child(2) { top: 10%; right: 10%; }
  .result-sparkle:nth-child(3) { top: 30%; left: 5%; }
  .result-sparkle:nth-child(4) { top: 30%; right: 5%; }
  .result-sparkle:nth-child(5) { top: 60%; left: 5%; }
  .result-sparkle:nth-child(6) { top: 60%; right: 5%; }
  .result-sparkle:nth-child(7) { bottom: 10%; left: 15%; }
  .result-sparkle:nth-child(8) { bottom: 10%; right: 15%; }

  @keyframes sparkleFloat {
    0% { opacity: 0; transform: scale(0) rotate(0deg); }
    50% { opacity: 1; transform: scale(1.2) rotate(180deg); }
    100% { opacity: 0; transform: scale(0.5) rotate(360deg) translateY(-20px); }
  }

  .result-info {
    text-align: center;
  }

  .result-info h3 {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 4px;
  }

  .result-info .price {
    font-size: 22px;
    font-weight: 700;
    background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .result-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .widget-footer {
    margin-top: auto;
    padding-top: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 12px;
    color: var(--text-dim);
  }

  .brand-name {
    font-weight: 600;
    background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* Error Step */
  .error-step {
    justify-content: center;
    text-align: center;
  }

  .error-step .error-icon {
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--error);
    margin-bottom: 8px;
  }

  .error-actions {
    display: flex;
    gap: 12px;
  }

  /* Buttons */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 24px;
    font-size: 14px;
    font-weight: 600;
    border: none;
    border-radius: var(--radius);
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
  }

  .btn-primary {
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
    color: white;
    box-shadow: 0 4px 14px rgba(139, 92, 246, 0.3);
  }

  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
  }

  .btn-primary:active {
    transform: translateY(0);
  }

  .btn-glass {
    background: var(--glass);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid var(--glass-border);
    color: var(--text);
  }

  .btn-glass:hover {
    background: var(--surface-hover);
    border-color: var(--primary);
  }

  .btn-round {
    width: 48px;
    height: 48px;
    padding: 0;
    border-radius: 50%;
  }

  .btn-mirror-me {
    padding: 14px 28px;
    font-size: 15px;
  }

  .pulse-glow {
    animation: pulseGlow 2s ease-in-out infinite;
  }

  @keyframes pulseGlow {
    0%, 100% { box-shadow: 0 4px 14px rgba(139, 92, 246, 0.3); }
    50% { box-shadow: 0 4px 24px rgba(139, 92, 246, 0.5), 0 0 40px rgba(139, 92, 246, 0.2); }
  }

  .btn-buy {
    padding: 12px 28px;
    background: linear-gradient(135deg, var(--success) 0%, #10b981 100%);
    box-shadow: 0 4px 14px rgba(52, 211, 153, 0.3);
  }

  .btn-buy:hover {
    box-shadow: 0 6px 20px rgba(52, 211, 153, 0.4);
  }

  /* Responsive */
  @media (max-width: 480px) {
    .widget-embed {
      padding: 16px;
    }

    .photo-option {
      padding: 24px 32px;
    }

    .preview-image img {
      width: 100px;
      height: 130px;
    }

    .processing-image {
      width: 80px;
      height: 105px;
    }

    .processing-magic {
      width: 60px;
      height: 60px;
    }
  }
`;
