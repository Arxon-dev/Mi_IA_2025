'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, AlertCircle, Loader2, FileText, CheckCircle, Shield } from 'lucide-react';
import { StorageService } from '@/services/storageService';
import type { StoredDocument } from '@/services/storageService';
import { DocumentSectionService } from '@/services/documentSectionService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [success, setSuccess] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [detectedDocumentType, setDetectedDocumentType] = useState<string | null>(null);
  const [sectionsExtracted, setSectionsExtracted] = useState<number>(0);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  }, []);

  const validateAndSetFile = (file: File) => {
    // Validar tipo de archivo
    const validTypes = [
      'text/plain',
      'text/markdown',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    // Validar por extensión también
    const validExtensions = ['.txt', '.md', '.markdown', '.pdf', '.docx'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      setError('Tipo de archivo no soportado. Por favor, sube un archivo .txt, .md, .markdown, .pdf o .docx');
      return;
    }

    // Validar tamaño (máximo 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB en bytes
    if (file.size > maxSize) {
      setError('El archivo es demasiado grande. El tamaño máximo permitido es 50MB');
      return;
    }

    setFile(file);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setLoading(true);
      setError(null);
      setProcessingStatus('Leyendo archivo...');
      setDetectedDocumentType(null);
      setSectionsExtracted(0);

      const content = await readFileContent(file);
      
      // Determinar el tipo de documento basado en la extensión
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      let documentType = 'text/plain';
      
      switch (fileExtension) {
        case 'md':
        case 'markdown':
          documentType = 'text/markdown';
          break;
        case 'pdf':
          documentType = 'application/pdf';
          break;
        case 'docx':
          documentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          break;
        default:
          documentType = 'text/plain';
      }

      // Crear documento base
      const document: StoredDocument = {
        id: crypto.randomUUID(),
        title: file.name,
        content,
        date: new Date(),
        type: documentType,
        questionCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        processingTime: null,
        tokens: null
      };

      setProcessingStatus('Analizando tipo de documento...');
      
      // 🎯 DETECCIÓN AUTOMÁTICA DE TIPO DE DOCUMENTO
      const isPDC01 = DocumentSectionService.detectPDC01Document(content);
      const isMilitary = DocumentSectionService.detectMilitaryDoctrine(content);
      
      if (isPDC01) {
        setDetectedDocumentType('PDC-01 B Doctrina para el empleo de las FAS');
        setProcessingStatus('📋 Documento PDC-01 detectado - Aplicando procesamiento específico...');
      } else if (isMilitary) {
        setDetectedDocumentType('Documento de Doctrina Militar');
        setProcessingStatus('🪖 Documento militar detectado - Aplicando procesamiento especializado...');
      } else {
        setDetectedDocumentType('Documento estándar');
        setProcessingStatus('📄 Aplicando procesamiento estándar...');
      }

      // 🚀 PROCESAMIENTO INTELIGENTE AUTOMÁTICO
      let processedDocument: StoredDocument;
      let extractedSections = 0;
      
      if (isPDC01 || isMilitary) {
        // Usar procesamiento inteligente para documentos militares
        setProcessingStatus('⚙️ Procesando con sistema de doctrina militar...');
        processedDocument = await DocumentSectionService.smartProcessDocument(document);
        
        // Extraer secciones para mostrar estadísticas
        setProcessingStatus('📑 Extrayendo apartados específicos...');
        const sections = DocumentSectionService.extractSections(processedDocument);
        extractedSections = sections.length;
        setSectionsExtracted(extractedSections);
        
        setProcessingStatus('✅ Procesamiento militar completado');
      } else {
        // Procesamiento estándar para otros documentos
        setProcessingStatus('📝 Guardando documento...');
        processedDocument = document;
      }

      // Guardar el documento procesado
      await StorageService.saveDocument(processedDocument);
      
      setSuccess(true);
      setProcessingStatus('🎉 ¡Documento subido y procesado exitosamente!');
      
      // Redirigir después de 3 segundos (más tiempo para mostrar los resultados)
      setTimeout(() => {
        router.push('/documents');
      }, 3000);
      
    } catch (error) {
      console.error('Error al subir el documento:', error);
      setError('Error al subir el documento. Por favor, inténtalo de nuevo.');
      setProcessingStatus('');
    } finally {
      setLoading(false);
    }
  };

  const readFileContent = async (file: File): Promise<string> => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    try {
      switch (fileExtension) {
        case 'pdf':
          // Para PDFs, usar pdfjs-dist que funciona en el navegador
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
              try {
                const arrayBuffer = e.target?.result as ArrayBuffer;
                if (!arrayBuffer) {
                  reject(new Error('No se pudo leer el archivo PDF'));
                  return;
                }
                
                // Importar pdfjs-dist dinámicamente
                const pdfjsLib = await import('pdfjs-dist');
                
                // Configurar el worker de PDF.js - primero local, luego CDN como fallback
                const workerUrls = [
                  '/js/pdf.worker.min.mjs', // Worker local en carpeta public
                  `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`,
                  `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
                ];
                
                // Usar la primera URL (local) por defecto
                pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrls[0];
                
                const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
                const pdf = await loadingTask.promise;
                
                let fullText = '';
                
                // Extraer texto de todas las páginas
                for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                  const page = await pdf.getPage(pageNum);
                  const textContent = await page.getTextContent();
                  const pageText = textContent.items
                    .map((item: any) => item.str)
                    .join(' ');
                  fullText += pageText + '\n';
                }
                
                if (!fullText.trim()) {
                  reject(new Error('El PDF no contiene texto extraíble. Puede ser un PDF escaneado o con imágenes.'));
                  return;
                }
                
                resolve(fullText.trim());
              } catch (error) {
                console.error('Error al procesar PDF:', error);
                reject(new Error('Error al extraer texto del PDF. Asegúrate de que el PDF contiene texto seleccionable.'));
              }
            };
            
            reader.onerror = () => {
              reject(new Error('Error al leer el archivo PDF'));
            };
            
            reader.readAsArrayBuffer(file);
          });
          
        case 'docx':
          // Para archivos DOCX, usar mammoth
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
              try {
                const arrayBuffer = e.target?.result as ArrayBuffer;
                if (!arrayBuffer) {
                  reject(new Error('No se pudo leer el archivo DOCX'));
                  return;
                }
                
                // Importar mammoth dinámicamente
                const mammoth = await import('mammoth');
                const result = await mammoth.extractRawText({ arrayBuffer });
                resolve(result.value);
              } catch (error) {
                console.error('Error al procesar DOCX:', error);
                reject(new Error('Error al extraer texto del archivo DOCX.'));
              }
            };
            
            reader.onerror = () => {
              reject(new Error('Error al leer el archivo DOCX'));
            };
            
            reader.readAsArrayBuffer(file);
          });
          
        default:
          // Para archivos de texto (.txt, .md, .markdown)
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
              const content = e.target?.result;
              if (typeof content === 'string') {
                resolve(content);
              } else {
                reject(new Error('Error al leer el contenido del archivo'));
              }
            };
            
            reader.onerror = () => {
              reject(new Error('Error al leer el archivo'));
            };
            
            reader.readAsText(file, 'UTF-8');
          });
      }
    } catch (error) {
      throw new Error(`Error al procesar el archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  const getFileType = (mimeType: string): string => {
    switch (mimeType) {
      case 'text/plain':
        return 'txt';
      case 'text/markdown':
        return 'md';
      case 'application/pdf':
        return 'pdf';
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return 'docx';
      default:
        // Si el tipo MIME no está definido, intentar obtener la extensión del nombre del archivo
        return file?.name.split('.').pop()?.toLowerCase() || 'unknown';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        {/* Header */}
        <div className="space-y-2 mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Subir Documento</h1>
          <p className="text-muted-foreground">
            Sube un documento para generar preguntas de examen automáticamente con IA
          </p>
        </div>

        {/* Success State */}
        {success && (
          <Alert variant="success" className="mb-6">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>¡Documento subido exitosamente!</AlertTitle>
            <AlertDescription>
              Serás redirigido a la página de documentos en unos segundos...
            </AlertDescription>
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="error" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Processing Status Card */}
        {loading && processingStatus && (
          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                <div className="flex-1">
                  <p className="font-medium text-foreground">{processingStatus}</p>
                  {detectedDocumentType && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Tipo detectado: {detectedDocumentType}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detection Results Card */}
        {success && detectedDocumentType && (
          <Card className="mb-6 border-success/20 bg-success/5">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                {detectedDocumentType.includes('PDC-01') ? (
                  <Shield className="w-5 h-5 text-success mt-0.5" />
                ) : detectedDocumentType.includes('Militar') ? (
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                ) : (
                  <FileText className="w-5 h-5 text-success mt-0.5" />
                )}
                <div className="flex-1">
                  <h4 className="font-medium text-foreground">
                    Procesamiento completado exitosamente
                  </h4>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Tipo de documento:</span> {detectedDocumentType}
                    </p>
                    {sectionsExtracted > 0 && (
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Apartados extraídos:</span> {sectionsExtracted} secciones específicas
                      </p>
                    )}
                    {detectedDocumentType.includes('PDC-01') && (
                      <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          🎯 <strong>Sistema PDC-01 activado:</strong> Se ha aplicado procesamiento específico para 
                          el documento "Doctrina para el empleo de las FAS" con apartados predefinidos.
                        </p>
                      </div>
                    )}
                    {detectedDocumentType.includes('Militar') && !detectedDocumentType.includes('PDC-01') && (
                      <div className="mt-2 p-2 bg-green-50 dark:bg-green-950/30 rounded-lg">
                        <p className="text-xs text-green-700 dark:text-green-300">
                          🪖 <strong>Sistema militar activado:</strong> Se ha aplicado procesamiento especializado 
                          para documentos de doctrina militar con estructura jerárquica.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          {/* Main Upload Card */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-12 text-center transition-all duration-200",
                  dragOver 
                    ? "border-primary bg-primary/5 scale-[1.02]" 
                    : "border-border hover:border-primary/50 hover:bg-accent/5",
                  file && "border-success bg-success/5"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="space-y-6">
                  {/* Upload Icon */}
                  <div className={cn(
                    "mx-auto w-16 h-16 rounded-full flex items-center justify-center transition-colors duration-200",
                    dragOver 
                      ? "bg-primary/10 text-primary" 
                      : file 
                        ? "bg-success/10 text-success"
                        : "bg-muted text-muted-foreground"
                  )}>
                    {file ? (
                      <CheckCircle className="w-8 h-8" />
                    ) : (
                      <Upload className="w-8 h-8" />
                    )}
                  </div>

                  {/* Upload Text */}
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-foreground">
                      {file ? '¡Archivo seleccionado!' : 'Arrastra tu documento aquí'}
                    </h3>
                    <p className="text-muted-foreground">
                      {file ? (
                        <>Listo para procesar: <span className="font-medium">{file.name}</span></>
                      ) : (
                        <>
                          o{' '}
                          <label
                            htmlFor="file-upload"
                            className="text-primary hover:text-primary/80 cursor-pointer font-medium underline underline-offset-4"
                          >
                            selecciona un archivo
                          </label>
                          {' '}desde tu dispositivo
                        </>
                      )}
                    </p>
                  </div>

                  {/* File Input */}
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept=".txt,.md,.markdown,.pdf,.docx"
                    onChange={handleFileChange}
                    disabled={loading}
                  />

                  {/* File Details */}
                  {file && (
                    <div className="bg-muted/50 rounded-lg p-4 max-w-md mx-auto">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-success/10 rounded-lg">
                          <FileText className="w-4 h-4 text-success" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium text-foreground text-sm truncate">
                            {file.name}
                          </p>
                          <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                            <span>{formatFileSize(file.size)}</span>
                            <Badge variant="outline" className="text-xs">
                              {getFileType(file.type).toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upload Button */}
          {file && (
            <div className="flex justify-center">
              <Button
                onClick={handleUpload}
                disabled={loading}
                size="lg"
                className="w-full sm:w-auto min-w-[200px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Procesando documento...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Subir y procesar
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-primary" />
                <span>Sistema de Procesamiento Inteligente</span>
              </CardTitle>
              <CardDescription>
                Detección automática y procesamiento especializado para documentos militares
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-blue-600" />
                    <span>Detección Automática</span>
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">PDC-01</Badge>
                      <span className="text-sm text-muted-foreground">Doctrina para el empleo de las FAS</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">Militar</Badge>
                      <span className="text-sm text-muted-foreground">Documentos de doctrina militar</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">Estándar</Badge>
                      <span className="text-sm text-muted-foreground">Otros documentos</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-foreground">Formatos admitidos</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">TXT</Badge>
                      <span className="text-sm text-muted-foreground">Archivo de texto plano</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">MD</Badge>
                      <span className="text-sm text-muted-foreground">Archivo Markdown</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">PDF</Badge>
                      <span className="text-sm text-muted-foreground">Documento PDF</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">DOCX</Badge>
                      <span className="text-sm text-muted-foreground">Documento Word</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground">Características especiales</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Procesamiento PDC-01 con 30+ apartados específicos</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Extracción de capítulos y secciones numeradas</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      <span>Detección de párrafos numerados secuenciales</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-orange-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Tamaño máximo: 50MB</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
