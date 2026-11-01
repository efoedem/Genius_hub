import { queryOptions } from "@tanstack/react-query";
import { getPricing, myOrders, amIAdmin, adminListOrders } from "./api.functions";
export const pricingQuery = queryOptions({ queryKey: ["pricing"], queryFn: () => getPricing(), staleTime: 60000 });
export const accountQuery = queryOptions({ queryKey: ["my-orders"], queryFn: () => myOrders() });
export const roleQuery = queryOptions({ queryKey: ["my-role"], queryFn: () => amIAdmin() });
export const adminQuery = queryOptions({ queryKey: ["admin-orders"], queryFn: () => adminListOrders(), refetchInterval: 30000 });