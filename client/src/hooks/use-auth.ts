import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

export function useAuth() {
  const [, setLocation] = useLocation();

  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const isAuthenticated = !!user;

  const requireAuth = () => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/login");
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    requireAuth,
  };
}
