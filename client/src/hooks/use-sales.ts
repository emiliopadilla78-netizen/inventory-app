import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type SaleInput } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useSales() {
  return useQuery({
    queryKey: [api.sales.list.path],
    queryFn: async () => {
      const res = await fetch(api.sales.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch sales");
      const data = await res.json();
      return api.sales.list.responses[200].parse(data);
    },
  });
}

export function useSale(id: number) {
  return useQuery({
    queryKey: [api.sales.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.sales.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch sale");
      const data = await res.json();
      return api.sales.get.responses[200].parse(data);
    },
    enabled: !!id,
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (sale: SaleInput) => {
      const res = await fetch(api.sales.create.path, {
        method: api.sales.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sale),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Failed to process sale" }));
        throw new Error(err.message || "Failed to process sale");
      }
      return api.sales.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.sales.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.products.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.dashboard.stats.path] });
      toast({ title: "Sale completed successfully", variant: "default" });
    },
    onError: (err) => {
      toast({ title: "Error completing sale", description: err.message, variant: "destructive" });
    }
  });
}
