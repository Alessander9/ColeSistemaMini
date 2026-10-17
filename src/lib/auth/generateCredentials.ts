/**
 * Genera una contraseña aleatoria con el generador criptográfico del entorno.
 * Usa letras y números sin caracteres que se confunden al dictarlos (0/O, 1/l/I).
 */
export function generateSecurePassword(length = 10): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const all = upper + lower + digits;
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  const chars = Array.from(bytes, b => all[b % all.length]);
  // Garantiza al menos una mayúscula, una minúscula y un número
  chars[0] = upper[bytes[0] % upper.length];
  chars[1] = lower[bytes[1] % lower.length];
  chars[2] = digits[bytes[2] % digits.length];
  return chars.join('');
}

/**
 * Generates a deterministic 12-character access password for a student.
 *
 * Formula:
 *   primeras 3 letras del primer nombre (capitalizado)
 *   + primeras 3 letras del primer apellido (minúsculas)
 *   + dia de nacimiento (2 dígitos)
 *   + mes de nacimiento (2 dígitos)
 *   + edad calculada (2 dígitos)
 *
 * Example: "Mat" + "sil" + "14" + "05" + "10" = "Matsil140510"  (12 chars)
 */
export function generateStudentPassword(
  nombres: string,
  apellidos: string,
  fechaNacimiento: string
): string {
  const firstName = nombres.trim().split(/\s+/)[0] ?? 'Alumno';
  const lastName  = apellidos.trim().split(/\s+/)[0] ?? 'Coleg';

  // First 3 letters of name (capitalized) + first 3 of surname (lowercase)
  const namePart = (firstName.slice(0, 3).charAt(0).toUpperCase() + firstName.slice(1, 3).toLowerCase());
  const surPart  = lastName.slice(0, 3).toLowerCase();

  // Parse birth date
  const birth = new Date(fechaNacimiento);
  const today = new Date();

  const day   = String(birth.getDate()).padStart(2, '0');
  const month = String(birth.getMonth() + 1).padStart(2, '0');

  let age = today.getFullYear() - birth.getFullYear();
  const hasHadBirthday =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
  if (!hasHadBirthday) age--;
  const agePart = String(age).padStart(2, '0');

  // Compose: 3 + 3 + 2 + 2 + 2 = 12 chars
  return `${namePart}${surPart}${day}${month}${agePart}`;
}

/**
 * Generates the institutional email for a student.
 * Format: primer_nombre.primer_apellido@colegio.edu.pe
 */
export function generateStudentEmail(nombres: string, apellidos: string): string {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove accents
      .replace(/[^a-z0-9]/g, '');      // keep only alphanumeric

  const firstName = normalize(nombres.trim().split(/\s+/)[0]);
  const lastName  = normalize(apellidos.trim().split(/\s+/)[0]);
  return `${firstName}.${lastName}@colegio.edu.pe`;
}

/**
 * Generates the access username.
 * Format: primer_apellido + last 3 digits of DNI
 */
export function generateStudentUsername(apellidos: string, dni: string): string {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');

  const lastName = normalize(apellidos.trim().split(/\s+/)[0]);
  const dniSuffix = dni.slice(-3);
  return `${lastName}${dniSuffix}`;
}
