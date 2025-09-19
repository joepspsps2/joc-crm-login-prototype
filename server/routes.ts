import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import jwt from "jsonwebtoken";

// Extend Express Request type to include user property
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Middleware to verify Firebase JWT tokens
const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  try {
    // In a real implementation, you would verify the Firebase JWT token
    // For now, we'll decode it without verification for demonstration
    const decoded = jwt.decode(token) as any;
    
    // Firebase JWT tokens use 'user_id' field for UID, not 'uid'
    req.user = {
      ...decoded,
      uid: decoded?.user_id || decoded?.uid || decoded?.sub
    };
    next();
  } catch (error) {
    console.error('JWT decode error:', error);
    return res.sendStatus(403);
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  
  // User management endpoints
  app.post("/api/users", authenticateToken, async (req, res) => {
    try {
      const { firebaseUid, email, displayName, phoneNumber, providers } = req.body;
      
      const existingUser = await storage.getUserByFirebaseUid(firebaseUid);
      if (existingUser) {
        // Update existing user
        const updatedUser = await storage.updateUser(existingUser.unifiedId, {
          email,
          displayName,
          phoneNumber,
          providers,
        });
        return res.json({ user: updatedUser });
      }

      // Create new user with unified ID
      const newUser = await storage.createUser({
        unifiedId: `uid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email,
        displayName,
        phoneNumber,
        providers: providers || [],
      }, firebaseUid);

      res.json({ user: newUser });
    } catch (error) {
      console.error("Error creating/updating user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/users/stats", authenticateToken, async (req, res) => {
    try {
      console.log('Stats request for Firebase UID:', req.user?.uid);
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      console.log('User lookup for stats:', user ? 'Found' : 'Not found');
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const stats = await storage.getUserOrderStats(user.unifiedId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/users/orders/recent", authenticateToken, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const recentOrders = await storage.getUserRecentOrders(user.unifiedId, 5);
      res.json(recentOrders);
    } catch (error) {
      console.error("Error fetching recent orders:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/users/orders/completed", authenticateToken, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const completedOrders = await storage.getUserCompletedOrders(user.unifiedId);
      res.json(completedOrders);
    } catch (error) {
      console.error("Error fetching completed orders:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put("/api/users/profile", authenticateToken, async (req, res) => {
    try {
      const { displayName, phoneNumber } = req.body;
      console.log('Profile update request:', {
        firebaseUid: req.user?.uid,
        userObject: req.user,
        displayName,
        phoneNumber
      });
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      console.log('User lookup result:', user ? 'Found user with ID: ' + user.unifiedId : 'User not found');
      
      if (!user) {
        console.log('User not found for Firebase UID:', req.user.uid);
        return res.status(404).json({ error: "User not found" });
      }

      const updatedUser = await storage.updateUser(user.unifiedId, {
        displayName,
        phoneNumber,
      });

      res.json({ user: updatedUser });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/users/linked-providers", authenticateToken, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const providers = (user.providers || []).map((providerId: string) => {
        const providerMap: Record<string, { name: string; icon: string }> = {
          'google.com': { name: 'Google', icon: 'fab fa-google' },
          'apple.com': { name: 'Apple ID', icon: 'fab fa-apple' },
          'facebook.com': { name: 'Facebook', icon: 'fab fa-facebook' },
          'oidc.line': { name: 'LINE', icon: 'fab fa-line' },
        };
        
        return {
          providerId,
          name: providerMap[providerId]?.name || providerId,
          icon: providerMap[providerId]?.icon || 'fas fa-user',
          email: providerId === 'google.com' ? user.email : undefined,
        };
      });

      res.json(providers);
    } catch (error) {
      console.error("Error fetching linked providers:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Order management endpoints
  app.get("/api/orders/:orderId/files", authenticateToken, async (req, res) => {
    try {
      const { orderId } = req.params;
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const order = await storage.getOrder(orderId);
      if (!order || order.unifiedUserId !== user.unifiedId) {
        return res.status(404).json({ error: "Order not found" });
      }

      res.json(order.files || []);
    } catch (error) {
      console.error("Error fetching order files:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // File download endpoints
  app.get("/api/files/:path(*)", authenticateToken, async (req, res) => {
    try {
      const filePath = req.params.path;
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Verify user has access to this file
      const hasAccess = await storage.verifyFileAccess(user.unifiedId, filePath);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      // In a real implementation, this would stream from Firebase Storage
      // For now, we'll return a placeholder response
      res.json({ message: "File download endpoint - implement with Firebase Storage" });
    } catch (error) {
      console.error("Error downloading file:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/orders/:orderId/files/download-all", authenticateToken, async (req, res) => {
    try {
      const { orderId } = req.params;
      const user = await storage.getUserByFirebaseUid(req.user.uid);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const order = await storage.getOrder(orderId);
      if (!order || order.unifiedUserId !== user.unifiedId) {
        return res.status(404).json({ error: "Order not found" });
      }

      // In a real implementation, this would create a zip file from Firebase Storage
      res.json({ message: "Download all endpoint - implement with Firebase Storage zip creation" });
    } catch (error) {
      console.error("Error creating download archive:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // POS/Order integration webhook
  app.post("/api/webhooks/order", async (req, res) => {
    try {
      const { orderId, unifiedUserId, description, files } = req.body;
      
      const order = await storage.createOrder({
        orderId,
        unifiedUserId,
        description,
        status: "completed",
        files: files || [],
      });

      // Log activity
      await storage.createActivityLog({
        unifiedUserId,
        action: "order_created",
        details: { orderId, description },
      });

      res.json({ order });
    } catch (error) {
      console.error("Error processing order webhook:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
