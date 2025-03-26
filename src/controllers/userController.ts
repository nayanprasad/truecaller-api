import { NextFunction, Request, Response } from "express";
import { TryCatch } from "@/middlewares/error.js";
import ErrorHandler from "@/utils/errorHandler.js";
import prisma from "@/config/database.js";
import {
  addContactSchema,
  reportSpamSchema,
  updateContactSchema,
  updateProfileSchema,
} from "@/models/validators.js";
import { getSpamInfo } from "@/utils/spamUtils.js";
import {
  invalidateContactRelatedCache,
  invalidateSpamRelatedCache,
  invalidateUserRelatedCache,
} from "@/utils/cacheUtils.js";

// Get user profile
export const getProfile = TryCatch(async (req: Request, res: Response) => {
  const user = req.user!;

  res.status(200).json({
    success: true,
    data: {
      id: user.id,
      name: user.name,
      phoneNumber: user.phoneNumber,
      email: user.email,
    },
  });
});

// Update user profile
export const updateProfile = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    // Validate input
    const validation = updateProfileSchema.safeParse(req.body);
    if (!validation.success) {
      return next(new ErrorHandler(400, validation.error.errors[0].message));
    }

    const { name, email } = validation.data;

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        name: name !== undefined ? name : undefined,
        email: email !== undefined ? email : undefined,
      },
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        email: true,
      },
    });

    // Invalidate cache for this user
    await invalidateUserRelatedCache(req.user!.id, updatedUser.phoneNumber);

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  },
);

// Get all user contacts
export const getAllContacts = TryCatch(async (req: Request, res: Response) => {
  const contacts = await prisma.contact.findMany({
    where: { userId: req.user!.id },
    select: {
      id: true,
      name: true,
      phoneNumber: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { name: "asc" },
  });

  res.status(200).json({
    success: true,
    count: contacts.length,
    data: contacts,
  });
});

// Get paginated user contacts
export const getContacts = TryCatch(async (req: Request, res: Response) => {
  // Parse pagination parameters from query params
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  // Get total count for pagination metadata
  const totalCount = await prisma.contact.count({
    where: { userId: req.user!.id },
  });

  // Get paginated contacts
  const contacts = await prisma.contact.findMany({
    where: { userId: req.user!.id },
    select: {
      id: true,
      name: true,
      phoneNumber: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { name: "asc" },
    skip,
    take: limit,
  });

  // Calculate pagination metadata
  const totalPages = Math.ceil(totalCount / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  res.status(200).json({
    success: true,
    pagination: {
      totalCount,
      totalPages,
      currentPage: page,
      pageSize: limit,
      hasNextPage,
      hasPrevPage,
    },
    data: contacts,
  });
});

// Add a new contact
export const addContact = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    // Validate input
    const validation = addContactSchema.safeParse(req.body);
    if (!validation.success) {
      return next(new ErrorHandler(400, validation.error.errors[0].message));
    }

    const { name, phoneNumber } = validation.data;

    // Check if contact already exists
    const existingContact = await prisma.contact.findUnique({
      where: {
        userId_phoneNumber: {
          userId: req.user!.id,
          phoneNumber,
        },
      },
    });

    if (existingContact) {
      return next(
        new ErrorHandler(409, "Contact with this phone number already exists"),
      );
    }

    // Create contact
    const contact = await prisma.contact.create({
      data: {
        name,
        phoneNumber,
        userId: req.user!.id,
      },
    });

    // Invalidate cache for contacts and search results
    await invalidateContactRelatedCache(req.user!.id, phoneNumber);

    res.status(201).json({
      success: true,
      message: "Contact added successfully",
      data: contact,
    });
  },
);

// Get a single contact
export const getContact = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    // Check if contact exists and belongs to the user
    const contact = await prisma.contact.findFirst({
      where: {
        id,
        userId: req.user!.id,
      },
    });

    if (!contact) {
      return next(new ErrorHandler(404, "Contact not found"));
    }

    res.status(200).json({
      success: true,
      data: contact,
    });
  },
);

// Update a contact
export const updateContact = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    // Validate input
    const validation = updateContactSchema.safeParse(req.body);
    if (!validation.success) {
      return next(new ErrorHandler(400, validation.error.errors[0].message));
    }

    const { name } = validation.data;

    // Check if contact exists and belongs to the user
    const existingContact = await prisma.contact.findFirst({
      where: {
        id,
        userId: req.user!.id,
      },
    });

    if (!existingContact) {
      return next(new ErrorHandler(404, "Contact not found"));
    }

    // Update contact
    const updatedContact = await prisma.contact.update({
      where: { id },
      data: { name },
    });

    // Invalidate cache for this contact
    await invalidateContactRelatedCache(
      req.user!.id,
      updatedContact.phoneNumber,
    );

    res.status(200).json({
      success: true,
      message: "Contact updated successfully",
      data: updatedContact,
    });
  },
);

// Delete a contact
export const deleteContact = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    // Check if contact exists and belongs to the user
    const existingContact = await prisma.contact.findFirst({
      where: {
        id,
        userId: req.user!.id,
      },
    });

    if (!existingContact) {
      return next(new ErrorHandler(404, "Contact not found"));
    }

    // Store phone number before deletion for cache invalidation
    const phoneNumber = existingContact.phoneNumber;

    // Delete contact
    await prisma.contact.delete({
      where: { id },
    });

    // Invalidate cache for this contact
    await invalidateContactRelatedCache(req.user!.id, phoneNumber);

    res.status(200).json({
      success: true,
      message: "Contact deleted successfully",
    });
  },
);

/**
 * Report a number as spam
 */
export const reportSpam = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    // Validate input
    const validation = reportSpamSchema.safeParse(req.body);
    if (!validation.success) {
      return next(new ErrorHandler(400, validation.error.errors[0].message));
    }

    const { phoneNumber } = validation.data;

    // Check if user has already reported this number
    const existingReport = await prisma.spamReport.findUnique({
      where: {
        reportedBy_phoneNumber: {
          reportedBy: req.user!.id,
          phoneNumber,
        },
      },
    });

    if (existingReport) {
      return next(
        new ErrorHandler(409, "You have already reported this number"),
      );
    }

    // Create spam report
    await prisma.spamReport.create({
      data: {
        phoneNumber,
        reportedBy: req.user!.id,
      },
    });

    // Invalidate spam-related cache
    await invalidateSpamRelatedCache(phoneNumber);

    // Get updated spam information
    const updatedSpamInfo = await getSpamInfo(phoneNumber);

    res.status(201).json({
      success: true,
      message: "Number reported as spam successfully",
      data: {
        spamInfo: updatedSpamInfo,
      },
    });
  },
);
