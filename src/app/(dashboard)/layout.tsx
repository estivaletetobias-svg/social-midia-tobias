import { Sidebar } from "@/components/Sidebar";
import { BottomTabBar } from "@/components/BottomTabBar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-full min-h-screen overflow-x-hidden">
            {/* Desktop Sidebar - hidden on mobile */}
            <Sidebar />
            {/* Native mobile bottom tab bar */}
            <BottomTabBar />
            <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
                {/* 
                  - Mobile: p-4 top + extra bottom padding (pb-24) to clear the tab bar
                  - Desktop: original lg:p-10 lg:pl-0, no extra bottom pad 
                */}
                <div className="p-4 pb-28 sm:p-6 sm:pb-28 lg:p-10 lg:pl-0 lg:pb-10 max-w-8xl mx-auto w-full overflow-x-hidden">
                    {children}
                </div>
            </main>
        </div>
    );
}
