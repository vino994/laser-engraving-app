import React, { useEffect, useRef, useState } from "react";
import { canvasRGBA } from "stackblur-canvas";

export default function PencilSketch({ imageSrc }) {
  const canvasRef = useRef();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!imageSrc) return;

    setLoading(true);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => drawSketch(img);
    img.src = imageSrc;
  }, [imageSrc]);

  async function drawSketch(img) {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    // Resize for performance
    const MAX_DIM = 1200;
    let w = img.naturalWidth || img.width;
    let h = img.naturalHeight || img.height;
    const scale = Math.min(1, MAX_DIM / Math.max(w, h));
    w = Math.round(w * scale);
    h = Math.round(h * scale);
    canvas.width = w;
    canvas.height = h;

    // Step 1: grayscale
    ctx.drawImage(img, 0, 0, w, h);
    const base = ctx.getImageData(0, 0, w, h);
    toGray(base);

    // Step 2: invert
    const inverted = new ImageData(new Uint8ClampedArray(base.data), w, h);
    invert(inverted);

    // Step 3: blur inverted
    const temp = document.createElement("canvas");
    temp.width = w;
    temp.height = h;
    const tctx = temp.getContext("2d");
    tctx.putImageData(inverted, 0, 0);
    canvasRGBA(temp, 0, 0, w, h, 18);
    const blurred = tctx.getImageData(0, 0, w, h);

    // Step 4: color dodge blend
    const sketchData = colorDodge(base, blurred);
    enhanceContrast(sketchData);

    ctx.putImageData(sketchData, 0, 0);

    // Step 5: paper background + border
    addPaperBackground(ctx, w, h);

    // Step 6: overlay texture (multiply)
    await overlayPaperTexture(ctx, w, h);

    setLoading(false);
    console.log("Sketch ready!");
  }

  // --- helpers ---

  function toGray(imageData) {
    const d = imageData.data;
    for (let i = 0; i < d.length; i += 4) {
      const avg = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
      d[i] = d[i + 1] = d[i + 2] = avg;
    }
  }

  function invert(imageData) {
    const d = imageData.data;
    for (let i = 0; i < d.length; i += 4) {
      d[i] = 255 - d[i];
      d[i + 1] = 255 - d[i + 1];
      d[i + 2] = 255 - d[i + 2];
    }
  }

  function colorDodge(base, top) {
    const bd = base.data;
    const td = top.data;
    for (let i = 0; i < bd.length; i += 4) {
      for (let c = 0; c < 3; c++) {
        const b = bd[i + c];
        const t = td[i + c];
        bd[i + c] = Math.min(255, (b * 255) / (255 - t + 1));
      }
      bd[i + 3] = 255;
    }
    return base;
  }

  function enhanceContrast(imageData) {
    const d = imageData.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = d[i];
      const adjusted = v < 200 ? v * 0.85 : v;
      d[i] = d[i + 1] = d[i + 2] = adjusted;
    }
  }

  function addPaperBackground(ctx, w, h) {
    ctx.globalCompositeOperation = "destination-over";
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#fbfaf7");
    grad.addColorStop(1, "#f3f1ec");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Border
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = "rgba(60,60,60,0.25)";
    ctx.lineWidth = Math.max(2, Math.min(w, h) * 0.012);
    ctx.strokeRect(
      ctx.lineWidth / 2,
      ctx.lineWidth / 2,
      w - ctx.lineWidth,
      h - ctx.lineWidth
    );
  }

  async function overlayPaperTexture(ctx, w, h) {
    return new Promise((resolve) => {
      const texture = new Image();
      texture.crossOrigin = "anonymous";
      texture.onload = () => {
        ctx.save();
        ctx.globalAlpha = 0.25; // texture visibility
        ctx.globalCompositeOperation = "multiply";
        ctx.drawImage(texture, 0, 0, w, h);
        ctx.restore();
        resolve();
      };
      texture.src = "/paper_texture.png"; // from public/
    });
  }

  return (
    <div className="preview">
      {loading && <p>Creating pencil sketch...</p>}
      <canvas ref={canvasRef}></canvas>
      {!loading && (
        <button
          className="download-btn"
          onClick={() => {
            const link = document.createElement("a");
            link.download = "pencil_sketch.png";
            link.href = canvasRef.current.toDataURL("image/png");
            link.click();
          }}
        >
          Download Sketch
        </button>
      )}
    </div>
  );
}
