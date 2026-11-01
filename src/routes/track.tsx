import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, PackageSearch } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { pageMeta } from "@/lib/page-meta";

export const Route = createFileRoute("/track")({
  validateSearch: z.object({ service: z.string().optional() }),
  head: () => pageMeta("Track your order", "Check the progress of your Genius project and download completed work using your tracking ID."),
  component: TrackPage,
});
function TrackPage() { const [id, setId] = useState(""); const navigate = useNavigate(); return <div className="mx-auto max-w-xl px-4 py-16 text-center"><PackageSearch className="mx-auto h-12 w-12 text-primary" /><p className="mt-5 text-sm font-bold text-primary">Genius · Project progress</p><h1 className="mt-3 text-4xl font-extrabold">Track your order.</h1><p className="mt-4 text-muted-foreground">Every project has a story. Here’s where yours stands.</p><form className="mt-8 text-left" onSubmit={e => { e.preventDefault(); navigate({ to: "/order/$trackingId", params: { trackingId: id.trim().toUpperCase() } }); }}><Label htmlFor="tracking">Tracking ID</Label><Input id="tracking" required minLength={4} maxLength={20} value={id} onChange={e => setId(e.target.value)} placeholder="GEN-…" className="mt-2 h-12 font-mono" /><Button className="mt-4 w-full" size="lg"><Search /> Find order</Button></form></div>; }
