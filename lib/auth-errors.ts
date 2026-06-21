/**
 * Traduce los mensajes de error de Supabase Auth (siempre en inglés) al
 * español. Si el mensaje no está mapeado, devuelve un mensaje genérico en
 * vez de dejar pasar el texto en inglés sin traducir.
 */
export function translateAuthError(message: string | undefined | null): string {
  if (!message) return 'Ha ocurrido un error. Inténtalo de nuevo.'

  const map: Record<string, string> = {
    'New password should be different from the old password.':
      'La contraseña nueva debe ser distinta a la anterior.',
    'User already registered':
      'Ya existe una cuenta con ese email.',
    'Password should be at least 6 characters':
      'La contraseña debe tener al menos 6 caracteres.',
    'Email not confirmed':
      'Confirma tu email antes de entrar — revisa tu bandeja de entrada.',
    'Unable to validate email address: invalid format':
      'El formato del email no es válido.',
    'Invalid login credentials':
      'Email o contraseña incorrectos.',
    'Email rate limit exceeded':
      'Demasiados intentos. Espera unos minutos antes de volver a intentarlo.',
    'For security purposes, you can only request this after 60 seconds.':
      'Por seguridad, espera unos segundos antes de volver a intentarlo.',
  }

  return map[message] ?? 'Ha ocurrido un error. Inténtalo de nuevo.'
}
