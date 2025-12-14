import { 
  type User, type InsertUser,
  type ContactMessage, type InsertContactMessage,
  type NewsletterSubscription, type InsertNewsletter,
  type CustomerReview, type InsertReview,
  users, contactMessages, newsletterSubscriptions, customerReviews
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Contact Messages
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;
  getContactMessages(): Promise<ContactMessage[]>;
  
  // Newsletter
  createNewsletterSubscription(subscription: InsertNewsletter): Promise<NewsletterSubscription>;
  getNewsletterSubscriptions(): Promise<NewsletterSubscription[]>;
  checkEmailSubscribed(email: string): Promise<boolean>;
  
  // Reviews
  createReview(review: InsertReview): Promise<CustomerReview>;
  getApprovedReviews(): Promise<CustomerReview[]>;
  getAllReviews(): Promise<CustomerReview[]>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Contact Messages
  async createContactMessage(message: InsertContactMessage): Promise<ContactMessage> {
    const [result] = await db.insert(contactMessages).values(message).returning();
    return result;
  }

  async getContactMessages(): Promise<ContactMessage[]> {
    return db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
  }

  // Newsletter
  async createNewsletterSubscription(subscription: InsertNewsletter): Promise<NewsletterSubscription> {
    const [result] = await db.insert(newsletterSubscriptions).values(subscription).returning();
    return result;
  }

  async getNewsletterSubscriptions(): Promise<NewsletterSubscription[]> {
    return db.select().from(newsletterSubscriptions).orderBy(desc(newsletterSubscriptions.createdAt));
  }

  async checkEmailSubscribed(email: string): Promise<boolean> {
    const [existing] = await db.select().from(newsletterSubscriptions).where(eq(newsletterSubscriptions.email, email));
    return !!existing;
  }

  // Reviews
  async createReview(review: InsertReview): Promise<CustomerReview> {
    const [result] = await db.insert(customerReviews).values(review).returning();
    return result;
  }

  async getApprovedReviews(): Promise<CustomerReview[]> {
    return db.select().from(customerReviews)
      .where(eq(customerReviews.isApproved, true))
      .orderBy(desc(customerReviews.createdAt));
  }

  async getAllReviews(): Promise<CustomerReview[]> {
    return db.select().from(customerReviews).orderBy(desc(customerReviews.createdAt));
  }
}

export const storage = new DatabaseStorage();
