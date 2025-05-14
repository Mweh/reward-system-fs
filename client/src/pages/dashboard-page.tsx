import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Reward, UserReward } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { UserSidebar } from "@/components/user-sidebar";
import { RewardCard } from "@/components/reward-card";
import { ClaimModal } from "@/components/claim-modal";
import { ClaimHistoryTable } from "@/components/claim-history-table";

export default function DashboardPage() {
  const { user } = useAuth();
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  
  // Fetch rewards
const { data: rewards, isLoading: isLoadingRewards } = useQuery<Reward[]>({
  queryKey: ["/api/rewards"],
  queryFn: async () => {
    const res = await apiRequest("GET", "/api/rewards");
    const rawData = await res.json();

    // Transform the data to ensure it matches the expected structure
    const rewards = rawData.map((reward: any) => ({
      ...reward,
      data: {
        description: reward.data?.description || "",
        imageUrl: reward.data?.imageUrl || "",
      },
    })) as Reward[];

    console.log("Fetched rewards:", rewards); // Debugging log
    return rewards;
  },
});
  
  // Fetch user rewards history
const { data: userRewards, isLoading: isLoadingUserRewards } = useQuery<any[]>({
  queryKey: ["/api/user-rewards"],
  queryFn: async () => {
    const res = await apiRequest("GET", "/api/user-rewards");
    const data = await res.json();
    console.log("Fetched user rewards:", data); // Debugging log
    return data;
  },
});  
  // Claim reward mutation
  const claimRewardMutation = useMutation({
    mutationFn: async (rewardId: string) => {
      const res = await apiRequest("POST", "/api/claim-reward", { rewardId });
      return res.json();
    },
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user-rewards"] });
      
      // Close modal
      setIsClaimModalOpen(false);
      setSelectedReward(null);
    },
  });
  
  const handleClaimReward = (reward: Reward) => {
    setSelectedReward(reward);
    setIsClaimModalOpen(true);
  };
  
  const handleConfirmClaim = () => {
    if (selectedReward) {
      claimRewardMutation.mutate(selectedReward.id);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar */}
      <UserSidebar />
      
      {/* Main Content */}
      <div className="flex-1 md:ml-64 p-4">
        <div className="max-w-7xl mx-auto">
          {/* User Dashboard Header */}
          <div className="mb-8 bg-white rounded-xl shadow-md p-6">
            <div className="md:flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-neutral-800">
                  Hello, {user?.fullname}
                </h1>
                <p className="text-neutral-600 mt-1">Welcome back to your rewards dashboard</p>
              </div>
              
              <div className="mt-4 md:mt-0 flex md:items-center">
                <div className="bg-neutral-100 rounded-lg p-4 text-center md:flex md:items-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-amber-400 rounded-full mx-auto md:mx-0 md:mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="8" />
                      <path d="M12 2v2" />
                      <path d="M12 20v2" />
                      <path d="M20 12h2" />
                      <path d="M2 12h2" />
                    </svg>
                  </div>
                  <div className="mt-2 md:mt-0">
                    <p className="text-neutral-600 text-sm">Your Learning Points</p>
                    <p className="text-3xl font-bold text-neutral-800">
                      {user?.data?.points || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Available Rewards */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-neutral-800">Available Rewards</h2>
            </div>
            
            {isLoadingRewards ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-xl shadow-md p-6 h-80 animate-pulse">
                    <div className="h-48 mb-4 bg-neutral-200 rounded-lg"></div>
                    <div className="h-4 bg-neutral-200 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-neutral-200 rounded w-1/2 mb-6"></div>
                    <div className="h-10 bg-neutral-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rewards?.map((reward) => (
                  <RewardCard
                    key={reward.id}
                    reward={reward}
                    onClaim={() => handleClaimReward(reward)}
                    disabled={(user?.data?.points ?? 0) < reward.points}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Recent Claims */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-neutral-800 mb-6">Your Recent Claims</h2>
            
            <ClaimHistoryTable 
              claims={userRewards} 
              isLoading={isLoadingUserRewards} 
            />
          </div>
        </div>
      </div>
      
      {/* Claim Modal */}
      {selectedReward && (
        <ClaimModal
          isOpen={isClaimModalOpen}
          onClose={() => setIsClaimModalOpen(false)}
          reward={selectedReward}
          currentPoints={user?.data?.points || 0}
          onConfirm={handleConfirmClaim}
          isPending={claimRewardMutation.isPending}
        />
      )}
    </div>
  );
}
