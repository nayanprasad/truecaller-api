import prisma from "@/config/database.js";

/**
 * Get spam information for a phone number
 * @param phoneNumber The phone number to check
 * @param spamThreshold The threshold for marking a number as likely spam (default: 3)
 * @returns Object containing spam information
 */
export const getSpamInfo = async (phoneNumber: string, spamThreshold = 3) => {
  // Count spam reports for this number
  const spamReportsCount = await prisma.spamReport.count({
    where: { phoneNumber },
  });

  // Determine if number is likely spam based on threshold
  const isLikelySpam = spamReportsCount >= spamThreshold;

  // Calculate spam likelihood as a percentage (max 100%)
  const spamLikelihood = Math.min(
    Math.round((spamReportsCount / spamThreshold) * 100),
    100,
  );

  return {
    isLikelySpam,
    reportCount: spamReportsCount,
    spamLikelihood,
  };
};

/**
 * Get spam information for multiple phone numbers at once
 * @param phoneNumbers Array of phone numbers to check
 * @param spamThreshold The threshold for marking a number as likely spam (default: 3)
 * @returns Object with phone numbers as keys and spam info as values
 */
export const getBulkSpamInfo = async (
  phoneNumbers: string[],
  spamThreshold = 3,
) => {
  // Get all spam reports for these numbers in a single query
  const spamReports = await prisma.spamReport.groupBy({
    by: ["phoneNumber"],
    where: {
      phoneNumber: {
        in: phoneNumbers,
      },
    },
    _count: {
      id: true,
    },
  });

  // Create a map for easy lookup
  const spamCountMap = new Map();
  spamReports.forEach((report) => {
    spamCountMap.set(report.phoneNumber, report._count.id);
  });

  // Generate result for each phone number using reduce
  return phoneNumbers.reduce(
    (acc, phoneNumber) => {
      const reportCount = spamCountMap.get(phoneNumber) || 0;
      const isLikelySpam = reportCount >= spamThreshold;
      const spamLikelihood = Math.min(
        Math.round((reportCount / spamThreshold) * 100),
        100,
      );

      acc[phoneNumber] = {
        isLikelySpam,
        reportCount,
        spamLikelihood,
      };

      return acc;
    },
    {} as {
      [key: string]: {
        isLikelySpam: boolean;
        reportCount: number;
        spamLikelihood: number;
      };
    },
  );
};
