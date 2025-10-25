import React, { useEffect, useRef, useState } from "react";
import { canvasRGBA } from "stackblur-canvas";

export default function EngraveCanvas({ imageSrc, material = "glass", depth = 70 }) {
  const previewRef = useRef();
  const [loading, setLoading] = useState(false);

useEffect(() => {
  if (!imageSrc) return;
  setLoading(true);

  const timeout = setTimeout(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => process(img);
    img.onerror = () => setLoading(false);
    img.src = imageSrc;
  }, 200); // delay small updates

  return () => clearTimeout(timeout);
}, [imageSrc, material, depth]);


  async function process(img) {
    const MAX = 1200;
    let w = img.width, h = img.height;
    const scale = Math.min(1, MAX / Math.max(w, h));
    w = Math.round(w * scale);
    h = Math.round(h * scale);

    const tmp = document.createElement("canvas");
    tmp.width = w;
    tmp.height = h;
    const tctx = tmp.getContext("2d", { willReadFrequently: true });
    tctx.drawImage(img, 0, 0, w, h);

    const base = tctx.getImageData(0, 0, w, h);
    toGray(base);
    const inverted = new ImageData(new Uint8ClampedArray(base.data), w, h);
    invert(inverted);

    const blurCanvas = document.createElement("canvas");
    blurCanvas.width = w;
    blurCanvas.height = h;
    const bctx = blurCanvas.getContext("2d");
    bctx.putImageData(inverted, 0, 0);
    canvasRGBA(blurCanvas, 0, 0, w, h, 12);
    const blurred = bctx.getImageData(0, 0, w, h);

    const sketch = colorDodge(base, blurred);
    enhanceContrast(sketch);

    const engr = document.createElement("canvas");
    engr.width = w;
    engr.height = h;
    engr.getContext("2d").putImageData(sketch, 0, 0);

    const canvas = previewRef.current;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");

    if (material === "wood") await renderWood(ctx, engr, w, h);
    else await renderGlass(ctx, engr, w, h);

    setLoading(false);
  }

  // --- MATERIAL EFFECTS ---
async function renderWood(ctx, engr, w, h) {
  const wood = new Image();
  wood.crossOrigin = "anonymous";
  wood.src = "/wood_texture.jpg";
  await new Promise((r) => {
    wood.onload = r;
    wood.onerror = r;
  });

  // Draw wood background
  ctx.drawImage(wood, 0, 0, w, h);

  // Engraving intensity from slider
  const depthFactor = depth / 100;

  const ectx = engr.getContext("2d");
  const ed = ectx.getImageData(0, 0, w, h).data;
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = w;
  tempCanvas.height = h;
  const tctx = tempCanvas.getContext("2d");
  const burnImg = tctx.createImageData(w, h);
  const bd = burnImg.data;

  for (let i = 0; i < ed.length; i += 4) {
    const brightness = ed[i];
    const burnDepth = Math.pow((255 - brightness) / 255, 1.5 + depthFactor);
    const alpha = burnDepth * 255 * depthFactor;

    bd[i] = 80 - 50 * burnDepth;
    bd[i + 1] = 50 - 30 * burnDepth;
    bd[i + 2] = 20 - 10 * burnDepth;
    bd[i + 3] = alpha;
  }

  tctx.putImageData(burnImg, 0, 0);

  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.drawImage(tempCanvas, 0, 0);
  ctx.restore();

  // Add soft inner shadow
  ctx.save();
  ctx.globalAlpha = 0.25 * depthFactor;
  ctx.filter = "blur(1.5px)";
  ctx.drawImage(engr, 1, 1);
  ctx.restore();
}




 async function renderGlass(ctx, engr, w, h) {
  const glass = new Image();
  glass.crossOrigin = "anonymous";
  glass.src = "/glass_texture.jpeg";
  await new Promise((r) => {
    glass.onload = r;
    glass.onerror = r;
  });

  const depthFactor = depth / 100;

  // Base glass gradient
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "#eef3f8");
  grad.addColorStop(1, "#c9d2da");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.globalAlpha = 0.2;
  ctx.drawImage(glass, 0, 0, w, h);
  ctx.globalAlpha = 1;

  const ectx = engr.getContext("2d");
  const ed = ectx.getImageData(0, 0, w, h).data;
  const frost = ctx.createImageData(w, h);

  for (let i = 0; i < ed.length; i += 4) {
    const brightness = ed[i];
    const frostAlpha = Math.pow((255 - brightness) / 255, 1.5 + depthFactor);
    frost.data[i] = 255;
    frost.data[i + 1] = 255;
    frost.data[i + 2] = 255;
    frost.data[i + 3] = frostAlpha * 255 * depthFactor;
  }

  const frostCanvas = document.createElement("canvas");
  frostCanvas.width = w;
  frostCanvas.height = h;
  frostCanvas.getContext("2d").putImageData(frost, 0, 0);

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.filter = `blur(${2 + depthFactor * 2}px)`;
  ctx.globalAlpha = 0.6 + depthFactor * 0.3;
  ctx.drawImage(frostCanvas, 0, 0);
  ctx.filter = "none";
  ctx.drawImage(frostCanvas, 0, 0);
  ctx.restore();

  // Border reflection
  ctx.lineWidth = 8;
  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.shadowColor = "rgba(255,255,255,0.7)";
  ctx.shadowBlur = 20 * depthFactor;
  ctx.strokeRect(6, 6, w - 12, h - 12);
}


  // --- UTILITIES ---
  function toGray(img) {
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      d[i] = d[i + 1] = d[i + 2] = g;
    }
  }

  function invert(img) {
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      d[i] = 255 - d[i];
      d[i + 1] = 255 - d[i + 1];
      d[i + 2] = 255 - d[i + 2];
    }
  }

  function colorDodge(base, top) {
    const bd = base.data, td = top.data;
    for (let i = 0; i < bd.length; i += 4) {
      for (let c = 0; c < 3; c++) {
        const b = bd[i + c];
        const t = td[i + c];
        bd[i + c] = Math.min(255, (b * 255) / (255 - t + 1));
      }
    }
    return base;
  }

  function enhanceContrast(img) {
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = d[i];
      const n = v < 200 ? v * 0.5 : v * 1.1;
      d[i] = d[i + 1] = d[i + 2] = Math.min(255, n);
    }
  }

  return (
    <div style={{ textAlign: "center" }}>
      {loading && <p>Rendering engraving...</p>}
      <canvas
        ref={previewRef}
        style={{
          width: "100%",
          maxWidth: 820,
          borderRadius: 14,
          boxShadow:
            material === "glass"
              ? "0 15px 45px rgba(0,0,0,0.25)"
              : "0 12px 35px rgba(0,0,0,0.35)",
          background:
            material === "glass"
              ? "linear-gradient(180deg,#edf2f6,#cfd7de)"
              : "linear-gradient(180deg,#c5965a,#8b5e33)",
        }}
      />
    </div>
  );
}
