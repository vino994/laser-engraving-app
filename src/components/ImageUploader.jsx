import React from "react";

export default function ImageUploader({ onUpload }) {
  const handle = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    onUpload(url);
  };
  return (
    <div className="uploader">
      <input type="file" accept="image/*" onChange={handle} />
    </div>
  );
}
