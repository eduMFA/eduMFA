import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/auth/AuthProvider";

/**
 * The hotkeys of the legacy main controller while a session is active:
 * Alt+E enrolls a token, Alt+L opens the token list, Alt+Q logs out.
 */
export function useMainHotkeys(): void {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }

      const key = event.key.toLowerCase();

      if (key === "e") {
        event.preventDefault();
        void navigate("/token/enroll");
      } else if (key === "l") {
        event.preventDefault();
        void navigate("/token/list");
      } else if (key === "q") {
        event.preventDefault();
        logout();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAuthenticated, logout, navigate]);
}
