import { 
  users, rewards, usersRewards, logs,
  type User, type InsertUser,
  type Reward, type InsertReward,
  type UserReward, type InsertUserReward,
  type Log, type InsertLog,
  type UserData
} from "@shared/schema";
import { v4 as uuidv4 } from 'uuid';
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { eq } from "drizzle-orm";
import { db, pool } from "./db";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
  
  // Reward methods
  getReward(id: string): Promise<Reward | undefined>;
  getRewards(): Promise<Reward[]>;
  createReward(reward: InsertReward): Promise<Reward>;
  
  // User-Reward methods
  getUserReward(id: string): Promise<UserReward | undefined>;
  getUserRewards(userId: string): Promise<UserReward[]>;
  getAllUserRewards(): Promise<UserReward[]>;
  getPendingUserRewards(): Promise<UserReward[]>;
  createUserReward(userReward: InsertUserReward): Promise<UserReward>;
  updateUserReward(id: string, data: Partial<UserReward>): Promise<UserReward | undefined>;
  
  // Log methods
  createLog(log: InsertLog): Promise<Log>;
  getLogs(): Promise<Log[]>;
  
  // Session store
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private rewards: Map<string, Reward>;
  private userRewards: Map<string, UserReward>;
  private logs: Map<string, Log>;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.rewards = new Map();
    this.userRewards = new Map();
    this.logs = new Map();
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // Prune expired entries every 24h
    });
    
    // Add some initial rewards for testing
    this.addInitialRewards();
  }

  private addInitialRewards() {
    const rewardsList = [
      {
        id: uuidv4(),
        title: "1 Day Extra Leave",
        points: 1000,
        data: { description: "Get an extra day of leave", imageUrl: "https://images.unsplash.com/photo-1569012871812-f38ee64cd54c" },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        title: "$50 Amazon Voucher",
        points: 500,
        data: { description: "Gift card for online shopping", imageUrl: "https://images.unsplash.com/photo-1523287562758-66c7fc58967f" },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        title: "Team Lunch (Up to $200)",
        points: 2000,
        data: { description: "Treat your team to lunch", imageUrl: "https://pixabay.com/get/gf82c36239b87b97ebc4e99bd41b7cd556ec2b3994fe66bf01b6da830194e99d2588ae45e774015d6cbc23b29c409c0adcc89c0f824c98faf3c62a404bd4400e9_1280.jpg" },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    rewardsList.forEach(reward => {
      this.rewards.set(reward.id, reward);
    });
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = uuidv4();
    const userData: UserData = {
      isAdmin: insertUser.email.includes('admin'),
      points: 2450, // Starting points for new users
    };
    
    const user: User = { 
      ...insertUser,
      id,
      active: true,
      data: userData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = {
      ...user,
      ...data,
      updatedAt: new Date()
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Reward methods
  async getReward(id: string): Promise<Reward | undefined> {
    return this.rewards.get(id);
  }
  
  async getRewards(): Promise<Reward[]> {
    return Array.from(this.rewards.values());
  }
  
  async createReward(insertReward: InsertReward): Promise<Reward> {
    const id = uuidv4();
    const reward: Reward = {
      ...insertReward,
      id,
      data: {
        description: typeof insertReward.data?.description === "string" ? insertReward.data.description : "",
        imageUrl: typeof insertReward.data?.imageUrl === "string" ? insertReward.data.imageUrl : "",
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  
    this.rewards.set(id, reward);
    return reward;
  }
  
  // User-Reward methods
  async getUserReward(id: string): Promise<UserReward | undefined> {
    return this.userRewards.get(id);
  }
  
  async getUserRewards(userId: string): Promise<UserReward[]> {
    return Array.from(this.userRewards.values()).filter(
      (userReward) => userReward.userId === userId
    );
  }
  
  async getAllUserRewards(): Promise<UserReward[]> {
    return Array.from(this.userRewards.values());
  }
  
  async getPendingUserRewards(): Promise<UserReward[]> {
    return Array.from(this.userRewards.values()).filter(
      (userReward) => userReward.status === 'pending'
    );
  }
  
  async createUserReward(insertUserReward: InsertUserReward): Promise<UserReward> {
    const id = uuidv4();
    const userReward: UserReward = {
      ...insertUserReward,
      id,
      data: insertUserReward.data || {},
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.userRewards.set(id, userReward);
    return userReward;
  }
  
  async updateUserReward(id: string, data: Partial<UserReward>): Promise<UserReward | undefined> {
    const userReward = await this.getUserReward(id);
    if (!userReward) return undefined;
    
    const updatedUserReward = {
      ...userReward,
      ...data,
      updatedAt: new Date()
    };
    
    this.userRewards.set(id, updatedUserReward);
    return updatedUserReward;
  }
  
  // Log methods
  async createLog(insertLog: InsertLog): Promise<Log> {
    const id = uuidv4();
    const log: Log = {
      ...insertLog,
      id,
      data: insertLog.data || {},
      description: insertLog.description || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.logs.set(id, log);
    return log;
  }
  
  async getLogs(): Promise<Log[]> {
    return Array.from(this.logs.values());
  }
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      conObject: {
        connectionString: process.env.DATABASE_URL,
      },
      createTableIfMissing: true
    });
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    try {
      // Use raw query with proper case sensitivity
      const sql = `SELECT * FROM users WHERE id = $1 LIMIT 1`;
      const result = await pool.query(sql, [id]);
      console.log('getUser results:', result.rows);
      return result.rows[0] as User | undefined;
    } catch (error) {
      console.error('Error in getUser:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      // Use raw query with proper case sensitivity
      const sql = `SELECT * FROM users WHERE username = $1 LIMIT 1`;
      const result = await pool.query(sql, [username]);
      return result.rows[0] as User | undefined;
    } catch (error) {
      console.error('Error in getUserByUsername:', error);
      return undefined;
    }
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      // Use raw query with proper case sensitivity
      const sql = `SELECT * FROM users WHERE email = $1 LIMIT 1`;
      const result = await pool.query(sql, [email]);
      return result.rows[0] as User | undefined;
    } catch (error) {
      console.error('Error in getUserByEmail:', error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = uuidv4();
    
    // Check if the email contains 'admin' to determine role
    const isAdmin = insertUser.email.includes('admin');
    
    console.log('Creating user with email:', insertUser.email, 'isAdmin:', isAdmin);
    
    const userData: UserData = {
      isAdmin: isAdmin,
      points: 2450, // Starting points for new users
    };
    
    const user: User = { 
      ...insertUser,
      id,
      active: true,
      data: userData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    try {
      // Insert user into database - using explicit column names with quotes to handle case sensitivity
      const sql = `
        INSERT INTO users (
          id, fullname, username, email, "phoneNumber", password, active, 
          data, "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
        ) RETURNING *
      `;
      
      const result = await pool.query(sql, [
        user.id,
        user.fullname,
        user.username,
        user.email,
        user.phoneNumber,
        user.password,
        user.active,
        JSON.stringify(user.data),
        user.createdAt,
        user.updatedAt
      ]);
      
      console.log('User created successfully:', result.rows[0]);
      return user;
    } catch (error) {
      console.error('Failed to create user in database:', error);
      throw error;
    }
  }
  
  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = {
      ...user,
      ...data,
      updatedAt: new Date()
    };
    
    await db.update(users).set(updatedUser).where(eq(users.id, id));
    return updatedUser;
  }
  
  // Reward methods
  async getReward(id: string): Promise<Reward | undefined> {
    const result = await db.select().from(rewards).where(eq(rewards.id, id)).limit(1);
    return result[0];
  }
  
  async getRewards(): Promise<Reward[]> {
    return await db.select().from(rewards);
  }
  
  async createReward(insertReward: InsertReward): Promise<Reward> {
    const id = uuidv4();
    const reward: Reward = {
      ...insertReward,
      id,
      data: insertReward.data || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.insert(rewards).values(reward);
    return reward;
  }
  
  // User-Reward methods
  async getUserReward(id: string): Promise<UserReward | undefined> {
    const result = await db.select().from(usersRewards).where(eq(usersRewards.id, id)).limit(1);
    return result[0];
  }
  
  async getUserRewards(userId: string): Promise<UserReward[]> {
    return await db.select().from(usersRewards).where(eq(usersRewards.userId, userId));
  }
  
  async getAllUserRewards(): Promise<UserReward[]> {
    return await db.select().from(usersRewards);
  }
  
  async getPendingUserRewards(): Promise<UserReward[]> {
    return await db.select().from(usersRewards).where(eq(usersRewards.status, 'pending'));
  }
  
  async createUserReward(insertUserReward: InsertUserReward): Promise<UserReward> {
    const id = uuidv4();
    const userReward: UserReward = {
      ...insertUserReward,
      id,
      data: insertUserReward.data || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.insert(usersRewards).values(userReward);
    return userReward;
  }
  
  async updateUserReward(id: string, data: Partial<UserReward>): Promise<UserReward | undefined> {
    const userReward = await this.getUserReward(id);
    if (!userReward) return undefined;
    
    const updatedUserReward = {
      ...userReward,
      ...data,
      updatedAt: new Date()
    };
    
    await db.update(usersRewards).set(updatedUserReward).where(eq(usersRewards.id, id));
    return updatedUserReward;
  }
  
  // Log methods
  async createLog(insertLog: InsertLog): Promise<Log> {
    const id = uuidv4();
    const log: Log = {
      ...insertLog,
      id,
      description: insertLog.description || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.insert(logs).values(log);
    return log;
  }
  
  async getLogs(): Promise<Log[]> {
    return await db.select().from(logs);
  }

  // Add initial rewards if none exist
  async addInitialRewardsIfNecessary() {
    const existingRewards = await this.getRewards();
    
    if (existingRewards.length === 0) {
      const rewardsList = [
        {
          id: uuidv4(),
          title: "1 Day Extra Leave",
          points: 1000,
          data: { description: "Get an extra day of leave", imageUrl: "https://images.unsplash.com/photo-1569012871812-f38ee64cd54c" },
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: uuidv4(),
          title: "$50 Amazon Voucher",
          points: 500,
          data: { description: "Gift card for online shopping", imageUrl: "https://images.unsplash.com/photo-1523287562758-66c7fc58967f" },
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: uuidv4(),
          title: "Team Lunch (Up to $200)",
          points: 2000,
          data: { description: "Treat your team to lunch", imageUrl: "https://pixabay.com/get/gf82c36239b87b97ebc4e99bd41b7cd556ec2b3994fe66bf01b6da830194e99d2588ae45e774015d6cbc23b29c409c0adcc89c0f824c98faf3c62a404bd4400e9_1280.jpg" },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      for (const reward of rewardsList) {
        await db.insert(rewards).values({
          id: reward.id,
          title: reward.title,
          points: reward.points,
          data: reward.data,
          createdAt: reward.createdAt,
          updatedAt: reward.updatedAt
        });
      }
    }
  }
}

// Use database storage for production
export const storage = new DatabaseStorage();

// Initialize rewards on startup
(async () => {
  try {
    await (storage as DatabaseStorage).addInitialRewardsIfNecessary();
    console.log('Initial rewards added if necessary');
  } catch (error) {
    console.error('Error adding initial rewards:', error);
  }
})();
