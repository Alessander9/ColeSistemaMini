import { describe, it, expect } from 'vitest';
import { 
  generateStudentPassword, 
  generateStudentEmail, 
  generateStudentUsername 
} from '@/lib/auth/generateCredentials';

describe('Generación Automática de Credenciales Escolares', () => {
  it('debe generar una contraseña segura de 12 caracteres combinando nombre, apellido y fecha de nacimiento', () => {
    const password = generateStudentPassword('Carlos Alberto', 'Ramírez Quispe', '2015-04-23');
    
    expect(password).toBeDefined();
    expect(password.length).toBe(12);
    // Debe contener las iniciales formateadas
    expect(password.startsWith('Carram')).toBe(true);
  });

  it('debe generar un correo institucional limpio sin tildes ni caracteres especiales', () => {
    const email = generateStudentEmail('María José', 'Ñúñez Pérez');
    
    expect(email).toBe('maria.nunez@colegio.edu.pe');
    expect(email).not.toContain('á');
    expect(email).not.toContain('é');
    expect(email).not.toContain('ñ');
    expect(email.endsWith('@colegio.edu.pe')).toBe(true);
  });

  it('debe generar un nombre de usuario único con el apellido y los últimos dígitos del DNI', () => {
    const username = generateStudentUsername('González', '78945612');
    
    expect(username).toBe('gonzalez612');
    expect(username).toMatch(/^[a-z]+[0-9]{3}$/);
  });
});
