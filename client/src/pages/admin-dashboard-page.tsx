import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AdminSidebar } from "@/components/admin-sidebar";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  
  // Fetch admin stats
  const { data: stats, isLoading: isLoadingStats } = useQuery<{
    totalUsers: number;
    pendingClaims: number;
    totalRewards: number;
  }>({
    queryKey: ["/api/admin/stats"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/stats");
      const data = await res.json();
      console.log("Fetched admin stats:", data); // Debugging log
      return data;
    },
  });

  // Fetch pending claims
  const { data: pendingClaims, isLoading: isLoadingPendingClaims } = useQuery<any[]>({
    queryKey: ["/api/admin/pending-rewards"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/pending-rewards");
      const data = await res.json();
      console.log("Fetched pending claims:", data); // Debugging log
      return data;
    },
  });

  // Fetch activity logs
  const { data: logs, isLoading: isLoadingLogs } = useQuery<any[]>({
    queryKey: ["/api/admin/logs"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/logs");
      const data = await res.json();
      console.log("Fetched activity logs:", data); // Debugging log
      return data;
    },
  });
  
  // Update reward status mutation
  const updateRewardStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/user-rewards/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-rewards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
  
      toast({
        title: `Claim ${actionType === "approve" ? "approved" : "rejected"} successfully`,
        description: "The reward claim status has been updated.",
      });
  
      setActionType(null);
      setSelectedClaimId(null);
      setIsAlertDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to update claim status",
        description: error.message,
        variant: "destructive",
      });
    },
  });  
  
  const handleAction = (type: "approve" | "reject", claimId: string) => {
    setActionType(type);
    setSelectedClaimId(claimId);
    setIsAlertDialogOpen(true);
  };
  
  const handleConfirmAction = () => {
    if (!selectedClaimId || !actionType) return;
  
    updateRewardStatusMutation.mutate({
      id: selectedClaimId,
      status: actionType === "approve" ? "approved" : "rejected",
    });
  };  

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case "CLAIM":
        return "bg-blue-100 text-blue-800";
      case "UPDATE":
        return "bg-green-100 text-green-800";
      case "LOGIN":
        return "bg-purple-100 text-purple-800";
      case "LOGOUT":
        return "bg-orange-100 text-orange-800";
      case "REGISTER":
        return "bg-indigo-100 text-indigo-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar */}
      <AdminSidebar />
      
      {/* Main Content */}
      <div className="flex-1 md:ml-64 p-4">
        <div className="max-w-7xl mx-auto">
          {/* Admin Dashboard Header */}
          <div className="mb-8 bg-white rounded-xl shadow-md p-6">
            <div className="md:flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-neutral-800">Admin Dashboard</h1>
                <p className="text-neutral-600 mt-1">Manage reward claims and system operations</p>
              </div>
              
              {isLoadingStats ? (
                <div className="mt-4 md:mt-0 flex md:flex-row flex-col gap-4">
                  <div className="bg-neutral-100 rounded-lg p-4 text-center min-w-32 animate-pulse">
                    <div className="h-4 bg-neutral-200 rounded w-3/4 mx-auto mb-2"></div>
                    <div className="h-8 bg-neutral-200 rounded w-1/2 mx-auto"></div>
                  </div>
                  <div className="bg-neutral-100 rounded-lg p-4 text-center min-w-32 animate-pulse">
                    <div className="h-4 bg-neutral-200 rounded w-3/4 mx-auto mb-2"></div>
                    <div className="h-8 bg-neutral-200 rounded w-1/2 mx-auto"></div>
                  </div>
                  <div className="bg-neutral-100 rounded-lg p-4 text-center min-w-32 animate-pulse">
                    <div className="h-4 bg-neutral-200 rounded w-3/4 mx-auto mb-2"></div>
                    <div className="h-8 bg-neutral-200 rounded w-1/2 mx-auto"></div>
                  </div>
                </div>
              ) : (
                <div className="mt-4 md:mt-0 flex md:flex-row flex-col gap-4">
                  {/* <div className="bg-neutral-100 rounded-lg p-4 text-center min-w-32">
                    <p className="text-neutral-600 text-sm">Total Users</p>
                    <p className="text-2xl font-bold text-neutral-800">{stats?.totalUsers || 0}</p>
                  </div> */}
                  
                  <div className="bg-neutral-100 rounded-lg p-4 text-center min-w-32">
                    <p className="text-neutral-600 text-sm">Pending Claims</p>
                    <p className="text-2xl font-bold text-amber-600">{stats?.pendingClaims || 0}</p>
                  </div>
                  
                  <div className="bg-neutral-100 rounded-lg p-4 text-center min-w-32">
                    <p className="text-neutral-600 text-sm">Total Rewards</p>
                    <p className="text-2xl font-bold text-neutral-800">{stats?.totalRewards || 0}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Pending Claims Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-neutral-800">Pending Reward Claims</h2>
            </div>
            
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                {isLoadingPendingClaims ? (
                  <div className="p-8 flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : pendingClaims && pendingClaims.length > 0 ? (
                  <table className="min-w-full divide-y divide-neutral-200">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">User</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Reward</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Points</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Date Claimed</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-neutral-200">
                      {pendingClaims.map((claim) => (
                        <tr key={claim.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-neutral-300 flex items-center justify-center">
                                <span className="text-sm font-medium text-neutral-800">
                                  {claim.user?.fullname?.[0] || "?"}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-neutral-900">{claim.user?.fullname}</div>
                                <div className="text-sm text-neutral-500">{claim.user?.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-neutral-900">{claim.reward?.title}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-neutral-900">{claim.reward?.points}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-neutral-500">
                              {format(new Date(claim.createdAt), "MMM d, yyyy")}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(claim.status)}`}>
                              {claim.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <Button
                                size="sm"
                                variant="default"
                                className="bg-green-600 hover:bg-green-700"
                                disabled={updateRewardStatusMutation.isPending}
                                onClick={() => handleAction("approve", claim.id)}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={updateRewardStatusMutation.isPending}
                                onClick={() => handleAction("reject", claim.id)}
                              >
                                Reject
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center text-neutral-500">
                    No pending claims found
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Recent Activity */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-neutral-800 mb-6">Recent Activity Log</h2>
            
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                {isLoadingLogs ? (
                  <div className="p-8 flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : logs && logs.length > 0 ? (
                  <table className="min-w-full divide-y divide-neutral-200">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Time</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">User</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Action</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Code</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Description</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-neutral-200">
                      {logs.map((log) => (
                        <tr key={log.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-neutral-500">
                              {format(new Date(log.createdAt), "MMM d, yyyy HH:mm")}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-neutral-900">{log.user?.fullname}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getActionBadgeColor(log.action)}`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-neutral-500">{log.code}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap max-w-xs truncate">
                            <div className="text-sm text-neutral-600">{log.description}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center text-neutral-500">
                    No activity logs found
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Confirmation Dialog */}
      <AlertDialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "approve" ? "Approve Claim" : "Reject Claim"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "approve"
                ? "Are you sure you want to approve this reward claim? This action cannot be undone."
                : "Are you sure you want to reject this reward claim? This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updateRewardStatusMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              disabled={updateRewardStatusMutation.isPending}
              className={actionType === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {updateRewardStatusMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {actionType === "approve" ? "Approve" : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
