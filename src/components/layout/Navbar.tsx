import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/profile", label: "My Bookings" },
  { to: "/admin", label: "Admin" },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const { user, logout, token } = useAuth();
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <nav className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary">
            <img src="favicon.ico" alt="" className="h-full w-full object-contain" />
          </span>
          <span className="font-semibold">TurfTrack</span>
        </Link>
        <div className="hidden gap-6 md:flex">
          {navLinks
            .filter((l) => l.to !== '/admin' || (user && user.role === 'admin'))
            .map((l) => (
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
          {!token ? (
            <>
              <Link to="/login"><Button variant="ghost">Log in</Button></Link>
              <Link to="/register"><Button variant="premium">Sign up</Button></Link>
            </>
          ) : (
            <>
              <span className="text-sm text-muted-foreground hidden sm:inline">{user?.name}</span>
              <Button variant="ghost" onClick={logout}>Log out</Button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
