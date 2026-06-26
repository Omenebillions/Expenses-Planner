import DOMPurify from 'dompurify';

/**
 * Sanitizes input strings to prevent XSS attacks before storing in the database.
 * While React automatically escapes values rendered in JSX, sanitizing data at the 
 * input layer ensures that malicious scripts are not persisted to the database.
 */
export const sanitizeInput = (input: string | undefined | null): string => {
  if (!input) return '';
  // Strip all HTML tags securely
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] }).trim();
};

/**
 * Sanitize an object's string properties
 */
export const sanitizeObject = <T extends Record<string, any>>(obj: T): T => {
  const newObj = { ...obj };
  for (const key in newObj) {
    if (typeof newObj[key] === 'string') {
      newObj[key] = sanitizeInput(newObj[key]) as any;
    }
  }
  return newObj;
};

/**
 * Basic text obscuring for sensitive raw text (e.g., partial mask for emails/phones if needed)
 */
export const obscureText = (text: string, visibleStart = 2, visibleEnd = 2): string => {
  if (!text || text.length <= visibleStart + visibleEnd) return text;
  return `${text.substring(0, visibleStart)}...${text.substring(text.length - visibleEnd)}`;
};
