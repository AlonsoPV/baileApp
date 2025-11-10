/**
 * Utility functions for form validation
 */

/**
 * Validates if an email address is properly formatted
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates if a password meets minimum requirements
 */
export function isValidPassword(password: string): boolean {
  if (!password || typeof password !== 'string') return false;
  
  // Minimum 8 characters
  if (password.length < 8) return false;
  
  // At least one letter and one number
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  
  return hasLetter && hasNumber;
}

/**
 * Validates if a display name is valid
 */
type DisplayNameValidationResult = {
  valid: boolean;
  error?: string;
};

export function isValidDisplayName(name: string): DisplayNameValidationResult {
  if (!name || typeof name !== "string") {
    return { valid: false, error: "El nombre es obligatorio." };
  }

  const trimmed = name.trim();

  if (trimmed.length < 2 || trimmed.length > 50) {
    return {
      valid: false,
      error: "El nombre debe tener entre 2 y 50 caracteres.",
    };
  }

  // Permitir letras (incluyendo acentos), números, espacios y símbolos comunes
  const validNameRegex = /^[\p{L}\p{M}\p{N}\s\-_'.,!&@()]+$/u;
  if (!validNameRegex.test(trimmed)) {
    return {
      valid: false,
      error:
        "Puedes usar letras con acentos, números, espacios y símbolos comunes como . , - _ ' ! & @ ( ).",
    };
  }

  return { valid: true };
}

/**
 * Validates if a phone number is properly formatted
 */
export function isValidPhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Must be between 10 and 15 digits
  return digits.length >= 10 && digits.length <= 15;
}

/**
 * Validates if a URL is properly formatted
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates if a string is not empty after trimming
 */
export function isNotEmpty(value: string): boolean {
  return value && typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validates if a string has minimum length
 */
export function hasMinLength(value: string, minLength: number): boolean {
  return value && typeof value === 'string' && value.trim().length >= minLength;
}

/**
 * Validates if a string has maximum length
 */
export function hasMaxLength(value: string, maxLength: number): boolean {
  return value && typeof value === 'string' && value.trim().length <= maxLength;
}

/**
 * Validates if a value is a valid number
 */
export function isValidNumber(value: any): boolean {
  return !isNaN(value) && isFinite(value);
}

/**
 * Validates if a value is a positive number
 */
export function isPositiveNumber(value: any): boolean {
  return isValidNumber(value) && Number(value) > 0;
}

/**
 * Validates if a value is within a range
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return isValidNumber(value) && value >= min && value <= max;
}
