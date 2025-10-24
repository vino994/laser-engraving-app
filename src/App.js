import React, { useState } from "react";
import ImageUploader from "./components/ImageUploader";
import EngraveCanvas from "./components/EngraveCanvas";

export default function App() {
  const [imageSrc, setImageSrc] = useState(null);
  const [material, setMaterial] = useState("glass"); // "glass" or "wood"
  const [showMockup, setShowMockup] = useState(true);
  const [title, setTitle] = useState("To My Beloved");
  const [subtitle, setSubtitle] = useState("Happy Anniversary");

  return (
    <div className="app">
      <h1>Laser Engraving Preview</h1>
      <p className="muted">Vembu Laser Engraving Preview</p>

      <div className="controls">
        <ImageUploader onUpload={setImageSrc} />
        <div className="material-select">
          <label><input type="radio" name="mat" checked={material==="glass"} onChange={()=>setMaterial("glass")} /> Glass</label>
          <label><input type="radio" name="mat" checked={material==="wood"} onChange={()=>setMaterial("wood")} /> Wood</label>
        </div>
        <label className="checkbox">
          <input type="checkbox" checked={showMockup} onChange={e=>setShowMockup(e.target.checked)} /> Show mockup
        </label>
      </div>

      {material === "glass" && showMockup && (
        <div className="text-controls">
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Top text (optional)" />
          <input value={subtitle} onChange={e=>setSubtitle(e.target.value)} placeholder="Bottom text (optional)" />
        </div>
      )}

      <div className="output">
        {!imageSrc ? <div className="placeholder">No image uploaded</div> :
          <EngraveCanvas
            imageSrc={imageSrc}
            material={material}
            mockup={showMockup}
            title={title}
            subtitle={subtitle}
          />
        }
      </div>

      <footer className="footer">Export: Custom design to order from J Studio</footer>
    </div>
  );
}
