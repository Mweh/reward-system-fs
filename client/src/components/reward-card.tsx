import { Button } from "@/components/ui/button";
import { Reward } from "@shared/schema";
import { Coins } from "lucide-react";

interface RewardCardProps {
  reward: Reward;
  onClaim: () => void;
  disabled?: boolean;
}

export function RewardCard({ reward, onClaim, disabled }: RewardCardProps) {
  // Get image URL from reward data or use a default
  const imageUrl = reward.data?.imageUrl || "https://images.unsplash.com/photo-1523287562758-66c7fc58967f";
  
  return (
    <div className="bg-white rounded-xl shadow-md p-6 transition-all duration-300 hover:translate-y-[-4px] hover:shadow-lg">
      <div className="h-48 mb-4 rounded-lg bg-neutral-100 flex items-center justify-center overflow-hidden">
        <img 
          src={imageUrl} 
          alt={reward.title} 
          className="w-full h-full object-cover" 
        />
      </div>
      <h3 className="text-lg font-bold text-neutral-800 mb-2">{reward.title}</h3>
      
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <Coins className="h-4 w-4 text-amber-500 mr-1" />
          <span className="font-bold text-neutral-800">{reward.points}</span>
          <span className="text-neutral-600 ml-1">points</span>
        </div>
      </div>
      
      {reward.data?.description && (
        <p className="text-sm text-neutral-600 mb-4">{reward.data.description}</p>
      )}
      
      <Button 
        className="w-full"
        onClick={onClaim}
        disabled={disabled}
      >
        {disabled ? "Not Enough Points" : "Claim Reward"}
      </Button>
    </div>
  );
}
