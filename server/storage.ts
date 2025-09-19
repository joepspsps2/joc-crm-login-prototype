import { type User, type InsertUser, type Order, type InsertOrder, type ActivityLog, type InsertActivityLog } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  createUser(user: InsertUser, firebaseUid: string): Promise<User>;
  updateUser(unifiedId: string, updates: Partial<InsertUser>): Promise<User>;
  getUserOrderStats(unifiedId: string): Promise<{ total: number; pending: number }>;
  getUserRecentOrders(unifiedId: string, limit: number): Promise<Order[]>;
  getUserCompletedOrders(unifiedId: string): Promise<Order[]>;
  
  // Order management
  createOrder(order: InsertOrder): Promise<Order>;
  getOrder(id: string): Promise<Order | undefined>;
  verifyFileAccess(unifiedId: string, filePath: string): Promise<boolean>;
  
  // Activity logging
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private usersByFirebaseUid: Map<string, User>;
  private orders: Map<string, Order>;
  private activityLogs: Map<string, ActivityLog>;

  constructor() {
    this.users = new Map();
    this.usersByFirebaseUid = new Map();
    this.orders = new Map();
    this.activityLogs = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    return this.usersByFirebaseUid.get(firebaseUid);
  }

  async createUser(insertUser: InsertUser, firebaseUid: string): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      email: insertUser.email || null,
      displayName: insertUser.displayName || null,
      phoneNumber: insertUser.phoneNumber || null,
      providers: (insertUser.providers as string[]) || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.users.set(id, user);
    // Store mapping by Firebase UID for easy lookup
    this.usersByFirebaseUid.set(firebaseUid, user);
    
    return user;
  }

  async updateUser(unifiedId: string, updates: Partial<InsertUser>): Promise<User> {
    const existingUser = Array.from(this.usersByFirebaseUid.values())
      .find(user => user.unifiedId === unifiedId);
    if (!existingUser) {
      throw new Error("User not found");
    }
    
    // Find the Firebase UID for this user
    let firebaseUid: string | null = null;
    this.usersByFirebaseUid.forEach((user, uid) => {
      if (user.unifiedId === unifiedId && !firebaseUid) {
        firebaseUid = uid;
      }
    });

    const updatedUser: User = {
      ...existingUser,
      ...updates,
      email: updates.email !== undefined ? updates.email : existingUser.email,
      displayName: updates.displayName !== undefined ? updates.displayName : existingUser.displayName,
      phoneNumber: updates.phoneNumber !== undefined ? updates.phoneNumber : existingUser.phoneNumber,
      providers: updates.providers ? (updates.providers as string[]) : existingUser.providers,
      updatedAt: new Date(),
    };

    this.users.set(existingUser.id, updatedUser);
    if (firebaseUid) {
      this.usersByFirebaseUid.set(firebaseUid, updatedUser);
    }
    
    return updatedUser;
  }

  async getUserOrderStats(unifiedId: string): Promise<{ total: number; pending: number }> {
    const userOrders = Array.from(this.orders.values())
      .filter(order => order.unifiedUserId === unifiedId);
    
    return {
      total: userOrders.length,
      pending: userOrders.filter(order => order.status === 'pending').length,
    };
  }

  async getUserRecentOrders(unifiedId: string, limit: number): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter(order => order.unifiedUserId === unifiedId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, limit);
  }

  async getUserCompletedOrders(unifiedId: string): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter(order => order.unifiedUserId === unifiedId && order.status === 'completed')
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = randomUUID();
    const order: Order = {
      ...insertOrder,
      id,
      status: insertOrder.status || null,
      description: insertOrder.description || null,
      files: (insertOrder.files as { path: string; name: string; size: number }[]) || null,
      createdAt: new Date(),
      completedAt: insertOrder.status === 'completed' ? new Date() : null,
    };
    
    this.orders.set(id, order);
    return order;
  }

  async getOrder(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async verifyFileAccess(unifiedId: string, filePath: string): Promise<boolean> {
    // Check if the user has access to this file path
    // This would typically check against orders and file associations
    const userOrders = Array.from(this.orders.values())
      .filter(order => order.unifiedUserId === unifiedId);
    
    for (const order of userOrders) {
      const files = order.files as Array<{ path: string; name: string; size: number }> || [];
      if (files.some(file => file.path === filePath)) {
        return true;
      }
    }
    
    return false;
  }

  async createActivityLog(insertLog: InsertActivityLog): Promise<ActivityLog> {
    const id = randomUUID();
    const log: ActivityLog = {
      ...insertLog,
      id,
      provider: insertLog.provider || null,
      details: insertLog.details || null,
      createdAt: new Date(),
    };
    
    this.activityLogs.set(id, log);
    return log;
  }
}

export const storage = new MemStorage();
