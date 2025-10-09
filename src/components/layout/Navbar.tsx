import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/bookings", label: "My Bookings", requireAuth: true },
  { to: "/admin", label: "Admin" },
  { to: "/superadmin", label: "Super Admin" },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout, token } = useAuth();

  const handleNavClick = (link: typeof navLinks[0], e: React.MouseEvent) => {
    // If link requires auth and user is not logged in, redirect to login
    if (link.requireAuth && !token) {
      e.preventDefault();
      navigate('/login');
      return;
    }
  };

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
            .filter((l) => {
              // Show home to everyone
              if (l.to === '/') return true;
              // Show bookings to everyone (will redirect to login if not authenticated)
              if (l.to === '/bookings') return true;
              // Show admin panel only to turf owners and superadmin
              if (l.to === '/admin') return user && (user.role === 'admin' || user.role === 'superadmin');
              // Show super admin panel only to superadmin
              if (l.to === '/superadmin') return user && user.role === 'superadmin';
              return false;
            })
            .map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={(e) => handleNavClick(l, e)}
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
              <Link to="/profile" className="flex items-center">
                <Avatar>
                  <AvatarImage src={user?.avatar || user?.profile_pic} alt={user?.name} />
                  <AvatarFallback>{user?.name?.[0]}</AvatarFallback>
                </Avatar>
              </Link>
              <Button variant="ghost" onClick={logout}>Log out</Button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
