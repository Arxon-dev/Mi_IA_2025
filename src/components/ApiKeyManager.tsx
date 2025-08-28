import React, { useState, useEffect } from 'react';
import { AIService } from '@/services/aiService';
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Settings, 
  Key, 
  Eye, 
  EyeOff, 
  ExternalLink,
  AlertTriangle,
  Shield
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

const PROVIDERS = [
  { 
    value: 'google', 
    label: 'Google Gemini',
    description: 'Modelos Gemini de Google',
    url: 'https://makersuite.google.com/app/apikey',
    color: 'bg-blue-500'
  },
  { 
    value: 'openai', 
    label: 'OpenAI',
    description: 'Modelos GPT de OpenAI',
    url: 'https://platform.openai.com/api-keys',
    color: 'bg-green-500'
  },
  { 
    value: 'anthropic', 
    label: 'Anthropic',
    description: 'Modelos Claude de Anthropic',
    url: 'https://console.anthropic.com/settings/keys',
    color: 'bg-orange-500'
  },
  { 
    value: 'deepseek', 
    label: 'Deepseek',
    description: 'Modelos de razonamiento avanzado',
    url: 'https://platform.deepseek.com/api-keys',
    color: 'bg-purple-500'
  },
  { 
    value: 'xai', 
    label: 'xAI (Grok)',
    description: 'Modelos Grok de xAI',
    url: 'https://x.ai/api',
    color: 'bg-gray-800'
  },
  { 
    value: 'alibaba', 
    label: 'Alibaba Qwen',
    description: 'Modelos Qwen de Alibaba',
    url: 'https://qwen.openai.com/',
    color: 'bg-red-500'
  },
];

interface ApiKeyManagerProps {
  readOnly?: boolean;
}

// Utilidad local para obtener la API key desde process.env
function getApiKeyFromEnvLocal(provider: string): string | null {
  switch (provider.toLowerCase()) {
    case 'google':
      return process.env.NEXT_PUBLIC_GEMINI_API_KEY || null;
    case 'openai':
      return process.env.NEXT_PUBLIC_GPT_API_KEY || null;
    case 'anthropic':
      return process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || null;
    case 'deepseek':
      return process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY || null;
    case 'xai':
      return process.env.NEXT_PUBLIC_XAI_API_KEY || null;
    case 'alibaba':
      return process.env.NEXT_PUBLIC_QWEN_API_KEY || null;
    default:
      return null;
  }
}

export const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ readOnly = false }) => {
  const [provider, setProvider] = useState<string>('google');
  const [apiKey, setApiKey] = useState<string>('');
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const selectedProvider = PROVIDERS.find(p => p.value === provider);

  // Cargar la API key del proveedor seleccionado
  const loadApiKey = async (prov: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const config = await AIService.getConfig();
      if (config?.provider === prov && config?.apiKey) {
        setApiKey(config.apiKey);
        setIsConfigured(true);
      } else {
        // Intentar cargar desde .env.local
        const envKey = getApiKeyFromEnvLocal(prov);
        if (envKey) {
          setApiKey(envKey);
          setIsConfigured(true);
        } else {
          setApiKey('');
          setIsConfigured(false);
        }
      }
    } catch (error) {
      setApiKey('');
      setIsConfigured(false);
      setError('Error al cargar la configuración.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadApiKey(provider);
  }, [provider]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const trimmedApiKey = apiKey.trim();
      if (!trimmedApiKey) {
        throw new Error('La API key no puede estar vacía');
      }
      await AIService.setProviderApiKey(provider as any, trimmedApiKey);
      await loadApiKey(provider);
      setSuccess(true);
      setShowApiKey(false);
      setShowPassword(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(`Error al guardar o verificar la API key: ${errorMessage}`);
      setIsConfigured(false);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = () => {
    if (isLoading) {
      return <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />;
    }
    if (isConfigured) {
      return <CheckCircle className="w-5 h-5 text-success" />;
    }
    return <XCircle className="w-5 h-5 text-destructive" />;
  };

  const getStatusText = () => {
    if (isLoading) return 'Verificando estado de la API key...';
    if (isConfigured) return 'API key configurada correctamente';
    return error || 'API key no configurada';
  };

  const getStatusVariant = () => {
    if (isLoading) return 'info';
    if (isConfigured) return 'success';
    return 'error';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Key className="w-5 h-5 text-primary" />
          <span>Gestión de API Keys</span>
        </CardTitle>
        <CardDescription>
          Configura las claves de API para los proveedores de inteligencia artificial
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Status Alert */}
          <Alert variant={getStatusVariant() as any}>
            {getStatusIcon()}
            <AlertTitle>
              {isConfigured ? 'Configuración Lista' : 'Configuración Requerida'}
            </AlertTitle>
            <AlertDescription>
              {getStatusText()}
            </AlertDescription>
          </Alert>

          {/* Quick Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Estado de configuración
              </span>
              <Badge variant={isConfigured ? 'success' : 'destructive'}>
                {isConfigured ? 'Configurado' : 'Pendiente'}
              </Badge>
            </div>
            {!readOnly && (
              <Button
                variant="outline"
                onClick={() => setShowApiKey(!showApiKey)}
                className="flex items-center space-x-2"
              >
                <Settings className="w-4 h-4" />
                <span>{showApiKey ? 'Ocultar' : 'Configurar'}</span>
              </Button>
            )}
          </div>

          {/* Configuration Form */}
          {!readOnly && showApiKey && (
            <div className="space-y-6 p-6 bg-muted/30 rounded-lg border border-border">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Provider Selection */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-foreground">
                    Proveedor de IA
                  </label>
                  <select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    {PROVIDERS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                  
                  {selectedProvider && (
                    <div className="flex items-center space-x-3 p-3 bg-background rounded-lg border border-border">
                      <div className={cn("w-3 h-3 rounded-full", selectedProvider.color)} />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {selectedProvider.label}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {selectedProvider.description}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(selectedProvider.url, '_blank')}
                        className="flex items-center space-x-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span className="text-xs">Obtener API Key</span>
                      </Button>
                    </div>
                  )}
                </div>

                {/* API Key Input */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-foreground">
                    API Key de {selectedProvider?.label}
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Ingresa tu API key"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Esta API key se utilizará para realizar peticiones al proveedor seleccionado
                  </p>
                </div>

                {/* Security Notice */}
                <Alert variant="info">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Información de Seguridad</AlertTitle>
                  <AlertDescription>
                    Las API keys se almacenan de forma segura y solo se utilizan para las 
                    peticiones autorizadas a los servicios de IA.
                  </AlertDescription>
                </Alert>

                {/* Form Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    type="submit"
                    disabled={isLoading || !apiKey.trim()}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Key className="w-4 h-4 mr-2" />
                        Guardar API Key
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowApiKey(false);
                      setError(null);
                      setSuccess(false);
                    }}
                  >
                    Cancelar
                  </Button>
                </div>

                {/* Status Messages */}
                {error && (
                  <Alert variant="error">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert variant="success">
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>¡Éxito!</AlertTitle>
                    <AlertDescription>
                      API key guardada y verificada correctamente
                    </AlertDescription>
                  </Alert>
                )}
              </form>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 