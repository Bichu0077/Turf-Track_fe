import { NavLink } from "react-router-dom";

const links = [
  { to: "/admin", label: "Dashboard" },
  { to: "/admin/turfs", label: "Turfs" },
  { to: "/admin/bookings", label: "Bookings" },
];

export default function AdminSidebar() {
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
      </nav>
    </aside>
  );
}
