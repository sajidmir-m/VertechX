import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { getQueryFn } from "@/lib/queryClient";

export function useAuth() {
  const [, setLocation] = useLocation();

  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
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
