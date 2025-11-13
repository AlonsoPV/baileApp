/**
 * Genera un ID único para una clase en el cronograma.
 * Usa timestamp + número aleatorio para evitar colisiones.
 * 
 * @returns {number} ID único para la clase
 */
export function generateClassId(): number {
  // Usar timestamp en milisegundos + número aleatorio de 4 dígitos
  // Esto asegura IDs únicos incluso si se crean múltiples clases en el mismo milisegundo
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000); // 0-9999
  // Combinar: timestamp * 10000 + random
  // Esto nos da un número único y ordenable por fecha de creación
  return timestamp * 10000 + random;
}

/**
 * Verifica si una clase ya tiene un ID válido.
 * Si no lo tiene, genera uno nuevo.
 * 
 * @param {any} clase - Objeto de clase del cronograma
 * @returns {number} ID de la clase (existente o generado)
 */
export function ensureClassId(clase: any): number {
  if (clase && typeof clase.id === 'number' && clase.id > 0) {
    return clase.id;
  }
  return generateClassId();
}

