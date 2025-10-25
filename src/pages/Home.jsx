import React, { useState } from "react";
import FileUploader from "../components/FileUploader";
import CanvasPreview from "../components/CanvasPreview";
import CompositePreview from "../components/CompositePreview";
import { processSketch } from "../components/SketchProcessor";
import { generateGlassBackground } from "../components/GlassBackground";

export default function Home() {
  const [originalImage, setOriginalImage] = useState(null);
  const [sketchImage, setSketchImage] = useState(null);
  const [glassImage, setGlassImage] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleImageUpload = async (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setOriginalImage(url);
    setProcessing(true);

    try {
      const sketch = await processSketch(url);
      setSketchImage(sketch);

      const glass = await generateGlassBackground(sketch.width, sketch.height);
      setGlassImage(glass);
    } catch (err) {
      console.error(err);
      alert("Error processing image");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="app">
      <h1>Custom Design in J Studio</h1>
      <FileUploader onUpload={handleImageUpload} processing={processing} />

      <div className="preview-grid">
        <CanvasPreview title="Original Image" image={originalImage} />
        <CanvasPreview title="Pencil Sketch" image={sketchImage} />
        <CanvasPreview title="Glass Background" image={glassImage} />
        <CompositePreview sketch={sketchImage} bg={glassImage} />
      </div>
    </div>
  );
}
