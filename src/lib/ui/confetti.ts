// Helper ultra-ligero para disparar confetti sin cargar la librería en el bundle inicial
export async function triggerConfetti(options?: any) {
  if (typeof window === 'undefined') return;
  try {
    const confettiModule = await import('canvas-confetti');
    const confetti = confettiModule.default || confettiModule;
    confetti(options || {
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 }
    });
  } catch {
    // Si falla o está bloqueado, no interrumpir la experiencia de usuario
  }
}
