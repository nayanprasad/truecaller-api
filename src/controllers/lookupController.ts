import {NextFunction, Request, Response} from "express";
import {TryCatch} from "@/middlewares/error.js";
import ErrorHandler from "@/utils/errorHandler.js";
import prisma from "@/config/database.js";
import {getBulkSpamInfo, getSpamInfo} from "@/utils/spamUtils.js";
import {phoneLookupSchema, searchByNameSchema, searchByPhoneSchema,} from "@/models/validators.js";
import {
    ContactSearchResult,
    SearchByNameParams,
    SearchResponse,
    SearchResponseDataItem,
    SearchResultWithSource,
    SearchResultWithSpamInfo,
    SpamInfoMap,
    UserSearchResult,
} from "@/types/types.js";

/**
 * Look up a phone number to get user info and spam status
 */
export const lookupPhone = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    // Validate input
    const validation = phoneLookupSchema.safeParse(req.body);
    if (!validation.success) {
      return next(new ErrorHandler(400, validation.error.errors[0].message));
    }

    const { phoneNumber } = validation.data;

    // Find user by phone number
    const user = await prisma.user.findUnique({
      where: { phoneNumber },
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        email: true,
      },
    });

    // Check for contact in user's contacts and if the requester is in the user's contacts
    let contactName = null;
    let showEmail = false;

    if (req.user) {
      // Check if the requester has the phone number in their contacts
      const contact = await prisma.contact.findUnique({
        where: {
          userId_phoneNumber: {
            userId: req.user.id,
            phoneNumber,
          },
        },
        select: { name: true },
      });

      if (contact) {
        contactName = contact.name;
      }

      // Check if the requester is in the user's contacts (if user exists)
      if (user) {
        const isInContacts = await prisma.contact.findUnique({
          where: {
            userId_phoneNumber: {
              userId: user.id,
              phoneNumber: req.user.phoneNumber,
            },
          },
        });

        showEmail = !!isInContacts;
      }
    }

    // Get spam information
    const spamInfo = await getSpamInfo(phoneNumber);

    res.status(200).json({
      success: true,
      data: {
        phoneNumber,
        registeredUser: user
          ? {
              name: user.name,
              phoneNumber: user.phoneNumber,
              email: showEmail ? user.email : undefined, // Only show email if requester is in user's contacts
            }
          : null,
        contact: contactName ? { name: contactName } : null,
        spamInfo,
      },
    });
  },
);

/**
 * Search for people by name in the global database
 */
export const searchByName = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const validation = searchByNameSchema.safeParse({
      query: req.query.q,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
    });
    if (!validation.success) {
      return next(new ErrorHandler(400, validation.error.errors[0].message));
    }

    const { query, page, limit }: SearchByNameParams = validation.data;

    const skip = (page - 1) * limit;

    // First group: names starting with query (higher priority)
    const startsWithResults: UserSearchResult[] = await prisma.user.findMany({
      where: {
        name: { startsWith: query, mode: "insensitive" },
      },
      select: {
        id: true,
        name: true,
        phoneNumber: true,
      },
    });

    // Second group: names containing query but not starting with it
    const containsResults: UserSearchResult[] = await prisma.user.findMany({
      where: {
        name: {
          contains: query,
          mode: "insensitive",
        },
        NOT: { name: { startsWith: query, mode: "insensitive" } },
      },
      select: {
        id: true,
        name: true,
        phoneNumber: true,
      },
    });

    // Also search in contacts (people might have different names for the same number)
    const contactResults: ContactSearchResult[] = await prisma.contact.findMany(
      {
        where: {
          name: { contains: query, mode: "insensitive" },
        },
        select: {
          id: true,
          name: true,
          phoneNumber: true,
        },
        distinct: ["phoneNumber"],
      },
    );

    // Combine results and remove duplicates
    const allResults: SearchResultWithSource[] = [
      ...startsWithResults.map((u) => ({
        ...u,
        source: "user" as const,
        priority: 1,
      })),
      ...containsResults.map((u) => ({
        ...u,
        source: "user" as const,
        priority: 2,
      })),
      ...contactResults.map((c) => ({
        ...c,
        source: "contact" as const,
        priority: 3,
      })),
    ];

    // Remove duplicates by phone number, keeping higher priority items
    const uniqueResults: SearchResultWithSource[] = allResults.reduce<
      SearchResultWithSource[]
    >((acc, current) => {
      const x = acc.find((item) => item.phoneNumber === current.phoneNumber);
      if (!x || current.priority < x.priority) {
        // If the item doesn't exist yet or has higher priority, add/replace it
        if (x) {
          // Remove the lower priority item
          return acc
            .filter((item) => item.phoneNumber !== current.phoneNumber)
            .concat([current]);
        } else {
          return [...acc, current];
        }
      } else {
        return acc;
      }
    }, []);

    // Sort by priority
    uniqueResults.sort((a, b) => a.priority - b.priority);

    // Get all phone numbers to fetch spam info in bulk
    const phoneNumbers: string[] = uniqueResults.map(
      (result) => result.phoneNumber,
    );

    // Get spam information for all numbers in a single database call
    const spamInfoMap: SpamInfoMap = await getBulkSpamInfo(phoneNumbers);

    // Combine spam info with results
    const resultsWithSpamInfo: SearchResultWithSpamInfo[] = uniqueResults.map(
      (result) => ({
        ...result,
        spamInfo: spamInfoMap[result.phoneNumber],
      }),
    );

    // Apply pagination
    const paginatedResults: SearchResultWithSpamInfo[] =
      resultsWithSpamInfo.slice(skip, skip + limit);
    const totalCount: number = resultsWithSpamInfo.length;
    const totalPages: number = Math.ceil(totalCount / limit);

    const response: SearchResponse = {
      success: true,
      pagination: {
        totalCount,
        totalPages,
        currentPage: page,
        pageSize: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      data: paginatedResults.map(
        (r): SearchResponseDataItem => ({
          name: r.name,
          phoneNumber: r.phoneNumber,
          spamInfo: r.spamInfo,
        }),
      ),
    };

    res.status(200).json(response);
  },
);

/**
 * Search for people by phone number in the global database
 */
export const searchByPhone = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const validation = searchByPhoneSchema.safeParse({
      query: req.query.q,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
    });

    if (!validation.success) {
      return next(new ErrorHandler(400, validation.error.errors[0].message));
    }

    // Parse and validate input
    const { query, page, limit } = validation.data;

    const skip = (page - 1) * limit;

    // First check if there's a registered user with this phone number
    const registeredUser = await prisma.user.findFirst({
      where: {
        phoneNumber: { equals: query },
      },
      select: {
        id: true,
        name: true,
        phoneNumber: true,
      },
    });

    let results = [];
    let totalCount = 0;

    if (registeredUser) {
      // If there's a registered user, only show that result
      results = [registeredUser];
      totalCount = 1;
    } else {
      // Otherwise, search in contacts for that phone number
      results = await prisma.contact.findMany({
        where: {
          phoneNumber: { equals: query },
        },
        select: {
          id: true,
          name: true,
          phoneNumber: true,
        },
        skip,
        take: limit,
      });
      totalCount = await prisma.contact.count({
        where: {
          phoneNumber: { equals: query },
        },
      });
    }

    // Get spam information for the phone number(s)
    const spamInfo = await getSpamInfo(query);

    // Add spam info to all results
    const resultsWithSpamInfo = results.map((result) => ({
      ...result,
      spamInfo,
    }));

    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      success: true,
      pagination: {
        totalCount,
        totalPages,
        currentPage: page,
        pageSize: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      data: resultsWithSpamInfo.map((r) => ({
        name: r.name,
        phoneNumber: r.phoneNumber,
        spamInfo: r.spamInfo,
      })),
    });
  },
);

/**
 * Get detailed information about a specific phone number
 */
export const getDetailedInfo = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const validation = phoneLookupSchema.safeParse(req.params);
    if (!validation.success) {
      return next(new ErrorHandler(400, validation.error.errors[0].message));
    }

    const { phoneNumber } = req.params;

    // Find user by phone number
    const user = await prisma.user.findUnique({
      where: { phoneNumber },
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        email: true,
      },
    });

    // Find all contact entries for this phone number (different names people have saved)
    const contactEntries = await prisma.contact.findMany({
      where: { phoneNumber },
      select: {
        id: true,
        name: true,
        userId: true,
      },
    });

    // Get spam information using our utility function
    const spamInfo = await getSpamInfo(phoneNumber);

    // Check if the requester is in the user's contacts (to determine if email should be shown)
    let showEmail = false;
    if (user && req.user) {
      const isInContacts = await prisma.contact.findUnique({
        where: {
          userId_phoneNumber: {
            userId: user.id,
            phoneNumber: req.user.phoneNumber,
          },
        },
      });

      showEmail = !!isInContacts;
    }

    // Prepare response
    const response = {
      success: true,
      data: {
        phoneNumber,
        registeredUser: user
          ? {
              name: user.name,
              phoneNumber: user.phoneNumber,
              email: showEmail ? user.email : undefined, // Only show email if requester is in user's contacts
            }
          : null,
        savedAs: contactEntries.map((entry) => entry.name),
        spamInfo,
      },
    };

    res.status(200).json(response);
  },
);
