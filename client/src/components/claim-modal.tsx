import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Reward } from "@shared/schema";
import { Loader2, X, Coins } from "lucide-react";

interface ClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  reward: Reward;
  currentPoints: number;
  onConfirm: () => void;
  isPending: boolean;
}

export function ClaimModal({ 
  isOpen, 
  onClose, 
  reward, 
  currentPoints, 
  onConfirm,
  isPending
}: ClaimModalProps) {
  // Get image URL from reward data or use a default
  const imageUrl = reward.data?.imageUrl || "https://images.unsplash.com/photo-1523287562758-66c7fc58967f";
  
  // Calculate remaining points after claim
  const remainingPoints = currentPoints - reward.points;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Reward Claim</DialogTitle>
          <DialogDescription>
            Are you sure you want to claim this reward?
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4 p-4 bg-neutral-100 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-12 w-12 bg-neutral-200 rounded-lg overflow-hidden">
              <img 
                src={imageUrl} 
                alt={reward.title} 
                className="h-full w-full object-cover" 
              />
            </div>
            <div className="ml-4">
              <h4 className="text-md font-bold text-neutral-800">{reward.title}</h4>
              <div className="flex items-center mt-1">
                <Coins className="h-4 w-4 text-amber-500 mr-1" />
                <span className="font-bold text-neutral-800">{reward.points}</span>
                <span className="text-neutral-600 ml-1">points</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-neutral-100 rounded-lg">
          <p className="text-sm text-neutral-600">Your points after this transaction:</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-neutral-800">Current Points:</span>
            <span className="font-bold text-neutral-800">{currentPoints}</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-neutral-800">Points to Deduct:</span>
            <span className="font-bold text-red-600">-{reward.points}</span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-200">
            <span className="text-neutral-800">Remaining Points:</span>
            <span className="font-bold text-neutral-800">{remainingPoints}</span>
          </div>
        </div>
        
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Confirm Claim"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
