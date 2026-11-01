import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { pageMeta } from "@/lib/page-meta";
export const Route = createFileRoute("/reset-password")({ head: () => pageMeta("New password", "Set a new password for your Genius account."), component: ResetPage });
function ResetPage() { const [password, setPassword] = useState(""); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false); const navigate = useNavigate(); return <form className="mx-auto max-w-md space-y-5 px-4 py-16" onSubmit={async e => { e.preventDefault(); setBusy(true); const { error } = await supabase.auth.updateUser({ password }); setBusy(false); if (error) setMessage("Open a valid reset link from your email and try again."); else navigate({ to: "/account" }); }}><h1 className="text-3xl font-bold">Set a new password</h1><Label htmlFor="new-password">New password</Label><Input id="new-password" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} />{message && <p role="alert" className="text-destructive">{message}</p>}<Button disabled={busy}>{busy ? "Saving…" : "Save password"}</Button></form>; }