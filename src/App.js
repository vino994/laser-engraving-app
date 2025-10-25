import React, { useState } from "react";
import ImageUploader from "./components/ImageUploader";
import EngraveCanvas from "./components/EngraveCanvas";

export default function App() {
  const [imageSrc, setImageSrc] = useState(null);
  const [material, setMaterial] = useState("glass");
  const [depth, setDepth] = useState(70);

  return (
    <div className={`app-container ${material}`}>
      <header className="header">
        <h1>Laser Engraving Preview</h1>
        <p className="subtitle">by J Studio — Custom Design & Precision</p>
      </header>

      <div className="control-panel">
        <ImageUploader onUpload={setImageSrc} />

        <div className="material-select">
          <label className={material === "glass" ? "active" : ""}>
            <input
              type="radio"
              name="mat"
              checked={material === "glass"}
              onChange={() => setMaterial("glass")}
            />
            🧊 Glass
          </label>
          <label className={material === "wood" ? "active" : ""}>
            <input
              type="radio"
              name="mat"
              checked={material === "wood"}
              onChange={() => setMaterial("wood")}
            />
            🪵 Wood
          </label>
        </div>

        <div className="depth-control">
          <label>
            Engraving Depth: <b>{depth}%</b>
          </label>
          <input
            type="range"
            min="10"
            max="100"
            step="1"
            value={depth}
            onChange={(e) => setDepth(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="preview-wrapper">
        {!imageSrc ? (
          <div className="placeholder">Upload an image to begin engraving</div>
        ) : (
          <EngraveCanvas imageSrc={imageSrc} material={material} depth={depth} />
        )}
      </div>

      <footer className="footer">
        <p>Export: Custom design order from <strong>J Studio</strong></p>
      </footer>
    </div>
  );
}
