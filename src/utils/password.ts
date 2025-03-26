import crypto from "crypto";

/**
 * Hashes a password using PBKDF2 with a random salt
 * @param password The plain text password to hash
 * @returns Promise resolving to the hashed password
 */
export const hashPassword = async (password: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Generate a random salt
    const salt = crypto.randomBytes(16).toString("hex");

    // Use PBKDF2 to hash the password
    crypto.pbkdf2(password, salt, 10000, 64, "sha512", (err, derivedKey) => {
      if (err) return reject(err);

      // Format: iterations:salt:hash
      resolve(`10000:${salt}:${derivedKey.toString("hex")}`);
    });
  });
};

/**
 * Verifies a password against a hash
 * @param password The plain text password to verify
 * @param storedHash The stored hash to compare against
 * @returns Promise resolving to boolean indicating if password matches
 */
export const comparePassword = async (
  password: string,
  storedHash: string,
): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    // Split the stored hash to get the iterations, salt, and hash
    const [iterations, salt, hash] = storedHash.split(":");
    const iterCount = parseInt(iterations);

    // Hash the input password with the same parameters
    crypto.pbkdf2(
      password,
      salt,
      iterCount,
      64,
      "sha512",
      (err, derivedKey) => {
        if (err) return reject(err);

        // Compare the hashes
        resolve(derivedKey.toString("hex") === hash);
      },
    );
  });
};
