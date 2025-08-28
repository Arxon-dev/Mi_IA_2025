import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import VisualizationViewer from '@/components/visualization/VisualizationViewer';
import DocumentProcessor from '@/components/visualization/DocumentProcessor';
import OpositiaIntegration from '@/components/visualization/OpositiaIntegration';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { 
  Brain, 
  Sparkles, 
  Target, 
  TrendingUp,
  Layers,
  Network,
  GitBranch,
  FileText,
  Users,
  Trophy,
  Zap,
  Settings,
  Maximize2,
  Download,
  Share,
  Moon,
  Sun,
  Monitor,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  RotateCcw,
  Save
} from 'lucide-react';

/**
 * 🚀 Página de Visualización Mejorada - OpositIA
 * Sistema completo de generación y gestión de visualizaciones educativas
 */
export default function EnhancedVisualizationPage() {
  const [currentView, setCurrentView] = useState<'workspace' | 'library' | 'community'>('workspace');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentVisualization, setCurrentVisualization] = useState<any>(null);
  const [processedDocuments, setProcessedDocuments] = useState<any[]>([]);
  const [selectedDocumentIndex, setSelectedDocumentIndex] = useState(0);
  const [showSidebar, setShowSidebar] = useState(true);
  const [theme, setTheme] = useState('system');

  const handleDocumentsProcessed = (documents: any[]) => {
    setProcessedDocuments(documents);
    if (documents.length > 0) {
      setSelectedDocumentIndex(0);
    }
  };

  const handleVisualizationGenerated = (data: any) => {
    setCurrentVisualization(data);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const navigateDocument = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && selectedDocumentIndex > 0) {
      setSelectedDocumentIndex(selectedDocumentIndex - 1);
    } else if (direction === 'next' && selectedDocumentIndex < processedDocuments.length - 1) {
      setSelectedDocumentIndex(selectedDocumentIndex + 1);
    }
  };

  const currentDocument = processedDocuments[selectedDocumentIndex];

  const getViewIcon = (view: string) => {
    switch (view) {
      case 'workspace': return <Brain className="h-4 w-4" />;
      case 'library': return <FileText className="h-4 w-4" />;
      case 'community': return <Users className="h-4 w-4" />;
    }
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light': return <Sun className="h-4 w-4" />;
      case 'dark': return <Moon className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  const cycleTheme = () => {
    const themes = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
    
    // Aplicar el tema al documento
    if (themes[nextIndex] === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (themes[nextIndex] === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // Tema sistema - detectar preferencia del OS
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  return (
    <>
      <Head>
        <title>🧠 Visualizador Inteligente - OpositIA</title>
        <meta name="description" content="Plataforma avanzada de visualización educativa con IA para estudiantes de oposiciones" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={cn(
        'min-h-screen bg-background transition-all duration-300 flex flex-col',
        isFullscreen && 'fixed inset-0 z-50'
      )}>
        {/* Header mejorado */}
        <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Logo y título */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-accent">
                    <Brain className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      Visualizador IA
                    </h1>
                    <p className="text-sm text-muted-foreground">OpositIA • Educación Avanzada</p>
                  </div>
                </div>

                {/* Navegador de documentos */}
                {processedDocuments.length > 0 && (
                  <div className="flex items-center gap-2 ml-8">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigateDocument('prev')}
                      disabled={selectedDocumentIndex === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    <div className="px-3 py-1 bg-muted rounded-md text-sm">
                      {selectedDocumentIndex + 1} de {processedDocuments.length}
                    </div>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigateDocument('next')}
                      disabled={selectedDocumentIndex === processedDocuments.length - 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    
                    {currentDocument && (
                      <div className="text-sm text-muted-foreground ml-2">
                        {currentDocument.name}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Controles globales */}
              <div className="flex items-center gap-2">
                {/* Selector de vista */}
                <div className="flex items-center bg-muted rounded-lg p-1">
                  {(['workspace', 'library', 'community'] as const).map((view) => (
                    <Button
                      key={view}
                      size="sm"
                      variant={currentView === view ? "primary" : "ghost"}
                      onClick={() => setCurrentView(view)}
                      className="flex items-center gap-2 capitalize"
                    >
                      {getViewIcon(view)}
                      <span className="hidden sm:inline">{view}</span>
                    </Button>
                  ))}
                </div>

                {/* Controles de tema y pantalla */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={cycleTheme}
                  title={`Cambiar a tema ${theme === 'light' ? 'oscuro' : theme === 'dark' ? 'sistema' : 'claro'}`}
                >
                  {getThemeIcon()}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowSidebar(!showSidebar)}
                >
                  {showSidebar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={toggleFullscreen}
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Barra de estadísticas rápidas */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-success animate-pulse"></div>
                  <span>IA Activa</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>{processedDocuments.length} documentos</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  <span>Precisión: 94%</span>
                </div>
              </div>

              {currentVisualization && (
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline">
                    <Save className="h-4 w-4 mr-1" />
                    Guardar
                  </Button>
                  <Button size="sm" variant="outline">
                    <Share className="h-4 w-4 mr-1" />
                    Compartir
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-1" />
                    Exportar
                  </Button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Contenido principal */}
        <div className={cn(
          'transition-all duration-300',
          isFullscreen 
            ? 'fixed inset-0 bg-background z-50' 
            : 'flex-1 h-[calc(100vh-140px)]' // Usar casi toda la altura del viewport
        )}>
          <div className={cn(
            'h-full transition-all duration-300',
            isFullscreen 
              ? 'p-0' 
              : 'px-4 py-2' // Padding mínimo para mejor aprovechamiento
          )}>
            <div className={cn(
              'h-full gap-4 transition-all duration-300',
              isFullscreen 
                ? 'grid grid-cols-1' 
                : showSidebar 
                  ? 'grid grid-cols-5' // Cambiar a 5 columnas para mejor distribución
                  : 'grid grid-cols-1'
            )}>
              
              {/* Panel lateral - MÁS COMPACTO */}
              {!isFullscreen && showSidebar && (
                <div className="col-span-1 space-y-4 overflow-y-auto h-full">
                  {currentView === 'workspace' && (
                    <DocumentProcessor
                      onDocumentsProcessed={handleDocumentsProcessed}
                      maxFiles={10}
                    />
                  )}
                  
                  <OpositiaIntegration
                    currentVisualization={currentVisualization}
                    onSaveToLibrary={(data) => console.log('Guardando en biblioteca:', data)}
                    onShareWithCommunity={(data) => console.log('Compartiendo:', data)}
                  />
                </div>
              )}

              {/* Panel principal de visualización - MUCHO MÁS GRANDE */}
              <div className={cn(
                'transition-all duration-300 h-full',
                isFullscreen 
                  ? 'col-span-1' 
                  : showSidebar 
                    ? 'col-span-4' // Usar 4 de 5 columnas = 80% del ancho
                    : 'col-span-1'
              )}>
                {currentDocument ? (
                  <VisualizationViewer
                    documentId={currentDocument.id}
                    content={currentDocument.content}
                    onVisualizationGenerated={handleVisualizationGenerated}
                    isFullscreen={isFullscreen}
                    onToggleFullscreen={toggleFullscreen}
                    onDownload={() => console.log('Descargando visualización')}
                    className="h-full w-full" // Usar toda la altura y anchura disponible
                  />
                ) : (
                  /* Estado vacío mejorado - TAMBIÉN MÁS GRANDE */
                  <Card className="h-full w-full flex items-center justify-center border-dashed border-2">
                    <CardContent className="text-center">
                      <div className="p-12 rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-success/10 mb-8">
                        <Brain className="h-20 w-20 text-primary mx-auto mb-6" />
                        <h3 className="text-3xl font-bold mb-4">
                          Bienvenido al Visualizador IA
                        </h3>
                        <p className="text-muted-foreground max-w-lg mx-auto text-lg">
                          Sube tus documentos de estudio y déjame crear mapas conceptuales, 
                          diagramas de flujo y esquemas jerárquicos automáticamente.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                        <div className="p-6 rounded-lg border bg-card/30 hover:bg-card/50 transition-colors">
                          <Network className="h-12 w-12 text-primary mx-auto mb-4" />
                          <div className="font-medium text-base mb-2">Mapas Conceptuales</div>
                          <div className="text-sm text-muted-foreground">
                            Conexiones entre ideas clave
                          </div>
                        </div>
                        
                        <div className="p-6 rounded-lg border bg-card/30 hover:bg-card/50 transition-colors">
                          <GitBranch className="h-12 w-12 text-accent mx-auto mb-4" />
                          <div className="font-medium text-base mb-2">Diagramas de Flujo</div>
                          <div className="text-sm text-muted-foreground">
                            Procesos paso a paso
                          </div>
                        </div>
                        
                        <div className="p-6 rounded-lg border bg-card/30 hover:bg-card/50 transition-colors">
                          <Layers className="h-12 w-12 text-success mx-auto mb-4" />
                          <div className="font-medium text-base mb-2">Esquemas Jerárquicos</div>
                          <div className="text-sm text-muted-foreground">
                            Estructuras organizadas
                          </div>
                        </div>
                      </div>

                      <div className="mt-10 p-6 rounded-lg bg-primary/5 border border-primary/20 max-w-2xl mx-auto">
                        <div className="flex items-center justify-center gap-2 text-primary mb-2">
                          <Sparkles className="h-5 w-5" />
                          <span className="font-medium text-base">Consejo:</span>
                        </div>
                        <p className="text-muted-foreground">
                          Para mejores resultados, usa documentos con estructura clara y contenido académico bien organizado.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer flotante con estadísticas */}
        {!isFullscreen && (
          <div className="fixed bottom-6 right-6 z-30">
            <Card className="bg-card/95 backdrop-blur-sm border shadow-lg">
              <CardContent className="p-3">
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-success"></div>
                    <span>Sistema operativo</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    <span>Rendimiento: 98%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    <span>IA: GPT-4</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Estilos adicionales */}
      <style jsx global>{`
        /* Optimización de viewport completo */
        html, body {
          height: 100vh;
          margin: 0;
          padding: 0;
          overflow-x: hidden;
        }

        #__next {
          height: 100vh;
          display: flex;
          flex-direction: column;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out;
        }

        /* Scrollbar personalizado */
        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: hsl(var(--muted));
        }

        ::-webkit-scrollbar-thumb {
          background: hsl(var(--muted-foreground));
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--primary));
        }
      `}</style>
    </>
  );
}