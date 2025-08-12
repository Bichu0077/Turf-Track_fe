import { Helmet } from "react-helmet-async";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { turfs } from "@/data/mockTurfs";
import { Button } from "@/components/ui/button";

export default function TurfManagementPage() {
  return (
    <main className="flex">
      <AdminSidebar />
      <section className="container py-8">
        <Helmet>
          <title>Manage Turfs</title>
          <meta name="description" content="Create, edit and delete turfs." />
          <link rel="canonical" href="/admin/turfs" />
        </Helmet>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Turfs</h1>
          <Button variant="hero">Add Turf</Button>
        </div>
        <div className="overflow-x-auto rounded-xl border">
          <table className="min-w-full text-sm">
            <thead className="bg-secondary">
              <tr>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Location</th>
                <th className="p-3 text-left">Price/hr</th>
                <th className="p-3 text-left">Amenities</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {turfs.map((t) => (
                <tr key={t.id} className="border-t">
                  <td className="p-3">{t.name}</td>
                  <td className="p-3">{t.location}</td>
                  <td className="p-3">₹{t.pricePerHour}</td>
                  <td className="p-3">{t.amenities.join(', ')}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Button variant="secondary">Edit</Button>
                      <Button variant="destructive">Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
