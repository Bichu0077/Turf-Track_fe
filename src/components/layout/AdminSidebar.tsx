import { NavLink } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Shield } from "lucide-react";

const links = [
  { to: "/admin", label: "Dashboard" },
  { to: "/admin/turfs", label: "Turfs" },
  { to: "/admin/bookings", label: "Bookings" },
];

export default function AdminSidebar() {
  const { user } = useAuth();
  
  return (
    <aside className="w-64 border-r bg-sidebar text-sidebar-foreground hidden md:block">
      <div className="p-4 font-semibold">Admin Panel</div>
      <nav className="flex flex-col gap-1 p-2">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              `rounded-md px-3 py-2 text-sm ${
                isActive ? "bg-sidebar-accent" : "hover:bg-sidebar-accent"
              }`
            }
          >
            {l.label}
          </NavLink>
        ))}
        
        {/* Super Admin Link - Only visible to superadmin users */}
        {user?.role === 'superadmin' && (
          <div className="mt-4 pt-4 border-t border-sidebar-border">
            <div className="px-3 py-1 text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider">
              Super Admin
            </div>
            <NavLink
              to="/superadmin"
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm flex items-center gap-2 text-red-500 ${
                  isActive ? "bg-sidebar-accent" : "hover:bg-sidebar-accent"
                }`
              }
            >
              <Shield className="h-4 w-4" />
              Super Admin Dashboard
            </NavLink>
          </div>
        )}
      </nav>
    </aside>
  );
}
