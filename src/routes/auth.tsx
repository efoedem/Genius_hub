import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { pageMeta } from "@/lib/page-meta";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, ArrowRight, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({ service: z.string().optional() }),
  head: () => pageMeta("Sign in", "Sign in or create your Genius account to view orders and completed projects."),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [name, setName] = useState("");
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [message, setMessage] = useState("");
  const { user } = useAuth(); const navigate = useNavigate();
  useEffect(() => { if (user) navigate({ to: "/account", replace: true }); }, [user, navigate]);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      if (mode === "reset") { const r = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` }); if (r.error) throw r.error; setMessage("Check your email for a password reset link."); }
      else if (mode === "signup") { const r = await supabase.auth.signUp({ email, password, options: { data: { full_name: name }, emailRedirectTo: `${window.location.origin}/auth` } }); if (r.error) throw r.error; if (!r.data.session) setMessage("Check your email to confirm your account, then sign in."); }
      else { const r = await supabase.auth.signInWithPassword({ email, password }); if (r.error) throw r.error; await navigate({ to: "/account" }); }
    } catch (e) { setError(e instanceof Error ? e.message : "Sign in failed. Please try again."); } finally { setBusy(false); }
  }
  async function social(provider: "google" | "lovable") { setBusy(true); setError(""); try { const r = await lovable.auth.signInWithOAuth(provider, { redirect_uri: `${window.location.origin}/auth` }); if (r.error) setError("Sign in could not finish. Please try again."); } catch { setError("Sign in could not start."); } finally { setBusy(false); } }
  return <div className="mx-auto max-w-md px-4 py-14"><p className="text-sm font-bold text-primary">Genius · Client portal</p><h1 className="mt-3 text-4xl font-extrabold">{mode === "signup" ? "Create your account" : mode === "reset" ? "Reset password" : "Welcome back."}</h1><p className="mt-4 text-muted-foreground">Your projects, payments and finished work.</p>
    <div className="mt-8 space-y-3"><Button variant="outline" className="w-full" disabled={busy} onClick={() => social("google")}>Continue with Google</Button><Button variant="outline" className="w-full" disabled={busy} onClick={() => social("lovable")}>Sign in with Lovable</Button></div>
    <div className="my-6 flex items-center gap-4 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or with email<span className="h-px flex-1 bg-border" /></div>
    <form onSubmit={submit} className="space-y-5">{mode === "signup" && <div><Label htmlFor="auth-name">Full name</Label><Input id="auth-name" className="mt-2" required value={name} onChange={e => setName(e.target.value)} autoComplete="name" /></div>}<div><Label htmlFor="auth-email">Email</Label><Input id="auth-email" className="mt-2" type="email" required value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" /></div>{mode !== "reset" && <div><Label htmlFor="auth-password">Password</Label><Input id="auth-password" className="mt-2" type="password" minLength={8} required value={password} onChange={e => setPassword(e.target.value)} autoComplete={mode === "signup" ? "new-password" : "current-password"} /></div>}{error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}{message && <p role="status" className="rounded-lg bg-success/10 p-3 text-sm text-success">{message}</p>}<Button size="lg" className="w-full" disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <ArrowRight />}{mode === "signup" ? "Create account" : mode === "reset" ? "Send reset link" : "Sign in"}</Button></form>
    <div className="mt-4 flex flex-wrap justify-center gap-2"><Button variant="link" onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setError(""); setMessage(""); }}>{mode === "signup" ? "Already have an account? Sign in" : "Create an account"}</Button>{mode === "login" && <Button variant="link" onClick={() => setMode("reset")}>Forgot password?</Button>}{mode === "reset" && <Button variant="link" onClick={() => setMode("login")}>Back to sign in</Button>}</div><p className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4" /> Secure account access</p>
  </div>;
}
