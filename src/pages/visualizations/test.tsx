import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { useTheme } from '@/contexts/ThemeContext';
import ConceptMapRenderer from '@/components/visualization/ConceptMapRenderer';
import { 
  BookOpen, 
  Zap, 
  Brain, 
  Maximize2, 
  Download, 
  Upload,
  Sparkles,
  Target,
  Layers,
  TrendingUp,
  FileText,
  Eye,
  Sun,
  Moon,
  Palette,
  Loader2,
  AlertCircle,
  CheckCircle,
  Minimize2
} from 'lucide-react';

/**
 * 🧠 Nueva Página de Mapas Conceptuales OpositIA
 * Sistema completamente renovado con IA real
 */

// Tipos para el mapa conceptual
interface ConceptMapNode {
  id: string;
  label: string;
  level: 'central' | 'primary' | 'secondary' | 'detail';
  x: number;
  y: number;
  size: number;
  color: string;
}

interface ConceptMapEdge {
  id: string;
  source: string;
  target: string;
  label: string;
}

interface ConceptMapData {
  nodes: ConceptMapNode[];
  edges: ConceptMapEdge[];
  metadata: {
    totalNodes: number;
    totalConnections: number;
    complexity: 'simple' | 'medium' | 'complex';
    generatedWithAI: boolean;
    processingTime?: number;
  };
}

export default function VisualizationTestPage() {
  const [documentContent, setDocumentContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [conceptMapData, setConceptMapData] = useState<any>(null);
  const [useAI, setUseAI] = useState(true);
  const [mapData, setMapData] = useState<ConceptMapData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [layoutType, setLayoutType] = useState<'circular' | 'tree'>('circular');
  const { theme, actualTheme, toggleTheme } = useTheme();

  // Contenido de ejemplo mejorado para oposiciones
  const exampleContent = `# Derecho Administrativo - Procedimiento Administrativo Común

El procedimiento administrativo común es la serie ordenada de actos y trámites que deben seguir las Administraciones Públicas para dictar una resolución administrativa que afecte a los derechos e intereses de los ciudadanos.

## Principios Fundamentales
Los principios que rigen el procedimiento administrativo común establecen las bases para una actuación administrativa correcta:
- Principio de legalidad: La administración debe actuar conforme a derecho
- Principio de eficacia: Los procedimientos deben lograr sus objetivos
- Principio de celeridad: Evitar dilaciones innecesarias
- Principio de economía procesal: Optimizar recursos y tiempo
- Principio de transparencia: Garantizar el acceso a la información

## Fases del Procedimiento Administrativo

### 1. Iniciación del Procedimiento
El procedimiento administrativo puede iniciarse mediante diferentes modalidades:
- De oficio: Por propia iniciativa de la Administración cuando detecta la necesidad
- A instancia de parte: Cuando el interesado presenta una solicitud o petición
- Por denuncia: Cuando un tercero comunica hechos que requieren actuación administrativa

### 2. Ordenación e Instrucción
Durante esta fase central se desarrollan las siguientes actuaciones:
- Alegaciones de los interesados y presentación de documentos
- Práctica de pruebas necesarias para el esclarecimiento de los hechos
- Emisión de informes preceptivos por órganos especializados
- Trámite de audiencia a los interesados antes de la resolución

### 3. Terminación del Procedimiento
El procedimiento administrativo puede finalizar de diversas maneras:
- Resolución expresa del órgano competente
- Acto presunto por silencio administrativo positivo o negativo
- Desistimiento del interesado de su petición
- Renuncia del interesado a sus derechos
- Caducidad por inactividad durante el plazo establecido

## Plazos y Términos
El sistema de plazos garantiza la seguridad jurídica:
- Plazo máximo para resolver: 6 meses desde la iniciación (salvo norma específica)
- Plazo para recurrir: 1 mes para actos expresos, 3 meses para actos presuntos
- Prescripción: 4 años para procedimientos sancionadores
- Caducidad: Se produce cuando el interesado no realiza actividad durante 3 meses

## Sistema de Recursos Administrativos
Los recursos administrativos permiten impugnar las decisiones:
- Recurso de alzada: Se presenta ante el órgano superior jerárquico
- Recurso potestativo de reposición: Se presenta ante el mismo órgano que dictó el acto
- Recurso extraordinario de revisión: Procede en casos excepcionales tasados por la ley

Este procedimiento constituye la base del sistema administrativo español y garantiza los derechos de los ciudadanos frente a la Administración.`;

  // Cargar ejemplo
  const handleLoadExample = () => {
    setDocumentContent(exampleContent);
    setConceptMapData(null);
    setError(null);
  };

  // Generar mapa conceptual
  const handleGenerateConceptMap = async () => {
    if (!documentContent.trim()) {
      setError('Por favor, introduce o pega contenido para analizar');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setConceptMapData(null);

    try {
      console.log('🚀 Iniciando generación de mapa conceptual...');
      
      const response = await fetch('/api/visualizations/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: documentContent,
          useAI: useAI
        }),
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Mapa conceptual generado:', result.data);
        setConceptMapData(result.data);
      } else {
        throw new Error(result.message || 'Error generando mapa conceptual');
      }
      
    } catch (error) {
      console.error('❌ Error:', error);
      setError(error.message || 'Error desconocido generando mapa conceptual');
    } finally {
      setIsGenerating(false);
    }
  };

  // Subir archivo
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setDocumentContent(content);
        setConceptMapData(null);
        setError(null);
      };
      reader.readAsText(file);
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Icons de tema
  const getThemeIcon = () => {
    switch (actualTheme) {
      case 'light': return <Sun className="h-4 w-4" />;
      case 'dark': return <Moon className="h-4 w-4" />;
      default: return <Palette className="h-4 w-4" />;
    }
  };

  const getNextThemeText = () => {
    switch (actualTheme) {
      case 'light': return 'Cambiar a oscuro';
      case 'dark': return 'Cambiar a claro';
      default: return 'Cambiar tema';
    }
  };

  return (
    <>
      <Head>
        <title>🧠 Mapas Conceptuales con IA - OpositIA</title>
        <meta name="description" content="Crea mapas conceptuales jerárquicos profesionales usando inteligencia artificial, similar a esquema.net" />
      </Head>

      <div className={`min-h-screen bg-background transition-all duration-300 ${isFullscreen ? 'fullscreen-layout' : ''}`}>
        {/* Header principal */}
        {!isFullscreen && (
          <div className="bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 border-b border-border">
            <div className="max-w-7xl mx-auto px-6 py-8">
              <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Brain className="h-8 w-8 text-primary" />
                  </div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Mapas Conceptuales con IA
                  </h1>
                </div>
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                  Sistema <span className="text-primary font-medium">completamente renovado</span> para crear 
                  <span className="text-accent font-medium"> mapas conceptuales jerárquicos</span> usando 
                  <span className="text-success font-medium"> inteligencia artificial avanzada</span>, 
                  similar a <a href="https://esquema.net/jerarquico/" target="_blank" rel="noopener noreferrer" className="text-primary underline">esquema.net</a>
                </p>
                
                {/* Características del nuevo sistema */}
                <div className="flex items-center justify-center gap-8 mt-6 flex-wrap">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span>IA Real - Claude, GPT, Gemini</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Target className="h-4 w-4 text-success" />
                    <span>Estructura Jerárquica</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4 text-accent" />
                    <span>Análisis Semántico</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Eye className="h-4 w-4 text-violet-500" />
                    <span>Visualización Profesional</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className={`${isFullscreen ? 'fullscreen-main' : 'max-w-7xl mx-auto p-6'}`}>
          <div className={`grid gap-6 transition-all duration-300 ${isFullscreen ? 'grid-cols-1 h-full' : 'grid-cols-1 lg:grid-cols-2'}`}>
            
            {/* Panel de entrada */}
            {!isFullscreen && (
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Contenido del Documento
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={toggleTheme}
                        title={getNextThemeText()}
                      >
                        {getThemeIcon()}
                        <span className="ml-1 hidden sm:inline">Tema</span>
                      </Button>
                      <input
                        type="file"
                        accept=".txt,.md"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => document.getElementById('file-upload')?.click()}
                        disabled={isGenerating}
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        Subir
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Botón de ejemplo */}
                    <Button 
                      onClick={handleLoadExample}
                      className="w-full"
                      variant="outline"
                      disabled={isGenerating}
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      Cargar Ejemplo (Derecho Administrativo)
                    </Button>
                    
                    {/* Área de texto */}
                    <Textarea
                      value={documentContent}
                      onChange={(e) => {
                        setDocumentContent(e.target.value);
                        setConceptMapData(null);
                        setError(null);
                      }}
                      placeholder="Pega aquí el contenido de tu material de estudio para generar un mapa conceptual jerárquico..."
                      className="min-h-[400px] font-mono text-sm resize-none"
                      disabled={isGenerating}
                    />
                    
                    {/* Estadísticas del contenido */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{documentContent.length} caracteres</span>
                      {documentContent.length > 0 && (
                        <div className="flex items-center gap-4">
                          <span>≈ {Math.ceil(documentContent.length / 500)} párrafos</span>
                          <span>≈ {Math.ceil(documentContent.split(' ').length / 200)} min lectura</span>
                        </div>
                      )}
                    </div>

                    {/* Configuración de IA */}
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium">Configuración</span>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-muted-foreground">Layout:</label>
                            <select
                              value={layoutType}
                              onChange={(e) => setLayoutType(e.target.value as 'circular' | 'tree')}
                              className="text-xs border rounded px-2 py-1"
                              disabled={isGenerating}
                            >
                              <option value="circular">🔄 Circular</option>
                              <option value="tree">🌳 Árbol</option>
                            </select>
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-muted-foreground">Usar IA:</label>
                            <input
                              type="checkbox"
                              checked={useAI}
                              onChange={(e) => setUseAI(e.target.checked)}
                              className="rounded"
                              disabled={isGenerating}
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Botón principal de generación */}
                      <Button 
                        onClick={handleGenerateConceptMap}
                        className="w-full"
                        disabled={isGenerating || !documentContent.trim()}
                        size="lg"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {useAI ? 'Generando con IA...' : 'Analizando contenido...'}
                          </>
                        ) : (
                          <>
                            <Zap className="h-4 w-4 mr-2" />
                            {useAI ? 'Generar Mapa con IA' : 'Generar Mapa Básico'}
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Estado de error */}
                    {error && (
                      <div className="border border-red-200 rounded-lg p-3 bg-red-50 dark:bg-red-900/20">
                        <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">Error</span>
                        </div>
                        <p className="text-sm text-red-600 dark:text-red-300 mt-1">{error}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Panel de visualización */}
            <div className={isFullscreen ? 'visualization-fullscreen-viewer h-full' : 'h-fit'}>
              {conceptMapData ? (
                <ConceptMapRenderer
                  data={conceptMapData}
                  height={isFullscreen ? 800 : 600}
                  isFullscreen={isFullscreen}
                  onToggleFullscreen={toggleFullscreen}
                  className="h-full"
                  layoutType={layoutType}
                />
              ) : (
                <Card className="h-full min-h-[600px]">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Brain className="h-5 w-5 text-primary" />
                        Mapa Conceptual
                      </div>
                      {!isFullscreen && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={toggleFullscreen}
                        >
                          <Maximize2 className="h-4 w-4" />
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-full flex items-center justify-center">
                    <div className="text-center p-8">
                      {isGenerating ? (
                        <div className="space-y-4">
                          <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
                          <div className="space-y-2">
                            <h3 className="text-xl font-semibold">
                              {useAI ? 'Generando con IA' : 'Analizando contenido'}
                            </h3>
                            <p className="text-muted-foreground">
                              {useAI 
                                ? 'La inteligencia artificial está analizando tu contenido y creando un mapa conceptual jerárquico profesional...'
                                : 'Analizando el texto y extrayendo conceptos clave para el mapa...'
                              }
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="text-6xl mb-4">🧠</div>
                          <h3 className="text-xl font-semibold">¡Nuevo Sistema de Mapas Conceptuales!</h3>
                          <p className="text-muted-foreground max-w-md">
                            Introduce tu contenido y genera mapas conceptuales jerárquicos 
                            profesionales usando inteligencia artificial avanzada.
                          </p>
                          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>Sistema completamente renovado</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Panel de información del sistema */}
          {!isFullscreen && !conceptMapData && !isGenerating && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" />
                  Nuevo Sistema de IA para Mapas Conceptuales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <div className="font-medium text-primary">Inteligencia Artificial Real</div>
                    </div>
                    <div className="text-sm text-muted-foreground">Claude, GPT-4, Gemini</div>
                    <div className="text-xs text-primary mt-1">Análisis semántico avanzado</div>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-5 w-5 text-success" />
                      <div className="font-medium text-success">Estructura Jerárquica</div>
                    </div>
                    <div className="text-sm text-muted-foreground">4 niveles organizados</div>
                    <div className="text-xs text-success mt-1">Central • Primario • Secundario • Detalle</div>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="h-5 w-5 text-accent" />
                      <div className="font-medium text-accent">Visualización Profesional</div>
                    </div>
                    <div className="text-sm text-muted-foreground">SVG interactivo</div>
                    <div className="text-xs text-accent mt-1">Similar a esquema.net</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}