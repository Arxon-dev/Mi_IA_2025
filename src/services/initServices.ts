import { AIService } from './aiService';
import { StorageService } from './storageService';

// Declaración para TypeScript
declare global {
  interface Window {
    verificarConfiguracionAI?: () => void;
    verificarModelosGoogle?: () => void;
    probarModeloGemini?: (modelId: string) => Promise<string>;
    verificarAPIKeys?: () => void;
  }
}

/**
 * Verifica si localStorage está disponible
 */
const isLocalStorageAvailable = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Inicializa todos los servicios de la aplicación
 * Esta función debe ser llamada al inicio de la aplicación para
 * cargar todas las configuraciones desde el almacenamiento local
 */
export function initializeServices(): void {
  console.log('Inicializando servicios...');
  
  // Verificar que estamos en un entorno con localStorage
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage no está disponible, la inicialización de servicios puede ser limitada');
  }
  
  try {
    // Inicializar servicio de IA con la configuración guardada
    AIService.initialize().then(() => {
      console.log('Servicio de IA inicializado');
      
      // Añadir funciones de diagnóstico al objeto window
      if (typeof window !== 'undefined') {
        window.verificarConfiguracionAI = async () => {
          console.log('🔍 Ejecutando verificación de configuración de AIService...');
          await AIService.verificarEstadoAPIKey();
        };
        
        window.verificarModelosGoogle = async () => {
          console.log('🔍 Consultando modelos disponibles en Google Gemini API...');
          try {
            const response = await fetch(
              `https://generativelanguage.googleapis.com/v1/models?key=${process.env.NEXT_PUBLIC_GEMINI_API_KEY}`
            );
            
            if (!response.ok) {
              throw new Error('Error al consultar modelos');
            }
            
            const data = await response.json();
            console.log('Modelos disponibles:', data);
            
            // Mostrar lista de modelos disponibles
            if (data.models && Array.isArray(data.models)) {
              console.log('📋 Lista de modelos disponibles:');
              data.models.forEach((model: any) => {
                console.log(`- ${model.name} (${model.displayname})`);
              });
            }
            
            return data;
          } catch (error) {
            console.error('Error al verificar modelos:', error);
            return null;
          }
        };
        
        window.probarModeloGemini = async (modelId: string) => {
          console.log('🔍 Probando modelo específico de Gemini:', modelId);
          try {
            // Asegurarnos de que el modelId tiene el formato correcto
            const cleanModelId = modelId.replace(/^models\//, '');
            
            console.log('📝 Enviando solicitud al modelo:', cleanModelId);
            
            const response = await fetch('/api/google/generate', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                modelId: cleanModelId,
                content: "Por favor, responde con un simple 'Hola' para verificar que funcionas correctamente."
              })
            });

            const data = await response.json();
            
            if (!response.ok) {
              console.error('❌ Error al llamar al modelo:', data);
              throw new Error(JSON.stringify(data, null, 2));
            }

            console.log('✅ Respuesta del modelo:', data);
            return data;
          } catch (error) {
            console.error('❌ Error al probar el modelo:', error);
            throw error;
          }
        };
        
        window.verificarAPIKeys = async () => {
          console.log('🔍 Verificando API keys...');
          const resultados = await AIService.verificarTodasLasAPIKeys();
          console.log('Resultados:', resultados);
        };
        
        console.log('💡 Funciones de diagnóstico disponibles:');
        console.log('   - window.verificarConfiguracionAI(): Verificar configuración general');
        console.log('   - window.verificarModelosGoogle(): Verificar modelos de Google disponibles');
        console.log('   - window.probarModeloGemini("ID-DEL-MODELO"): Probar un modelo específico');
        console.log('   - window.verificarAPIKeys(): Verificar todas las API keys configuradas');
      }
    }).catch(error => {
      console.error('Error al inicializar AIService:', error);
    });
    
    console.log('Todos los servicios inicializados correctamente');
  } catch (error) {
    console.error('Error al inicializar servicios:', error);
  }
} 