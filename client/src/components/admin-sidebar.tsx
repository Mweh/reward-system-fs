import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Gift,
  Users,
  Settings,
  LogOut,
} from "lucide-react";

export function AdminSidebar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  return (
    <div className="bg-white shadow-md md:w-64 md:fixed md:h-full z-10">
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-neutral-200">
          <h1 className="text-2xl font-bold text-primary">RewardHub</h1>
          <p className="text-sm text-neutral-500">Admin Panel</p>
        </div>
        
        <nav className="flex md:flex-col flex-row justify-around md:justify-start py-2 md:py-6 overflow-y-auto flex-1">
          <Link href="/admin">
            <a className={`flex items-center px-4 py-3 ${
              location === "/admin" 
                ? "text-primary font-medium bg-blue-50 border-l-4 border-primary" 
                : "text-neutral-700 hover:bg-neutral-100"
              } md:mb-2`}
            >
              <LayoutDashboard className="h-5 w-5 md:mr-3" />
              <span className="hidden md:inline">Dashboard</span>
            </a>
          </Link>
          {/* <Link href="/admin/rewards">
            <a className={`flex items-center px-4 py-3 ${
              location === "/admin/rewards" 
                ? "text-primary font-medium bg-blue-50 border-l-4 border-primary" 
                : "text-neutral-700 hover:bg-neutral-100"
              } md:mb-2`}
            >
              <Gift className="h-5 w-5 md:mr-3" />
              <span className="hidden md:inline">Manage Rewards</span>
            </a>
          </Link> */}
          {/* <Link href="/admin/users">
            <a className={`flex items-center px-4 py-3 ${
              location === "/admin/users" 
                ? "text-primary font-medium bg-blue-50 border-l-4 border-primary" 
                : "text-neutral-700 hover:bg-neutral-100"
              } md:mb-2`}
            >
              <Users className="h-5 w-5 md:mr-3" />
              <span className="hidden md:inline">Users</span>
            </a>
          </Link> */}
          {/* <Link href="/admin/settings">
            <a className={`flex items-center px-4 py-3 ${
              location === "/admin/settings" 
                ? "text-primary font-medium bg-blue-50 border-l-4 border-primary" 
                : "text-neutral-700 hover:bg-neutral-100"
              } md:mb-2`}
            >
              <Settings className="h-5 w-5 md:mr-3" />
              <span className="hidden md:inline">Settings</span>
            </a>
          </Link> */}
        </nav>
        
        <div className="p-4 border-t border-neutral-200 md:mb-8">
          <div className="hidden md:block mb-4">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center mr-2">
                <span>{user?.fullname?.[0] || "A"}</span>
              </div>
              <div>
                <p className="font-medium text-sm">{user?.fullname}</p>
                <p className="text-xs text-neutral-500">{user?.email}</p>
              </div>
            </div>
          </div>
          <button 
            onClick={() => logoutMutation.mutate()}
            className="w-full flex items-center justify-center md:justify-start px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded-md"
            disabled={logoutMutation.isPending}
          >
            {logoutMutation.isPending ? (
              <div className="animate-spin h-5 w-5 md:mr-2"></div>
            ) : (
              <LogOut className="h-5 w-5 md:mr-2" />
            )}
            <span className="hidden md:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
