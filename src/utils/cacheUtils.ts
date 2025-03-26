import {CACHE_PREFIXES, invalidatePhoneNumberCache, invalidateResourceCache} from "@/middlewares/cache.js";

/**
 * Invalidate cache when a user is created, updated, or deleted
 * @param userId User ID
 * @param phoneNumber User's phone number
 */
export const invalidateUserRelatedCache = async (userId: string, phoneNumber: string): Promise<void> => {
  // Invalidate user-specific cache
  await invalidateResourceCache(CACHE_PREFIXES.USER, userId);
  
  // Invalidate cache for this phone number
  await invalidatePhoneNumberCache(phoneNumber);
  
  // Invalidate search results that might include this user
  await invalidateResourceCache(CACHE_PREFIXES.SEARCH);
};

/**
 * Invalidate cache when a contact is created, updated, or deleted
 * @param userId Owner of the contact
 * @param phoneNumber Phone number of the contact
 */
export const invalidateContactRelatedCache = async (userId: string, phoneNumber: string): Promise<void> => {
  // Invalidate contact-specific cache
  await invalidateResourceCache(CACHE_PREFIXES.CONTACT);
  
  // Invalidate user's cache
  await invalidateResourceCache(CACHE_PREFIXES.USER, userId);
  
  // Invalidate cache for this phone number
  await invalidatePhoneNumberCache(phoneNumber);
  
  // Invalidate search results that might include this contact
  await invalidateResourceCache(CACHE_PREFIXES.SEARCH);
};

/**
 * Invalidate cache when spam information is updated
 * @param phoneNumber Phone number with updated spam info
 */
export const invalidateSpamRelatedCache = async (phoneNumber: string): Promise<void> => {
  // Invalidate spam-specific cache
  await invalidateResourceCache(CACHE_PREFIXES.SPAM);
  
  // Invalidate cache for this phone number
  await invalidatePhoneNumberCache(phoneNumber);
};
