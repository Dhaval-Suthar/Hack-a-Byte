"use client";

import React from "react";
import html2canvas from "html2canvas";

const DownloadButton = () => {
function handleDownload() {
    const certificate = document.getElementById("certificate");
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!certificate || !context) return;

    canvas.width = certificate.offsetWidth * 2;
    canvas.height = certificate.offsetHeight * 2;
    context.scale(2, 2);

    interface Html2CanvasOptions {
        backgroundColor: string;
        scale: number;
        useCORS: boolean;
        onclone: (document: Document) => void;
    }

    const options: Html2CanvasOptions = {
        backgroundColor: "transparent",
        scale: 2,
        useCORS: true, // Add this option to handle cross-origin issues
        onclone: (document: Document) => {
            const elements = document.querySelectorAll("h1.bg-clip-text");
            elements.forEach((element) => {
                (element as HTMLElement).className = "text-6xl font-black text-center tracking-wider mb-4 text-cyan-400";
            });
        },
    };

    html2canvas(certificate, options).then((canvas) => {
        const link = document.createElement("a");
        link.download = "certificate.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
    });
}

  return (
    <button
      onClick={handleDownload}
      className="fixed top-4 z-40 right-4 bg-cyan-500 text-white px-4 py-2 rounded shadow-lg hover:bg-cyan-600"
    >
      Download Certificate
    </button>
  );
};

export default DownloadButton;
