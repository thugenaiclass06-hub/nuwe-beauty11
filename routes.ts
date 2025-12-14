import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContactMessageSchema, insertNewsletterSchema, insertReviewSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { sendContactNotification } from "./resend";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Contact Form - 聯絡表單
  app.post("/api/contact", async (req, res) => {
    try {
      const data = insertContactMessageSchema.parse(req.body);
      const message = await storage.createContactMessage(data);
      
      // Send email notification
      await sendContactNotification(data);
      
      res.status(201).json({ success: true, message: "訊息已成功送出！我們會盡快與您聯繫。" });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ success: false, message: validationError.message });
      } else {
        console.error("Contact form error:", error);
        res.status(500).json({ success: false, message: "系統錯誤，請稍後再試。" });
      }
    }
  });

  // Newsletter Subscription - 電子報訂閱
  app.post("/api/newsletter", async (req, res) => {
    try {
      const data = insertNewsletterSchema.parse(req.body);
      
      // Check if email already subscribed
      const isSubscribed = await storage.checkEmailSubscribed(data.email);
      if (isSubscribed) {
        res.status(400).json({ success: false, message: "此 Email 已經訂閱過囉！" });
        return;
      }
      
      await storage.createNewsletterSubscription(data);
      res.status(201).json({ success: true, message: "訂閱成功！感謝您加入 NUWE 家族。" });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ success: false, message: validationError.message });
      } else {
        console.error("Newsletter subscription error:", error);
        res.status(500).json({ success: false, message: "系統錯誤，請稍後再試。" });
      }
    }
  });

  // Customer Reviews - 顧客評價
  app.post("/api/reviews", async (req, res) => {
    try {
      const data = insertReviewSchema.parse(req.body);
      await storage.createReview(data);
      res.status(201).json({ success: true, message: "感謝您的評價！審核通過後將會顯示在網站上。" });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ success: false, message: validationError.message });
      } else {
        console.error("Review submission error:", error);
        res.status(500).json({ success: false, message: "系統錯誤，請稍後再試。" });
      }
    }
  });

  // Get approved reviews - 取得已審核的評價
  app.get("/api/reviews", async (req, res) => {
    try {
      const reviews = await storage.getApprovedReviews();
      res.json(reviews);
    } catch (error) {
      console.error("Get reviews error:", error);
      res.status(500).json({ success: false, message: "系統錯誤，請稍後再試。" });
    }
  });

  return httpServer;
}
