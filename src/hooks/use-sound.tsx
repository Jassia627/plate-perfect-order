import { useState, useEffect } from 'react';

type SoundType = 'notification' | 'error' | 'success';

interface UseSound {
  playSound: (type: SoundType) => void;
  isMuted: boolean;
  toggleMute: () => void;
}

export function useSound(): UseSound {
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    // Recuperar la preferencia del sonido del almacenamiento local
    const savedPreference = localStorage.getItem('sound_muted');
    return savedPreference ? JSON.parse(savedPreference) : false;
  });
  
  // Guardar la preferencia de sonido en el almacenamiento local
  useEffect(() => {
    localStorage.setItem('sound_muted', JSON.stringify(isMuted));
  }, [isMuted]);
  
  const toggleMute = () => {
    setIsMuted(prev => !prev);
  };
  
  const playSound = (type: SoundType) => {
    if (isMuted) return;
    
    let soundUrl: string;
    
    switch (type) {
      case 'notification':
        soundUrl = '/sounds/notification.mp3';
        break;
      case 'error':
        soundUrl = '/sounds/error.mp3';
        break;
      case 'success':
        soundUrl = '/sounds/success.mp3';
        break;
      default:
        soundUrl = '/sounds/notification.mp3';
    }
    
    // Crear y reproducir el sonido
    const audio = new Audio(soundUrl);
    audio.volume = 0.5; // Volumen al 50%
    
    // Intentar reproducir el sonido
    audio.play().catch(error => {
      // Es común que los navegadores bloqueen la reproducción automática
      // hasta que el usuario interactúe con la página
      console.error('Error al reproducir sonido:', error);
    });
  };
  
  return {
    playSound,
    isMuted,
    toggleMute
  };
} 