"use client";

import React, { useEffect } from "react";

const loads = ["|", "/", "-", "\\", "|", "/", "-", "\\"];

export default function Loader() {
  const [loading, setLoading] = React.useState(0);

  useEffect(() => {
    setInterval(() => {
      setLoading((loading + 1) % loads.length);
    }, 300);
  }, [loading]);

  return <li className="w-full"> {loads[loading]} Processing...</li>;
}
