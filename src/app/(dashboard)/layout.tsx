import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-full min-h-screen">
            <MobileNav />
            <Sidebar />
            <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
                <div className="p-4 sm:p-6 lg:p-10 lg:pl-0 max-w-8xl mx-auto w-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
