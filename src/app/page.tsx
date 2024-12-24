"use client";

import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    // Redirect to aiverse.wtf when the component mounts
    window.location.href = 'https://aiverse.wtf';
  }, []);

  return null; // No content is rendered, just the redirect
}
