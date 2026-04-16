import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useDashboardStats(range: string) {
  return useQuery({
    queryKey: [api.dashboard.stats.path, range],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/stats?range=${range}`, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch dashboard stats");
      }

      const data = await res.json();
      return data;
    },
  });
}

export function useDashboardSellers(range: string) {
  return useQuery({
    queryKey: ["/api/dashboard/sellers", range],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/sellers?range=${range}`, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch sellers");
      }

      return res.json();
    },
  });
}
