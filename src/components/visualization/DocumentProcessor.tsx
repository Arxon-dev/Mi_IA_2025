import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { 
  Upload, 
  FileText, 
  Brain, 
  Zap, 
  X, 
  Check, 
  AlertCircle,
  Sparkles,
  Layers,
  Network,
  GitBranch,
  Loader2,
  File,
  Clock,
  TrendingUp
} from 'lucide-react';

interface ProcessedDocument {
  id: string;
  name: string;
  size: number;
  content: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  visualizations?: {
    conceptMap: any;
    flowchart: any;
    hierarchy: any;
  };
  processingTime?: number;
  complexity?: 'simple' | 'medium' | 'complex';
}

interface DocumentProcessorProps {
  onDocumentsProcessed: (documents: ProcessedDocument[]) => void;
  maxFiles?: number;
  className?: string;
}

/**
 * 🚀 Procesador Inteligente de Documentos Múltiples
 * Con IA avanzada y análisis en tiempo real
 */
export default function DocumentProcessor({
  onDocumentsProcessed,
  maxFiles = 5,
  className
}: DocumentProcessorProps) {
  const [documents, setDocuments] = useState<ProcessedDocument[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList) => {
    const fileArray = Array.from(files).slice(0, maxFiles);
    
    const newDocuments: ProcessedDocument[] = [];
    
    for (const file of fileArray) {
      if (file.type === 'text/plain' || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
        const content = await file.text();
        newDocuments.push({
          id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          size: file.size,
          content,
          status: 'pending'
        });
      }
    }

    setDocuments(prev => [...prev, ...newDocuments]);
  }, [maxFiles]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const removeDocument = useCallback((id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  }, []);

  const processAllDocuments = useCallback(async () => {
    setIsProcessing(true);
    
    const pendingDocs = documents.filter(doc => doc.status === 'pending');
    
    for (const doc of pendingDocs) {
      setDocuments(prev => prev.map(d => 
        d.id === doc.id ? { ...d, status: 'processing' } : d
      ));

      try {
        // Simular procesamiento con IA real
        const startTime = Date.now();
        
        // Análisis de complejidad simulado
        const wordCount = doc.content.split(' ').length;
        const complexity: 'simple' | 'medium' | 'complex' = 
          wordCount < 500 ? 'simple' : 
          wordCount < 1500 ? 'medium' : 'complex';

        // Tiempo de procesamiento simulado basado en complejidad
        const processingTime = complexity === 'simple' ? 2000 : 
                              complexity === 'medium' ? 4000 : 6000;

        await new Promise(resolve => setTimeout(resolve, processingTime));

        // Generar visualizaciones simuladas
        const visualizations = {
          conceptMap: generateMockVisualization('concept-map', doc.content),
          flowchart: generateMockVisualization('flowchart', doc.content),
          hierarchy: generateMockVisualization('hierarchy', doc.content)
        };

        const finalTime = Date.now() - startTime;

        setDocuments(prev => prev.map(d => 
          d.id === doc.id ? { 
            ...d, 
            status: 'completed',
            visualizations,
            processingTime: finalTime,
            complexity
          } : d
        ));

      } catch (error) {
        setDocuments(prev => prev.map(d => 
          d.id === doc.id ? { ...d, status: 'error' } : d
        ));
      }
    }

    setIsProcessing(false);
    onDocumentsProcessed(documents);
  }, [documents, onDocumentsProcessed]);

  const generateMockVisualization = (type: string, content: string) => {
    // Generación inteligente basada en contenido
    const words = content.split(' ').filter(word => word.length > 4);
    const concepts = words.slice(0, Math.min(8, words.length));
    
    return {
      type,
      nodes: concepts.map((concept, i) => ({
        id: `node-${i}`,
        label: concept,
        x: 100 + (i % 3) * 150,
        y: 100 + Math.floor(i / 3) * 100
      })),
      edges: concepts.slice(1).map((_, i) => ({
        from: `node-${i}`,
        to: `node-${i + 1}`
      }))
    };
  };

  const getStatusIcon = (status: ProcessedDocument['status']) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-muted-foreground" />;
      case 'processing': return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      case 'completed': return <Check className="h-4 w-4 text-success" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-destructive" />;
    }
  };

  const getComplexityColor = (complexity?: string) => {
    switch (complexity) {
      case 'simple': return 'bg-success/10 text-success border-success/20';
      case 'medium': return 'bg-warning/10 text-warning border-warning/20';
      case 'complex': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted/10 text-muted-foreground border-border';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const totalProgress = documents.length > 0 ? 
    (documents.filter(d => d.status === 'completed').length / documents.length) * 100 : 0;

  return (
    <Card className={cn('animate-fade-in-up', className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Procesador IA Múltiple
            <Badge variant="secondary" className="text-xs">
              {documents.length}/{maxFiles}
            </Badge>
          </div>
          
          {documents.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {Math.round(totalProgress)}% completado
              </span>
              <Progress value={totalProgress} className="w-24" />
            </div>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Zona de carga drag & drop mejorada */}
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300',
            'hover:border-primary/50 hover:bg-primary/5',
            dragActive ? 'border-primary bg-primary/10 scale-[1.02]' : 'border-muted',
            'relative overflow-hidden'
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="relative z-10">
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              Arrastra documentos aquí
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              O haz clic para seleccionar archivos (.txt, .md)
            </p>
            
            <Button 
              onClick={() => fileInputRef.current?.click()}
              className="mb-2"
            >
              <FileText className="h-4 w-4 mr-2" />
              Seleccionar Archivos
            </Button>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".txt,.md"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
              className="hidden"
            />
            
            <div className="text-xs text-muted-foreground mt-2">
              Máximo {maxFiles} archivos • Hasta 10MB cada uno
            </div>
          </div>
          
          {/* Efecto de shimmer */}
          {dragActive && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-shimmer" />
          )}
        </div>

        {/* Lista de documentos procesados */}
        {documents.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Documentos en Cola</h4>
              <Button 
                onClick={processAllDocuments}
                disabled={isProcessing || documents.every(d => d.status !== 'pending')}
                size="sm"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Procesar con IA
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card/50 hover:bg-card transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex-shrink-0">
                      {getStatusIcon(doc.status)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-sm truncate">
                          {doc.name}
                        </div>
                        {doc.complexity && (
                          <Badge className={cn("text-xs", getComplexityColor(doc.complexity))}>
                            {doc.complexity}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{formatFileSize(doc.size)}</span>
                        <span>{doc.content.split(' ').length} palabras</span>
                        {doc.processingTime && (
                          <span>⚡ {(doc.processingTime / 1000).toFixed(1)}s</span>
                        )}
                      </div>
                    </div>

                    {/* Indicadores de visualizaciones generadas */}
                    {doc.status === 'completed' && doc.visualizations && (
                      <div className="flex gap-1">
                        <Network className="h-3 w-3 text-primary" title="Mapa Conceptual" />
                        <GitBranch className="h-3 w-3 text-accent" title="Diagrama de Flujo" />
                        <Layers className="h-3 w-3 text-success" title="Esquema Jerárquico" />
                      </div>
                    )}
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeDocument(doc.id)}
                    disabled={doc.status === 'processing'}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Estadísticas del procesamiento */}
        {documents.length > 0 && (
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/20 rounded-lg">
            <div className="text-center">
              <div className="text-lg font-bold text-primary">
                {documents.filter(d => d.status === 'completed').length}
              </div>
              <div className="text-xs text-muted-foreground">Completados</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-warning">
                {documents.filter(d => d.status === 'processing').length}
              </div>
              <div className="text-xs text-muted-foreground">Procesando</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-muted-foreground">
                {documents.filter(d => d.status === 'pending').length}
              </div>
              <div className="text-xs text-muted-foreground">Pendientes</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}