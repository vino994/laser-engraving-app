import React, { useEffect, useRef, useState } from "react";
import { canvasRGBA } from "stackblur-canvas";

/*
  🔮 GLASS UPGRADE:
  - Stronger white lines (crystal laser style)
  - Frosted surface texture
  - Inner lighting & reflection edge
  - Slight shadow for realism
*/

export default function EngraveCanvas({ imageSrc, material = "glass" }) {
  const previewRef = useRef();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!imageSrc) return;
    setLoading(true);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => process(img);
    img.onerror = () => setLoading(false);
    img.src = imageSrc;
  }, [imageSrc, material]);

  async function process(img) {
    const MAX = 1200;
    let w = img.width,
      h = img.height;
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
    canvasRGBA(blurCanvas, 0, 0, w, h, 14);
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

  // --- MATERIALS ---

  async function renderWood(ctx, engr, w, h) {
    const wood = new Image();
    wood.crossOrigin = "anonymous";
    wood.src = "/wood_texture.jpg";
    await new Promise((res) => {
      wood.onload = res;
      wood.onerror = res;
    });

    ctx.drawImage(wood, 0, 0, w, h);
    const ectx = engr.getContext("2d");
    const ed = ectx.getImageData(0, 0, w, h).data;

    const burn = ctx.createImageData(w, h);
    for (let i = 0; i < ed.length; i += 4) {
      const bright = ed[i];
      const depth = (255 - bright) / 255;
      burn.data[i] = 45;
      burn.data[i + 1] = 25;
      burn.data[i + 2] = 10;
      burn.data[i + 3] = depth * 255;
    }

    ctx.globalCompositeOperation = "multiply";
    ctx.putImageData(burn, 0, 0);
    ctx.globalCompositeOperation = "source-over";

    // soft shading
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;
  }

 async function renderGlass(ctx, engr, w, h) {
  const glass = new Image();
  glass.crossOrigin = "anonymous";
  glass.src = "/glass_texture.jpeg";
  await new Promise((res) => {
    glass.onload = res;
    glass.onerror = res;
  });

  // Base glass gradient — subtle blue-gray tone
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "#f0f4f8");
  grad.addColorStop(0.5, "#dbe2e9");
  grad.addColorStop(1, "#c6ced8");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Glass texture overlay
  ctx.globalAlpha = 0.25;
  ctx.drawImage(glass, 0, 0, w, h);
  ctx.globalAlpha = 1;

  // White engraving from sketch
  const ectx = engr.getContext("2d");
  const ed = ectx.getImageData(0, 0, w, h);
  const output = ctx.createImageData(w, h);
  const od = output.data;

  for (let i = 0; i < ed.data.length; i += 4) {
    const brightness = ed.data[i];
    const alpha = Math.pow((255 - brightness) / 255, 1.8);
    od[i] = 255;
    od[i + 1] = 255;
    od[i + 2] = 255;
    od[i + 3] = Math.min(255, alpha * 255);
  }

  const engrCanvas = document.createElement("canvas");
  engrCanvas.width = w;
  engrCanvas.height = h;
  engrCanvas.getContext("2d").putImageData(output, 0, 0);

  // Frost glow + main engraving
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = 0.3;
  ctx.filter = "blur(1.5px)";
  ctx.drawImage(engrCanvas, 0, 0);
  ctx.filter = "none";
  ctx.globalAlpha = 1;
  ctx.drawImage(engrCanvas, 0, 0);
  ctx.restore();

  // Inner depth (dark edges, bright center)
  const depthGrad = ctx.createRadialGradient(w / 2, h / 2, w * 0.15, w / 2, h / 2, w * 0.6);
  depthGrad.addColorStop(0, "rgba(255,255,255,0.15)");
  depthGrad.addColorStop(1, "rgba(0,0,0,0.2)");
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = depthGrad;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = "source-over";

  // 3D crystal border (glass edge)
  ctx.lineWidth = 20;
  const borderGrad = ctx.createLinearGradient(0, 0, w, h);
  borderGrad.addColorStop(0, "rgba(255,255,255,0.8)");
  borderGrad.addColorStop(0.5, "rgba(255,255,255,0.4)");
  borderGrad.addColorStop(1, "rgba(180,200,220,0.3)");
  ctx.strokeStyle = borderGrad;
  ctx.strokeRect(10, 10, w - 20, h - 20);

  // Soft drop shadow under glass
  ctx.save();
  ctx.globalCompositeOperation = "destination-over";
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 25;
  ctx.shadowOffsetY = 20;
  ctx.fillStyle = "#e8eef2";
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
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
      const n = v < 200 ? v * 0.7 : v * 1.2;
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
          borderRadius: 12,
          boxShadow:
            material === "glass"
              ? "0 15px 50px rgba(0,0,0,0.25)"
              : "0 8px 30px rgba(0,0,0,0.2)",
          background:
            material === "glass" ? "#e6ebf1" : "linear-gradient(#b77b44,#8a5a2f)",
        }}
      />
    </div>
  );
}
