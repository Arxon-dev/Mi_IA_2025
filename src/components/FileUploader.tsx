'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  FileText, 
  File, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface FileUploaderProps {
  onFileUpload: (file: File) => void;
  isLoading?: boolean;
  acceptedFormats?: string[];
  maxSize?: number;
  title?: string;
  description?: string;
  className?: string;
  showPreview?: boolean;
}

export function FileUploader({ 
  onFileUpload, 
  isLoading = false,
  acceptedFormats = ['md', 'markdown', 'txt'],
  maxSize = 50 * 1024 * 1024, // 50MB por defecto
  title = "Subir documento",
  description = "Arrastra y suelta tu archivo aquí, o haz clic para seleccionar",
  className,
  showPreview = true
}: FileUploaderProps) {
  const [error, setError] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (['md', 'markdown'].includes(extension || '')) {
      return <FileText className="w-8 h-8 text-primary" />;
    }
    if (['txt'].includes(extension || '')) {
      return <File className="w-8 h-8 text-muted-foreground" />;
    }
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) {
      return <ImageIcon className="w-8 h-8 text-blue-500" />;
    }
    return <File className="w-8 h-8 text-muted-foreground" />;
  };

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    try {
      // Manejar archivos rechazados
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.errors.some((e: any) => e.code === 'file-too-large')) {
          setError(`El archivo es demasiado grande. Tamaño máximo: ${formatFileSize(maxSize)}`);
        } else if (rejection.errors.some((e: any) => e.code === 'file-invalid-type')) {
          setError(`Formato no válido. Acepta: ${acceptedFormats.map(f => `.${f}`).join(', ')}`);
        } else {
          setError('Error al procesar el archivo');
        }
        return;
      }

      const file = acceptedFiles[0];
      if (!file) {
        setError('Por favor, selecciona un archivo.');
        return;
      }

      // Validación adicional del tamaño
      if (file.size > maxSize) {
        setError(`El archivo es demasiado grande. Tamaño máximo: ${formatFileSize(maxSize)}`);
        return;
      }

      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      // Verificamos la extensión del archivo
      if (acceptedFormats.includes(fileExtension || '')) {
        setError('');
        setUploadedFile(file);
        onFileUpload(file);
      } else {
        setError(`Formato no válido. Acepta: ${acceptedFormats.map(f => `.${f}`).join(', ')}`);
      }
    } catch (err) {
      console.error('Error al procesar el archivo:', err);
      setError('Error al procesar el archivo. Por favor, inténtalo de nuevo.');
    }
  }, [onFileUpload, maxSize, acceptedFormats]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFormats.reduce((acc, format) => {
      if (['md', 'markdown'].includes(format)) {
        acc['text/markdown'] = ['.md', '.markdown'];
      }
      if (format === 'txt') {
        acc['text/plain'] = ['.txt'];
      }
      return acc;
    }, {} as any),
    multiple: false,
    disabled: isLoading,
    maxSize,
    onError: (err) => {
      console.error('Error en Dropzone:', err);
      setError('Error al procesar el archivo. Por favor, inténtalo de nuevo.');
    }
  });

  const clearFile = () => {
    setUploadedFile(null);
    setError('');
  };

  return (
    <div className={cn("space-y-4", className)}>
      <Card className={cn(
        "transition-all duration-200 hover:shadow-md",
        isDragActive && "ring-2 ring-primary ring-offset-2 shadow-lg",
        isLoading && "opacity-75"
      )}>
        <CardContent className="p-0">
          <div
            {...getRootProps()}
            className={cn(
              "relative p-8 text-center cursor-pointer transition-all duration-200 rounded-lg",
              isDragActive 
                ? "bg-primary/5 border-primary/20" 
                : "hover:bg-muted/50",
              isLoading && "cursor-not-allowed"
            )}
          >
            <input {...getInputProps()} />
            
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex flex-col items-center space-y-3">
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-foreground">Procesando archivo...</h3>
                    <p className="text-sm text-muted-foreground">Por favor espera mientras procesamos tu archivo</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-center">
                    <div className={cn(
                      "p-4 rounded-full transition-colors",
                      isDragActive 
                        ? "bg-primary/10 text-primary" 
                        : "bg-muted text-muted-foreground"
                    )}>
                      <Upload className="w-8 h-8" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      {isDragActive ? "Suelta el archivo aquí" : title}
                    </h3>
                    <p className="text-muted-foreground">
                      {isDragActive 
                        ? "Suelta para subir el archivo" 
                        : description
                      }
                    </p>
                  </div>

                  <div className="flex flex-wrap justify-center gap-2">
                    {acceptedFormats.map((format) => (
                      <Badge key={format} variant="secondary" className="text-xs">
                        .{format}
                      </Badge>
                    ))}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Tamaño máximo: {formatFileSize(maxSize)}
                  </p>

                  {!isDragActive && (
                    <div className="pt-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                        Seleccionar archivo
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview del archivo subido */}
      {showPreview && uploadedFile && !isLoading && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                {getFileIcon(uploadedFile)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium text-foreground truncate">
                      {uploadedFile.name}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(uploadedFile.size)}
                    </p>
                  </div>
                  <button
                    onClick={clearFile}
                    className="p-1 rounded-full hover:bg-muted transition-colors"
                    title="Quitar archivo"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span className="text-xs text-success font-medium">
                    Archivo cargado correctamente
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mensaje de error */}
      {error && (
        <Alert variant="error">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Información adicional */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>💡 <strong>Recomendación:</strong> Usa archivos Markdown (.md) para mejor formato del texto</p>
        <p>📝 Los archivos de texto plano (.txt) también son compatibles</p>
      </div>
    </div>
  );
} 