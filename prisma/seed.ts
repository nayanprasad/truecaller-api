import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/utils/password";

const prisma = new PrismaClient();

// Configuration
const USERS_COUNT = 100;
const CONTACTS_PER_USER_MIN = 10;
const CONTACTS_PER_USER_MAX = 50;
const SPAM_REPORTS_COUNT = 200;

// Helper to generate random phone numbers
const generatePhoneNumber = () => {
  const countryCode = "+91";
  const areaCode = Math.floor(Math.random() * 900) + 100;
  const firstPart = Math.floor(Math.random() * 900) + 100;
  const secondPart = Math.floor(Math.random() * 9000) + 1000;
  return `${countryCode}${areaCode}${firstPart}${secondPart}`;
};

// Helper to generate random names
const firstNames = [
  "James",
  "Mary",
  "John",
  "Patricia",
  "Robert",
  "Jennifer",
  "Michael",
  "Linda",
  "William",
  "Elizabeth",
  "David",
  "Susan",
  "Richard",
  "Jessica",
  "Joseph",
  "Sarah",
  "Thomas",
  "Karen",
  "Charles",
  "Nancy",
  "Christopher",
  "Lisa",
  "Daniel",
  "Margaret",
  "Matthew",
  "Betty",
  "Anthony",
  "Sandra",
  "Mark",
  "Ashley",
  "Donald",
  "Kimberly",
  "Steven",
  "Emily",
  "Paul",
  "Donna",
  "Andrew",
  "Michelle",
  "Joshua",
  "Carol",
  "Kenneth",
  "Amanda",
  "Kevin",
  "Melissa",
  "Brian",
  "Deborah",
  "George",
  "Stephanie",
];

const lastNames = [
  "Smith",
  "Johnson",
  "Williams",
  "Jones",
  "Brown",
  "Davis",
  "Miller",
  "Wilson",
  "Moore",
  "Taylor",
  "Anderson",
  "Thomas",
  "Jackson",
  "White",
  "Harris",
  "Martin",
  "Thompson",
  "Garcia",
  "Martinez",
  "Robinson",
  "Clark",
  "Rodriguez",
  "Lewis",
  "Lee",
  "Walker",
  "Hall",
  "Allen",
  "Young",
  "Hernandez",
  "King",
  "Wright",
  "Lopez",
  "Hill",
  "Scott",
  "Green",
  "Adams",
  "Baker",
  "Gonzalez",
  "Nelson",
  "Carter",
  "Mitchell",
  "Perez",
  "Roberts",
  "Turner",
  "Phillips",
  "Campbell",
  "Parker",
  "Evans",
];

const generateName = () => {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${firstName} ${lastName}`;
};

// Helper to generate random email
const generateEmail = (name: string) => {
  const randomNum = Math.floor(Math.random() * 1000);
  const nameParts = name.toLowerCase().replace(/\s+/g, ".");
  const domains = [
    "gmail.com",
    "yahoo.com",
    "outlook.com",
    "hotmail.com",
    "example.com",
  ];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `${nameParts}${randomNum}@${domain}`;
};

// Helper to get random item from array
const getRandomItem = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

// Helper to get random number in range
const getRandomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Main seeding function
async function main() {
  console.log("Starting database seed...");

  // Clear existing data
  console.log("Clearing existing data...");
  await prisma.session.deleteMany({});
  await prisma.spamReport.deleteMany({});
  await prisma.contact.deleteMany({});
  await prisma.user.deleteMany({});

  // Create users
  console.log(`Creating ${USERS_COUNT} users...`);
  const userRecords = [];
  const userPhoneNumbers = new Set();

  for (let i = 0; i < USERS_COUNT; i++) {
    // Ensure unique phone numbers
    let phoneNumber: string;
    do {
      phoneNumber = generatePhoneNumber();
    } while (userPhoneNumbers.has(phoneNumber));

    userPhoneNumbers.add(phoneNumber);

    const name = generateName();
    const email = Math.random() > 0.1 ? generateEmail(name) : null; // 10% of users without email
    const passwordHash = await hashPassword("password123"); // Same password for all test users

    const now = new Date();
    const created = new Date(
      now.getTime() - Math.random() * 90 * 24 * 60 * 60 * 1000,
    ); // Random date within last 90 days

    userRecords.push({
      name,
      phoneNumber,
      email,
      passwordHash,
      createdAt: created,
      updatedAt: now,
    });

    // Log progress every 10 users
    if ((i + 1) % 10 === 0) {
      console.log(`Prepared ${i + 1} users`);
    }
  }

  // Insert users
  for (const userData of userRecords) {
    await prisma.user.create({
      data: userData,
    });
  }

  // Fetch all created users for references
  const allUsers = await prisma.user.findMany();
  console.log(`${allUsers.length} users created successfully`);

  // Create contacts
  console.log("Creating contacts...");
  let contactCount = 0;

  // Create a map for quick lookups
  const userIdByPhoneNumber = new Map();
  allUsers.forEach((user) => {
    userIdByPhoneNumber.set(user.phoneNumber, user.id);
  });

  const allPhoneNumbers = Array.from(userPhoneNumbers);

  for (const user of allUsers) {
    const contactsCount = getRandomInt(
      CONTACTS_PER_USER_MIN,
      CONTACTS_PER_USER_MAX,
    );

    // Create a list of potential contacts excluding the current user
    const potentialContacts = allUsers
      .filter((u) => u.id !== user.id)
      .map((u) => ({ id: u.id, phoneNumber: u.phoneNumber, name: u.name }));

    // Randomly select contacts for this user
    const selectedContacts = new Set();
    for (let i = 0; i < contactsCount && potentialContacts.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * potentialContacts.length);
      const contact = potentialContacts[randomIndex];

      // Remove the selected contact from the potential contacts
      potentialContacts.splice(randomIndex, 1);

      if (selectedContacts.has(contact.phoneNumber)) {
        continue;
      }

      selectedContacts.add(contact.phoneNumber);

      // Sometimes use a different name than the registered name (30% chance)
      const useAlternateName = Math.random() < 0.3;
      const contactName = useAlternateName ? generateName() : contact.name;

      const now = new Date();
      const created = new Date(
        now.getTime() - Math.random() * 60 * 24 * 60 * 60 * 1000,
      ); // Random date within last 60 days

      try {
        // Create contacts one by one to handle potential constraints
        await prisma.contact.create({
          data: {
            name: contactName,
            phoneNumber: contact.phoneNumber,
            userId: user.id,
            createdAt: created,
            updatedAt: now,
          },
        });

        contactCount++;

        // Log progress every 100 contacts
        if (contactCount % 100 === 0) {
          console.log(`Created ${contactCount} contacts`);
        }
      } catch (error) {
        // @ts-expect-error -- safe to ignore
        console.error(`Error creating contact: ${error?.message}`);
      }
    }
  }

  console.log(`${contactCount} contacts created successfully`);

  // Create spam reports
  console.log(`Creating ${SPAM_REPORTS_COUNT} spam reports...`);
  let spamReportCount = 0;

  // Track unique user-phone combinations to avoid duplicates
  const reportedPairs = new Set();

  for (let i = 0; i < SPAM_REPORTS_COUNT; i++) {
    const reportingUser = getRandomItem(allUsers);
    const reportedPhoneNumber = getRandomItem(allPhoneNumbers);

    // Skip if user would be reporting themselves
    if (reportingUser.phoneNumber === reportedPhoneNumber) {
      continue;
    }

    // Skip if this user has already reported this number
    const reportKey = `${reportingUser.id}-${reportedPhoneNumber}`;
    if (reportedPairs.has(reportKey)) {
      continue;
    }

    reportedPairs.add(reportKey);

    const reportedAt = new Date(
      Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
    ); // Random date within last 30 days

    try {
      // Create spam reports one by one
      await prisma.spamReport.create({
        data: {
          reportedBy: reportingUser.id,
          // @ts-expect-error -- safe to ignore
          phoneNumber: reportedPhoneNumber,
          reportedAt,
        },
      });

      spamReportCount++;

      // Log progress every 50 reports
      if (spamReportCount % 50 === 0) {
        console.log(`Created ${spamReportCount} spam reports`);
      }
    } catch (error) {
      // @ts-expect-error -- safe to ignore
      console.error(`Error creating spam report: ${error?.message}`);
    }
  }

  console.log(`${spamReportCount} spam reports created successfully`);
  console.log("Database seeding completed successfully");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    // @ts-expect-error -- this is safe
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
