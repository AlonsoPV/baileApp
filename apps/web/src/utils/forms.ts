/**
 * Utility functions for form handling and validation
 */

/**
 * Required field validator
 */
export function required(value: any): string | undefined {
  if (value === null || value === undefined || value === '') {
    return 'Este campo es requerido';
  }
  if (typeof value === 'string' && value.trim() === '') {
    return 'Este campo es requerido';
  }
  return undefined;
}

/**
 * Email validator
 */
export function email(value: string): string | undefined {
  if (!value) return undefined;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value.trim())) {
    return 'Ingresa un email válido';
  }
  return undefined;
}

/**
 * Password validator
 */
export function password(value: string): string | undefined {
  if (!value) return undefined;
  
  if (value.length < 8) {
    return 'La contraseña debe tener al menos 8 caracteres';
  }
  
  const hasLetter = /[a-zA-Z]/.test(value);
  const hasNumber = /\d/.test(value);
  
  if (!hasLetter || !hasNumber) {
    return 'La contraseña debe contener al menos una letra y un número';
  }
  
  return undefined;
}

/**
 * Minimum length validator
 */
export function minLength(min: number) {
  return (value: string): string | undefined => {
    if (!value) return undefined;
    if (value.length < min) {
      return `Debe tener al menos ${min} caracteres`;
    }
    return undefined;
  };
}

/**
 * Maximum length validator
 */
export function maxLength(max: number) {
  return (value: string): string | undefined => {
    if (!value) return undefined;
    if (value.length > max) {
      return `No puede tener más de ${max} caracteres`;
    }
    return undefined;
  };
}

/**
 * Number validator
 */
export function number(value: any): string | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  
  if (isNaN(value) || !isFinite(value)) {
    return 'Debe ser un número válido';
  }
  
  return undefined;
}

/**
 * Positive number validator
 */
export function positiveNumber(value: any): string | undefined {
  const numError = number(value);
  if (numError) return numError;
  
  if (Number(value) <= 0) {
    return 'Debe ser un número positivo';
  }
  
  return undefined;
}

/**
 * Range validator
 */
export function range(min: number, max: number) {
  return (value: any): string | undefined => {
    const numError = number(value);
    if (numError) return numError;
    
    const num = Number(value);
    if (num < min || num > max) {
      return `Debe estar entre ${min} y ${max}`;
    }
    
    return undefined;
  };
}

/**
 * Phone number validator
 */
export function phone(value: string): string | undefined {
  if (!value) return undefined;
  
  const digits = value.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) {
    return 'Ingresa un número de teléfono válido';
  }
  
  return undefined;
}

/**
 * URL validator
 */
export function url(value: string): string | undefined {
  if (!value) return undefined;
  
  try {
    new URL(value);
    return undefined;
  } catch {
    return 'Ingresa una URL válida';
  }
}

/**
 * Custom validator that accepts a function
 */
export function custom(validator: (value: any) => string | undefined) {
  return validator;
}

/**
 * Combine multiple validators
 */
export function combine(...validators: Array<(value: any) => string | undefined>) {
  return (value: any): string | undefined => {
    for (const validator of validators) {
      const error = validator(value);
      if (error) return error;
    }
    return undefined;
  };
}

/**
 * Conditional validator
 */
export function conditional(condition: (value: any) => boolean, validator: (value: any) => string | undefined) {
  return (value: any): string | undefined => {
    if (condition(value)) {
      return validator(value);
    }
    return undefined;
  };
}

/**
 * Async validator
 */
export function asyncValidator(validator: (value: any) => Promise<string | undefined>) {
  return validator;
}

/**
 * Form field error helper
 */
export function getFieldError(errors: Record<string, string | undefined>, fieldName: string): string | undefined {
  return errors[fieldName];
}

/**
 * Check if form has any errors
 */
export function hasErrors(errors: Record<string, string | undefined>): boolean {
  return Object.values(errors).some(error => error !== undefined);
}

/**
 * Get all error messages
 */
export function getAllErrors(errors: Record<string, string | undefined>): string[] {
  return Object.values(errors).filter(error => error !== undefined) as string[];
}

/**
 * Clear specific field error
 */
export function clearFieldError(errors: Record<string, string | undefined>, fieldName: string): Record<string, string | undefined> {
  const newErrors = { ...errors };
  delete newErrors[fieldName];
  return newErrors;
}

/**
 * Clear all errors
 */
export function clearAllErrors(): Record<string, string | undefined> {
  return {};
}
