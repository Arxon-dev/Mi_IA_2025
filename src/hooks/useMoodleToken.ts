import { useState, useEffect } from 'react';

interface MoodleTokenState {
  moodleToken: string | null;
  isLoading: boolean;
  error: Error | null;
}

export const useMoodleToken = (): MoodleTokenState => {
  const [moodleToken, setMoodleToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchToken = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Intenta obtener el token desde una API interna que lo lee del backend (.env)
        // Esto es más seguro que exponerlo directamente al cliente si es un token de larga duración.
        const response = await fetch('/api/moodle/get-token'); // Endpoint hipotético
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al obtener el token de Moodle desde la API');
        }
        const data = await response.json();
        if (data.token) {
          setMoodleToken(data.token);
        } else {
          throw new Error('Token no encontrado en la respuesta de la API');
        }
      } catch (e: any) {
        console.error("Error fetching Moodle token:", e);
        setError(e);
        setMoodleToken(null); // Asegurarse de que el token sea nulo en caso de error
      }
      setIsLoading(false);
    };

    fetchToken();
  }, []);

  return { moodleToken, isLoading, error };
}; 