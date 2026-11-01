import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut, ArrowRight, Package, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { accountQuery, roleQuery } from "@/lib/queries";
import { pageMeta } from "@/lib/page-meta";
import { formatGHS } from "@/lib/pricing";
import { serviceByKey } from "@/lib/services";
import { supabase } from "@/integrations/supabase/client";
export const Route = createFileRoute("/_authenticated/account")({
 head: () => pageMeta("My orders", "View your Genius orders, deadlines, payments and completed work."),
 loader: async ({ context }) => { await Promise.all([context.queryClient.ensureQueryData(accountQuery), context.queryClient.ensureQueryData(roleQuery)]); },
 component: AccountPage,
});
function AccountPage() {
 const { data: orders } = useSuspenseQuery(accountQuery); const { data: role } = useSuspenseQuery(roleQuery);
 const client = useQueryClient(); const navigate = useNavigate();
 async function signOut() { await client.cancelQueries(); client.clear(); await supabase.auth.signOut(); await navigate({ to: "/auth", replace: true }); }
 return <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6"><div className="flex flex-wrap items-center justify-between gap-5"><div><p className="text-sm font-bold text-primary">Genius · Your account</p><h1 className="mt-2 text-4xl font-extrabold">My orders</h1></div><div className="flex gap-2">{role.admin && <Button asChild variant="outline"><Link to="/admin"><Settings /> Admin</Link></Button>}<Button variant="outline" onClick={signOut}><LogOut /> Sign out</Button></div></div>
 <div className="mt-10 grid gap-4">{!orders.length && <div className="py-16 text-center"><Package className="mx-auto h-12 w-12 text-primary" /><h2 className="mt-4 text-2xl font-bold">No orders yet</h2><Button asChild className="mt-6"><Link to="/quote">Get an Instant Quote <ArrowRight /></Link></Button></div>}{orders.map(o => <Link key={o.tracking_id} to="/order/$trackingId" params={{ trackingId: o.tracking_id }} className="grid gap-4 rounded-lg border bg-card p-5 transition-colors hover:border-primary sm:grid-cols-[1fr_auto_auto]"><div><p className="font-mono text-sm font-bold text-primary">{o.tracking_id}</p><h2 className="mt-2 text-xl font-bold">{serviceByKey(o.service_key)?.title}</h2><p className="mt-2 text-sm text-muted-foreground">Due {new Date(o.deadline).toLocaleString()}</p></div><div className="self-center"><span className="rounded-md bg-secondary px-3 py-1 text-sm font-semibold capitalize">{o.status.replace('_',' ')}</span><p className="mt-3 text-sm capitalize text-muted-foreground">Payment: {o.payment_status}</p></div><div className="flex items-center gap-5"><strong>{formatGHS(o.amount)}</strong><ArrowRight className="h-5 w-5" /></div></Link>)}</div></div>;
}
