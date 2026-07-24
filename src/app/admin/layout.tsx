import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminSidebar from "./_components/AdminSidebar";
import AdminProviders from "./_components/AdminProviders";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    redirect("/login");
  }

  return (
    <AdminProviders>
      <div className="flex min-h-screen bg-base-100">
        <AdminSidebar />
        <main className="flex-1 min-h-screen overflow-x-hidden bg-base-100">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto mt-14 md:mt-0">
            {children}
          </div>
        </main>
      </div>
    </AdminProviders>
  );
}
