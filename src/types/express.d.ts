import "express";

declare module "express" {
  export interface Request {
    user?: {
      id: string;
      name: string;
      phoneNumber: string;
      email?: string | null;
    };
  }
}
