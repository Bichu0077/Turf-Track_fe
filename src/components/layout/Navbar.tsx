import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/profile", label: "My Bookings" },
  { to: "/admin", label: "Admin" },
];

export default function Navbar() {
  const { pathname } = useLocation();
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <nav className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="inline-block h-6 w-6 rounded-md bg-primary"></span>
          <span className="font-semibold">TMS</span>
        </Link>
        <div className="hidden gap-6 md:flex">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={cn(
                "text-sm transition-colors hover:text-primary",
                pathname === l.to ? "text-primary" : "text-muted-foreground"
              )}
            >
              {l.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Link to="/login"><Button variant="ghost">Log in</Button></Link>
          <Link to="/register"><Button variant="premium">Sign up</Button></Link>
        </div>
      </nav>
    </header>
  );
}
