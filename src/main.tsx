import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { MotionConfig } from "framer-motion";

import { ThemeProvider } from "@/providers/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import App from "@/App";

import "@/index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      {/* reducedMotion="user" makes every framer-motion animation honor the OS
          "reduce motion" setting automatically. */}
      <MotionConfig reducedMotion="user">
        <TooltipProvider delayDuration={200}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
          <Toaster position="top-right" />
        </TooltipProvider>
      </MotionConfig>
    </ThemeProvider>
  </React.StrictMode>,
);
