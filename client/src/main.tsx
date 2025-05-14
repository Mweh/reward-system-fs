import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import App from "./App";
import "./index.css";
import { AuthProvider } from "@/hooks/use-auth";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="light">
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);
