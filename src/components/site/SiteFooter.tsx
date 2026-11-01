import { Link } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { Logo } from "./Logo";
import { SITE, whatsappLink } from "@/lib/site";
import { SERVICES } from "@/lib/services";

export function SiteFooter() {
  return (
    <footer className="bg-ink text-ink-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo light />
          <p className="mt-4 max-w-sm text-sm text-ink-muted">
            Engineering projects, IT services, research support and assignments — done right, on time. Visit the shop or order online, pay with Mobile Money or card.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-bold uppercase tracking-widest text-accent">Services</h4>
          <ul className="mt-4 space-y-2 text-sm text-ink-muted">
            {SERVICES.map((s) => (
              <li key={s.key}>
                <Link to="/services/$slug" params={{ slug: s.slug }} className="hover:text-ink-foreground">{s.title}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-bold uppercase tracking-widest text-accent">Contact</h4>
          <ul className="mt-4 space-y-2 text-sm text-ink-muted">
            <li>{SITE.address}</li>
            <li>{SITE.phoneDisplay}</li>
            <li>{SITE.email}</li>
            <li>
              <a href={whatsappLink()} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 font-semibold text-ink-foreground hover:text-accent">
                <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ink-foreground/10 py-5 text-center text-xs text-ink-muted">
        © {new Date().getFullYear()} {SITE.name}. Payments secured by Paystack · MTN MoMo · Telecel Cash · AirtelTigo Money · Cards
      </div>
    </footer>
  );
}

export function WhatsAppFab() {
  return (
    <a
      href={whatsappLink()}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-success text-success-foreground shadow-lg transition-transform hover:scale-110 animate-float"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}
