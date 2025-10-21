/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates password strength
 */
export function isValidPassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 6) {
    return { valid: false, error: 'La contraseña debe tener al menos 6 caracteres' };
  }
  return { valid: true };
}

/**
 * Validates display name
 */
export function isValidDisplayName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'El nombre es requerido' };
  }
  if (name.trim().length < 2) {
    return { valid: false, error: 'El nombre debe tener al menos 2 caracteres' };
  }
  return { valid: true };
}

