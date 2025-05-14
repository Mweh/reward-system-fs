import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "../db/storage";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // API routes
  // Get all rewards
  app.get("/api/rewards", async (req, res) => {
    try {
      const rewards = await storage.getRewards();
      res.json(rewards);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch rewards" });
    }
  });

  // Get a specific reward
  app.get("/api/rewards/:id", async (req, res) => {
    try {
      const reward = await storage.getReward(req.params.id);
      if (!reward) {
        return res.status(404).json({ message: "Reward not found" });
      }
      res.json(reward);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reward" });
    }
  });

  // Get user rewards history for authenticated user
  app.get("/api/user-rewards", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const userId = req.user!.id;
      const userRewards = await storage.getUserRewards(userId);

      // Enrich with reward details
      const enrichedUserRewards = await Promise.all(
        userRewards.map(async (userReward) => {
          const reward = await storage.getReward(userReward.rewardId);
          return {
            ...userReward,
            reward,
          };
        })
      );

      res.json(enrichedUserRewards);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user rewards" });
    }
  });

  // Get all users rewards (admin only)
  app.get("/api/admin/user-rewards", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    // Check if user is admin
    if (!req.user!.data?.isAdmin) {
      return res
        .status(403)
        .json({ message: "Forbidden - Admin access required" });
    }

    try {
      const userRewards = await storage.getAllUserRewards();

      // Enrich with user and reward details
      const enrichedUserRewards = await Promise.all(
        userRewards.map(async (userReward) => {
          const user = await storage.getUser(userReward.userId);
          const reward = await storage.getReward(userReward.rewardId);
          return {
            ...userReward,
            user,
            reward,
          };
        })
      );

      res.json(enrichedUserRewards);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch all user rewards" });
    }
  });

  // Get pending rewards (admin only)
  app.get("/api/admin/pending-rewards", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    // Check if user is admin
    if (!req.user!.data?.isAdmin) {
      return res
        .status(403)
        .json({ message: "Forbidden - Admin access required" });
    }

    try {
      const pendingRewards = await storage.getPendingUserRewards();

      // Enrich with user and reward details
      const enrichedPendingRewards = await Promise.all(
        pendingRewards.map(async (userReward) => {
          const user = await storage.getUser(userReward.userId);
          const reward = await storage.getReward(userReward.rewardId);
          return {
            ...userReward,
            user,
            reward,
          };
        })
      );

      res.json(enrichedPendingRewards);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending rewards" });
    }
  });

  // Claim a reward
  app.post("/api/claim-reward", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const claimSchema = z.object({
      rewardId: z.string().min(1, "Reward ID is required"),
    });

    try {
      const { rewardId } = claimSchema.parse(req.body);

      // Get the user and reward
      const userId = req.user!.id;
      const user = await storage.getUser(userId);
      const reward = await storage.getReward(rewardId);

      if (!user || !reward) {
        return res.status(404).json({ message: "User or reward not found" });
      }

      // Check if user has enough points
      if (!user.data || user.data.points < reward.points) {
        return res
          .status(400)
          .json({ message: "Not enough points to claim this reward" });
      }

      // Create user-reward entry
      const userReward = await storage.createUserReward({
        userId,
        rewardId,
        status: "pending",
        data: { claimedAt: new Date() },
      });

      // Deduct points from user
      const updatedUser = await storage.updateUser(userId, {
        data: {
          ...user.data,
          points: user.data.points - reward.points,
        },
      });

      // Create log entry
      await storage.createLog({
        userId,
        code: "RWD_CLM",
        action: "CLAIM",
        description: `User ${user.fullname} claimed ${reward.title}`,
        data: { userId, rewardId, userRewardId: userReward.id },
      });

      res.status(201).json({
        message: "Reward claimed successfully",
        userReward,
        user: updatedUser,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to claim reward" });
    }
  });

  // Update reward status (admin only)
  app.patch("/api/admin/user-rewards/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    // Check if user is admin
    if (!req.user!.data?.isAdmin) {
      return res
        .status(403)
        .json({ message: "Forbidden - Admin access required" });
    }

    const statusSchema = z.object({
      status: z.enum(["pending", "approved", "rejected", "completed"]),
    });

    try {
      const { status } = statusSchema.parse(req.body);
      const userRewardId = req.params.id;

      // Get the user-reward entry
      const userReward = await storage.getUserReward(userRewardId);
      if (!userReward) {
        return res.status(404).json({ message: "User reward not found" });
      }

      // Update status
      const updatedUserReward = await storage.updateUserReward(userRewardId, {
        status,
      });

      // Get user and reward for log entry
      const user = await storage.getUser(userReward.userId);
      const reward = await storage.getReward(userReward.rewardId);

      // Create log entry
      await storage.createLog({
        userId: req.user!.id,
        code: "RWD_UPD",
        action: "UPDATE",
        description: `Admin updated status to ${status} for ${user?.fullname}'s claim of ${reward?.title}`,
        data: {
          adminId: req.user!.id,
          userId: userReward.userId,
          rewardId: userReward.rewardId,
          userRewardId,
          status,
        },
      });

      res.json({
        message: "Reward status updated successfully",
        userReward: updatedUserReward,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to update reward status" });
    }
  });

  // Get activity logs (admin only)
  app.get("/api/admin/logs", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    // Check if user is admin
    if (!req.user!.data?.isAdmin) {
      return res
        .status(403)
        .json({ message: "Forbidden - Admin access required" });
    }

    try {
      const logs = await storage.getLogs();

      // Enrich with user details
      const enrichedLogs = await Promise.all(
        logs.map(async (log) => {
          const user = await storage.getUser(log.userId);
          return {
            ...log,
            user,
          };
        })
      );

      // Sort by creation date, newest first
      enrichedLogs.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      res.json(enrichedLogs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch logs" });
    }
  });

  // Get admin dashboard stats
  app.get("/api/admin/stats", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    // Check if user is admin
    if (!req.user!.data?.isAdmin) {
      return res
        .status(403)
        .json({ message: "Forbidden - Admin access required" });
    }

    try {
      const users = Array.from(await storage.getAllUserRewards());
      const pendingClaims = users.filter(
        (reward) => reward.status === "pending"
      );
      const rewards = await storage.getRewards();

      const stats = {
        totalUsers: users.length,
        pendingClaims: pendingClaims.length,
        totalRewards: rewards.length,
      };

      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
