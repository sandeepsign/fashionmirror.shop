import { useState, useEffect, useRef, useCallback } from "react";
import { Camera, Upload, RotateCcw, Download, Share2, ShoppingCart, ArrowLeft, AlertCircle, Loader2, X, Sparkles, ChevronDown, ChevronUp } from "lucide-react";

console.log("[Widget] Module loaded - version 2");

// Types
interface ProductInfo {
  image: string;
  name?: string;
  id?: string;
  category?: string;
  price?: number;
  currency?: string;
  url?: string;
  specification?: string;  // Product specifications (e.g., "100% Cotton, Machine Washable")
  description?: string;    // Long-form product description
}

interface SessionData {
  merchantKey: string;
  product: ProductInfo;
  userImage?: string;
  userId?: string;
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

    // If user image provided and skip step enabled, go directly to processing
    if (sessionData.userImage && sessionData.skipPhotoStep) {
      setUserPhoto(sessionData.userImage);
      setStep("preview");
    }

    // Notify parent that we're ready
    postToParent("mirrorme:ready");
  }, []);

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

    setUserPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setUserPhoto(event.target?.result as string);
      setStep("preview");
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
    postToParent("mirrorme:processingStart");

    try {
      // Create session first - include specification and description for AI prompt enhancement
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
            specification: session.product.specification,  // e.g., "Slim Fit, Choker Style, 100% Cotton"
            description: session.product.description,      // Long-form product description
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
          const newProgress = Math.min(p + Math.random() * 15, 90);
          postToParent("mirrorme:processingProgress", { progress: newProgress });
          return newProgress;
        });
      }, 500);

      // Submit try-on request
      const formData = new FormData();
      formData.append("sessionId", sessionData.session.id);

      // Include user's creative prompt if provided (e.g., "evening party setting with elegant makeup")
      if (creativePrompt.trim()) {
        formData.append("creativePrompt", creativePrompt.trim());
      }

      if (userPhotoFile) {
        formData.append("photo", userPhotoFile);
      } else if (userPhoto.startsWith("http")) {
        formData.append("photoUrl", userPhoto);
      } else {
        // Convert data URL to blob
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

      // Use the widget result endpoint for images (handles protected media)
      const resultImageUrl = `/api/widget/result/${sessionData.session.id}`;
      console.log('[Widget] Setting result image URL:', resultImageUrl);

      setResult({
        sessionId: sessionData.session.id,
        imageUrl: resultImageUrl,
        thumbnailUrl: resultImageUrl,
        downloadUrl: resultData.result.downloadUrl,
        expiresAt: resultData.result.expiresAt,
        processingTime: resultData.result.processingTime,
      });

      setStep("result");
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
        // User cancelled or error
      }
    } else {
      // Fallback: copy link
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

  // Reset to try another photo
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
        <Loader2 className="animate-spin" size={32} />
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="widget-embed" data-step={step}>
      {/* Photo Selection Step */}
      {step === "photo" && (
        <div className="widget-step photo-step">
          <div className="step-header">
            <h2>Upload Your Photo</h2>
            <p>Take a photo or upload one to see how this item looks on you</p>
          </div>

          {showCamera ? (
            <div className="camera-view">
              <video ref={videoRef} autoPlay playsInline muted className="camera-video" />
              <canvas ref={canvasRef} style={{ display: "none" }} />
              <div className="camera-controls">
                <button onClick={stopCamera} className="btn btn-secondary">
                  <X size={20} />
                </button>
                <button onClick={capturePhoto} className="btn btn-capture">
                  <div className="capture-ring" />
                </button>
                <div style={{ width: 44 }} />
              </div>
            </div>
          ) : (
            <div className="photo-options">
              {session?.allowCamera && (
                <button onClick={startCamera} className="photo-option">
                  <Camera size={32} />
                  <span>Take a Photo</span>
                </button>
              )}

              {session?.allowUpload && (
                <button onClick={() => fileInputRef.current?.click()} className="photo-option">
                  <Upload size={32} />
                  <span>Upload Photo</span>
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

          <div className="product-preview">
            <img src={session?.product.image} alt={session?.product.name || "Product"} />
            {session?.product.name && <p className="product-name">{session.product.name}</p>}
          </div>
        </div>
      )}

      {/* Preview Step */}
      {step === "preview" && userPhoto && (
        <div className="widget-step preview-step">
          <div className="step-header">
            <h2>Looking Good!</h2>
            <p>Ready to see how it looks on you?</p>
          </div>

          <div className="preview-images">
            <div className="preview-image user-preview">
              <img src={userPhoto} alt="Your photo" />
              <span className="label">Your Photo</span>
            </div>
            <div className="preview-plus">+</div>
            <div className="preview-image product-preview-img">
              <img src={session?.product.image} alt={session?.product.name || "Product"} />
              <span className="label">{session?.product.name || "Product"}</span>
            </div>
          </div>

          {/* Creative Options - Collapsible */}
          <div className="creative-options">
            <button
              onClick={() => setShowCreativeOptions(!showCreativeOptions)}
              className="creative-toggle"
              type="button"
            >
              <Sparkles size={16} />
              <span>Add creative styling</span>
              {showCreativeOptions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showCreativeOptions && (
              <div className="creative-input-wrapper">
                <textarea
                  value={creativePrompt}
                  onChange={(e) => setCreativePrompt(e.target.value)}
                  placeholder="Describe the setting or style you'd like...&#10;e.g., 'Evening party with elegant makeup' or 'Outdoor track field, athletic pose'"
                  className="creative-input"
                  rows={3}
                  maxLength={500}
                />
                <span className="creative-hint">
                  Optional: Your styling preferences take priority
                </span>
              </div>
            )}
          </div>

          <div className="preview-actions">
            <button onClick={handleRetry} className="btn btn-secondary">
              <ArrowLeft size={18} />
              Change Photo
            </button>
            <button onClick={processTryOn} className="btn btn-primary btn-mirror-me">
              <svg className="mirror-me-logo" viewBox="0 0 800 210" xmlns="http://www.w3.org/2000/svg">
                <text x="40" y="145"
                      fill="currentColor"
                      fontFamily="Comic Sans MS, Comic Sans, cursive"
                      fontStyle="italic"
                      fontWeight="700"
                      fontSize="130"
                      letterSpacing="-3">
                  Mirror
                </text>
                <rect x="455" y="128" width="14" height="14"
                      fill="currentColor"
                      transform="rotate(45 462 135)" />
                <text x="482" y="145"
                      fill="currentColor"
                      fontFamily="Inter, Arial, sans-serif"
                      fontWeight="600"
                      fontSize="90">
                  me
                </text>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Processing Step */}
      {step === "processing" && (
        <div className="widget-step processing-step">
          <div className="processing-animation">
            <div className="processing-ring" style={{ '--progress': `${progress}%` } as React.CSSProperties} />
            <span className="progress-text">{Math.round(progress)}%</span>
          </div>
          <h2>Creating Your Virtual Try-On</h2>
          <p>This usually takes a few seconds...</p>
        </div>
      )}

      {/* Result Step */}
      {step === "result" && result && (
        <div className="widget-step result-step">
          <div className="result-image">
            <img src={result.imageUrl} alt="Virtual try-on result" />
          </div>

          <div className="result-info">
            {session?.product.name && <h3>{session.product.name}</h3>}
            {session?.product.price && (
              <p className="price">{formatPrice(session.product.price, session.product.currency)}</p>
            )}
            {session?.product.specification && (
              <p className="specification">{session.product.specification}</p>
            )}
            {session?.product.description && (
              <p className="description">{session.product.description}</p>
            )}
          </div>

          <div className="result-actions">
            <button onClick={handleDownload} className="btn btn-icon" title="Download">
              <Download size={20} />
            </button>
            <button onClick={handleShare} className="btn btn-icon" title="Share">
              <Share2 size={20} />
            </button>
            <button onClick={handleRetry} className="btn btn-icon" title="Try Another">
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
            <svg className="mirror-logo" viewBox="0 0 800 210" xmlns="http://www.w3.org/2000/svg">
              <text x="40" y="145"
                    fill="currentColor"
                    fontFamily="Comic Sans MS, Comic Sans, cursive"
                    fontStyle="italic"
                    fontWeight="700"
                    fontSize="130"
                    letterSpacing="-3">
                Mirror
              </text>
              <rect x="455" y="128" width="14" height="14"
                    fill="currentColor"
                    transform="rotate(45 462 135)" />
              <text x="482" y="145"
                    fill="currentColor"
                    fontFamily="Inter, Arial, sans-serif"
                    fontWeight="600"
                    fontSize="90">
                me
              </text>
            </svg>
          </div>
        </div>
      )}

      {/* Error Step */}
      {step === "error" && error && (
        <div className="widget-step error-step">
          <div className="error-icon">
            <AlertCircle size={48} />
          </div>
          <h2>Oops! Something went wrong</h2>
          <p>{error.message}</p>
          <div className="error-actions">
            <button onClick={handleRetry} className="btn btn-primary">
              Try Again
            </button>
            <button onClick={handleClose} className="btn btn-secondary">
              Close
            </button>
          </div>
        </div>
      )}

      <style>{embedStyles}</style>
    </div>
  );
}

// Embedded styles for the iframe content
const embedStyles = `
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  :root {
    --primary: #6366f1;
    --primary-hover: #4f46e5;
    --background: #ffffff;
    --surface: #f8fafc;
    --text: #1e293b;
    --text-muted: #64748b;
    --border: #e2e8f0;
    --error: #ef4444;
    --success: #22c55e;
    --radius: 12px;
  }

  [data-theme="dark"] {
    --background: #0f172a;
    --surface: #1e293b;
    --text: #f1f5f9;
    --text-muted: #94a3b8;
    --border: #334155;
  }

  body {
    font-family: system-ui, -apple-system, sans-serif;
    background: var(--background);
    color: var(--text);
    line-height: 1.5;
  }

  .widget-embed {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    padding: 24px;
  }

  .widget-loading {
    align-items: center;
    justify-content: center;
    gap: 16px;
    color: var(--text-muted);
  }

  .widget-step {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
  }

  .step-header {
    text-align: center;
  }

  .step-header h2 {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 8px;
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
    padding: 32px 48px;
    background: var(--surface);
    border: 2px dashed var(--border);
    border-radius: var(--radius);
    cursor: pointer;
    transition: all 0.2s;
    color: var(--text);
  }

  .photo-option:hover {
    border-color: var(--primary);
    background: color-mix(in srgb, var(--primary) 5%, var(--surface));
  }

  .photo-option svg {
    color: var(--primary);
  }

  /* Camera View */
  .camera-view {
    width: 100%;
    max-width: 400px;
    position: relative;
    border-radius: var(--radius);
    overflow: hidden;
    background: #000;
  }

  .camera-video {
    width: 100%;
    display: block;
    transform: scaleX(-1);
  }

  .camera-controls {
    position: absolute;
    bottom: 16px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 24px;
  }

  .btn-capture {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: white;
    border: 4px solid white;
    padding: 4px;
  }

  .capture-ring {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: var(--error);
  }

  /* Product Preview */
  .product-preview {
    text-align: center;
    padding: 16px;
    background: var(--surface);
    border-radius: var(--radius);
    max-width: 200px;
  }

  .product-preview img {
    width: 100%;
    height: 150px;
    object-fit: contain;
    border-radius: 8px;
  }

  .product-name {
    margin-top: 12px;
    font-size: 14px;
    font-weight: 500;
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
  }

  .preview-image img {
    width: 140px;
    height: 180px;
    object-fit: cover;
    border-radius: var(--radius);
    box-shadow: 0 4px 12px rgb(0 0 0 / 0.1);
  }

  .preview-image .label {
    display: block;
    margin-top: 8px;
    font-size: 12px;
    color: var(--text-muted);
  }

  .preview-plus {
    font-size: 32px;
    color: var(--text-muted);
    font-weight: 300;
  }

  .preview-actions {
    display: flex;
    gap: 12px;
  }

  /* Creative Options */
  .creative-options {
    width: 100%;
    max-width: 340px;
  }

  .creative-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 10px 16px;
    background: transparent;
    border: 1px dashed var(--border);
    border-radius: var(--radius);
    color: var(--text-muted);
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .creative-toggle:hover {
    border-color: var(--primary);
    color: var(--primary);
    background: color-mix(in srgb, var(--primary) 5%, transparent);
  }

  .creative-toggle svg:first-child {
    color: var(--primary);
  }

  .creative-input-wrapper {
    margin-top: 12px;
    animation: slideDown 0.2s ease-out;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .creative-input {
    width: 100%;
    padding: 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
    color: var(--text);
    font-size: 13px;
    font-family: inherit;
    resize: none;
    transition: border-color 0.2s;
  }

  .creative-input:focus {
    outline: none;
    border-color: var(--primary);
  }

  .creative-input::placeholder {
    color: var(--text-muted);
    opacity: 0.7;
  }

  .creative-hint {
    display: block;
    margin-top: 6px;
    font-size: 11px;
    color: var(--text-muted);
    text-align: center;
  }

  /* Processing Step */
  .processing-step {
    justify-content: center;
  }

  .processing-animation {
    position: relative;
    width: 120px;
    height: 120px;
  }

  .processing-ring {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 6px solid var(--border);
    border-top-color: var(--primary);
    animation: spin 1s linear infinite;
    background: conic-gradient(
      var(--primary) var(--progress, 0%),
      var(--border) var(--progress, 0%)
    );
    -webkit-mask: radial-gradient(farthest-side, transparent 70%, black 71%);
    mask: radial-gradient(farthest-side, transparent 70%, black 71%);
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .progress-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 24px;
    font-weight: 600;
    color: var(--primary);
  }

  /* Result Step */
  .result-image {
    width: 100%;
    max-width: 400px;
    border-radius: var(--radius);
    overflow: hidden;
    box-shadow: 0 8px 24px rgb(0 0 0 / 0.15);
  }

  .result-image img {
    width: 100%;
    display: block;
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
    font-size: 20px;
    font-weight: 700;
    color: var(--primary);
  }

  .result-info .specification {
    font-size: 12px;
    color: var(--text-muted);
    margin-top: 8px;
    padding: 8px 12px;
    background: var(--surface);
    border-radius: 6px;
    max-width: 300px;
  }

  .result-info .description {
    font-size: 13px;
    color: var(--text-muted);
    margin-top: 8px;
    line-height: 1.5;
    max-width: 300px;
    max-height: 80px;
    overflow-y: auto;
    text-align: left;
    padding: 8px;
  }

  .result-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .widget-footer {
    margin-top: auto;
    padding-top: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 11px;
    color: var(--text-muted);
  }

  .widget-footer .powered-by {
    opacity: 0.7;
  }

  .widget-footer .mirror-logo {
    height: 16px;
    width: auto;
    color: var(--text);
  }

  /* Error Step */
  .error-step {
    justify-content: center;
    text-align: center;
  }

  .error-icon {
    color: var(--error);
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
    font-weight: 500;
    border: none;
    border-radius: var(--radius);
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn-primary {
    background: var(--primary);
    color: white;
  }

  .btn-primary:hover {
    background: var(--primary-hover);
  }

  .btn-secondary {
    background: var(--surface);
    color: var(--text);
    border: 1px solid var(--border);
  }

  .btn-secondary:hover {
    background: var(--border);
  }

  .btn-icon {
    width: 44px;
    height: 44px;
    padding: 0;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 50%;
    color: var(--text);
  }

  .btn-icon:hover {
    background: var(--border);
  }

  .btn-buy {
    padding: 12px 32px;
  }

  .btn-mirror-me {
    background: linear-gradient(to bottom, #151515 0%, #040404 50%, #000000 100%);
    padding: 10px 20px;
  }

  .btn-mirror-me:hover {
    background: linear-gradient(to bottom, #252525 0%, #101010 50%, #050505 100%);
    transform: translateY(-1px);
  }

  .btn-mirror-me .mirror-me-logo {
    height: 24px;
    width: auto;
    fill: white;
    color: white;
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
  }
`;
