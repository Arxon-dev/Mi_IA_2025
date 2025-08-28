'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  Search, 
  Plus, 
  Clock, 
  Filter, 
  FolderOpen,
  Grid,
  List,
  Eye,
  Download,
  Trash2,
  AlertCircle,
  CheckCircle,
  X,
  SortDesc,
  ArrowDown,
  ArrowUp,
  Grid2X2,
  Loader2
} from 'lucide-react';
import { StorageService } from '@/services/storageService';

// Interfaces de tipo
interface Document {
  id: string;
  title: string;
  type: 'legal' | 'military' | 'technical' | 'general';
  date: string;
  questionCount: number;
  fileSize: string;
  excerpt: string;
  status: 'completed' | 'processing' | 'error';
}

export default function DocumentsPage() {
  // Estados para gestionar documentos y filtros
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'questions'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDocuments() {
      try {
        setLoading(true);
        const storedDocuments = await StorageService.getDocuments();
        
        if (storedDocuments.length > 0) {
          const mappedDocuments: Document[] = storedDocuments.map(doc => {
            // Determinar tipo basado en el nombre del archivo o contenido
            let type: 'legal' | 'military' | 'technical' | 'general' = 'general';
            const lowerTitle = doc.title.toLowerCase();
            
            if (lowerTitle.includes('ley') || lowerTitle.includes('legal') || 
                lowerTitle.includes('jurídico') || lowerTitle.includes('normativa') ||
                lowerTitle.includes('estatuto')) {
              type = 'legal';
            } else if (lowerTitle.includes('militar') || lowerTitle.includes('táctica') || 
                     lowerTitle.includes('arma') || lowerTitle.includes('defensa')) {
              type = 'military';  
            } else if (lowerTitle.includes('técnico') || lowerTitle.includes('manual') || 
                     lowerTitle.includes('procedimiento')) {
              type = 'technical';
            }
            
            // Generar un extracto del contenido
            const excerpt = doc.content 
              ? doc.content.slice(0, 150) + (doc.content.length > 150 ? '...' : '')
              : 'Sin contenido disponible';
              
            // Determinar el tamaño de archivo
            const contentSize = doc.content ? new Blob([doc.content]).size : 0;
            let fileSize = '';
            
            if (contentSize < 1024) {
              fileSize = `${contentSize} B`;
            } else if (contentSize < 1024 * 1024) {
              fileSize = `${(contentSize / 1024).toFixed(1)} KB`;
            } else {
              fileSize = `${(contentSize / (1024 * 1024)).toFixed(1)} MB`;
            }
            
            return {
              id: doc.id,
              title: doc.title,
              type,
              date: new Date(doc.date).toISOString(),
              questionCount: doc.questionCount || 0,
              fileSize,
              excerpt,
              status: 'completed' as const
            };
          });
          
          setDocuments(mappedDocuments);
          setFilteredDocuments(mappedDocuments);
        }
      } catch (err) {
        console.error('Error al cargar documentos:', err);
        setError('Error al cargar los documentos');
      } finally {
        setLoading(false);
      }
    }

    loadDocuments();
  }, []);

  // Filtrar y ordenar documentos cuando cambian los criterios
  useEffect(() => {
    let filtered = [...documents];
    
    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filtrar por tipo
    if (selectedType) {
      filtered = filtered.filter(doc => doc.type === selectedType);
    }
    
    // Ordenar resultados
    filtered.sort((a, b) => {
      if (sortOrder === 'newest') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (sortOrder === 'oldest') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      } else { // 'questions'
        return b.questionCount - a.questionCount;
      }
    });
    
    setFilteredDocuments(filtered);
  }, [documents, searchTerm, selectedType, sortOrder]);

  // Funciones de manejo
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDeleteDocument = (id: string) => {
    setDocumentToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (documentToDelete) {
      // Eliminar del almacenamiento
      StorageService.deleteDocument(documentToDelete);
      
      // Actualizar estado
      setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== documentToDelete));
      setShowDeleteModal(false);
      setDeleteSuccess(true);
      
      // Incrementar el trigger para forzar la recarga de documentos
      setRefreshTrigger(prev => prev + 1);
      
      // Ocultar mensaje de éxito después de 3 segundos
      setTimeout(() => setDeleteSuccess(false), 3000);
    }
  };

  const getTypeInfo = (type: string) => {
    switch (type) {
      case 'legal':
        return { color: 'bg-blue-100 text-blue-800', label: 'Legal' };
      case 'military':
        return { color: 'bg-green-100 text-green-800', label: 'Militar' };
      case 'technical':
        return { color: 'bg-purple-100 text-purple-800', label: 'Técnico' };
      default:
        return { color: 'bg-gray-100 text-gray-800', label: 'General' };
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          text: 'Completado',
          color: 'text-green-600',
          icon: <CheckCircle className="h-4 w-4 mr-1" />
        };
      case 'processing':
        return {
          text: 'Procesando',
          color: 'text-amber-600',
          icon: <Clock className="h-4 w-4 mr-1 animate-pulse" />
        };
      case 'error':
        return {
          text: 'Error',
          color: 'text-red-600',
          icon: <AlertCircle className="h-4 w-4 mr-1" />
        };
      default:
        return {
          text: 'Desconocido',
          color: 'text-gray-600',
          icon: <AlertCircle className="h-4 w-4 mr-1" />
        };
    }
  };

  const handleDownloadQuestions = async (id: string, title: string) => {
    try {
      // Obtener preguntas desde el servicio de almacenamiento
      const response = await StorageService.getQuestionsForDocument(id);
      
      if (!response || !response.questions || response.questions.length === 0) {
        console.error('No se encontraron preguntas para este documento');
        return;
      }
      
      // Convertir preguntas a texto
      const questionsText = response.questions.map(q => q.content).join('\n\n');
      
      // Crear un blob con el texto
      const blob = new Blob([questionsText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      // Crear un elemento para descargar
      const a = document.createElement('a');
      a.href = url;
      a.download = `Preguntas_${title.replace(/\s+/g, '_')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al descargar preguntas:', error);
    }
  };

  // Renderizar vista de grid
  const renderGridView = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocuments.map(doc => (
          <div key={doc.id} className="card border border-border overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-4 border-b border-border">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-secondary text-primary rounded-md">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-medium text-card-foreground line-clamp-1">{doc.title}</h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{formatDate(doc.date)}</span>
                      <span>•</span>
                      <span>{doc.fileSize}</span>
                    </div>
                  </div>
                </div>
                <div className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
                  {getTypeInfo(doc.type).label}
                </div>
              </div>
              <div className="flex items-center mt-2 text-xs text-muted-foreground">
                {getStatusInfo(doc.status).icon}
                <span>{getStatusInfo(doc.status).text}</span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{doc.excerpt}</p>
            </div>
            <div className="p-4 bg-muted flex justify-between items-center">
              {doc.status === 'completed' ? (
                <div className="flex items-center gap-1">
                  <span className="text-lg font-semibold text-card-foreground">{doc.questionCount}</span>
                  <span className="text-xs text-muted-foreground">preguntas</span>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">
                  {doc.status === 'processing' ? 'Procesando...' : 'Sin preguntas'}
                </div>
              )}
              <div className="flex gap-1">
                {doc.status === 'completed' && (
                  <>
                    <Link 
                      href={`/documents/${doc.id}`}
                      className="btn-secondary p-1.5 !py-1 !px-2 text-sm"
                      title="Ver documento"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    <button 
                      className="btn-primary p-1.5 !py-1 !px-2 text-sm"
                      title="Descargar preguntas"
                      onClick={() => handleDownloadQuestions(doc.id, doc.title)}
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </>
                )}
                <button 
                  className="btn-secondary p-1.5 !py-1 !px-2 text-sm border-red-200 text-red-600 hover:bg-red-50"
                  title="Eliminar documento"
                  onClick={() => handleDeleteDocument(doc.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {/* Tarjeta para añadir nuevo documento */}
        <Link 
          href="/upload" 
          className="flex flex-col items-center justify-center p-6 card border border-dashed border-border hover:border-primary hover:bg-secondary transition-colors text-center"
        >
          <div className="p-3 bg-primary/10 text-primary rounded-full mb-3">
            <Plus className="h-6 w-6" />
          </div>
          <h3 className="font-medium text-card-foreground mb-1">Cargar Nuevo Documento</h3>
          <p className="text-sm text-muted-foreground">Añadir un nuevo documento para generar preguntas</p>
        </Link>
      </div>
    );
  };

  // Renderizar vista de lista
  const renderListView = () => {
    return (
      <div className="card border border-border overflow-hidden">
        <div className="divide-y divide-border">
          {filteredDocuments.map(doc => (
            <div key={doc.id} className="p-4 hover:bg-muted transition-colors duration-150">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-secondary text-primary rounded-md">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-medium text-card-foreground">{doc.title}</h3>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span>{formatDate(doc.date)}</span>
                      <span>•</span>
                      <span>{doc.fileSize}</span>
                      <div className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
                        {getTypeInfo(doc.type).label}
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        {getStatusInfo(doc.status).icon}
                        <span>{getStatusInfo(doc.status).text}</span>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-1">
                      {doc.excerpt}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {doc.status === 'completed' && (
                    <>
                      <Link
                        href={`/documents/${doc.id}`}
                        className="btn-secondary p-2 text-sm"
                        title="Ver documento"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <button 
                        className="btn-primary p-2 text-sm"
                        title="Descargar preguntas"
                        onClick={() => handleDownloadQuestions(doc.id, doc.title)}
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  <button 
                    className="btn-secondary p-2 text-sm border-red-200 text-red-600 hover:bg-red-50"
                    title="Eliminar documento"
                    onClick={() => handleDeleteDocument(doc.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {/* Fila para añadir nuevo documento */}
          <Link
            href="/upload"
            className="p-4 flex items-center gap-3 hover:bg-secondary transition-colors duration-150"
          >
            <div className="p-2 bg-primary/10 text-primary rounded-md">
              <Plus className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-medium text-primary">Cargar Nuevo Documento</h3>
              <p className="text-sm text-muted-foreground">Añadir un nuevo documento para generar preguntas</p>
            </div>
          </Link>
        </div>
      </div>
    );
  };

  return (
    // Loader visual mientras loading es true
    loading ? (
      <div className="flex flex-col items-center justify-center min-h-[300px] p-4 text-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p>Cargando documentos...</p>
      </div>
    ) : (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Mis Documentos</h1>
          <p className="text-white mt-1">
            Gestiona y visualiza tus documentos procesados
          </p>
        </div>

        {/* Alerta de eliminación exitosa */}
        {deleteSuccess && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-800 flex items-start gap-2 animate-fadeIn">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p>El documento ha sido eliminado correctamente.</p>
          </div>
        )}

        {/* Filtros y barra de herramientas */}
        <div className="bg-card rounded-lg shadow-sm border border-border p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Buscador */}
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-muted-foreground" />
              </div>
              <input
                type="text"
                className="input pl-10 pr-3 py-2"
                placeholder="Buscar documento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filtro por tipo */}
            <div className="flex-shrink-0">
              <div className="relative inline-block w-full md:w-auto">
                <div className="flex">
                  <div className="flex items-center px-3 border border-r-0 border-border bg-muted text-muted-foreground rounded-l-md">
                    <Filter className="h-4 w-4" />
                  </div>
                  <select
                    className="input rounded-l-none pl-3 pr-10 py-2 text-base border-l-0"
                    value={selectedType || ''}
                    onChange={(e) => setSelectedType(e.target.value || null)}
                  >
                    <option value="">Todos los tipos</option>
                    <option value="legal">Legal</option>
                    <option value="military">Militar</option>
                    <option value="technical">Técnico</option>
                    <option value="general">General</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Ordenar por */}
            <div className="flex-shrink-0">
              <div className="relative inline-block w-full md:w-auto">
                <div className="flex">
                  <div className="flex items-center px-3 border border-r-0 border-border bg-muted text-muted-foreground rounded-l-md">
                    <SortDesc className="h-4 w-4" />
                  </div>
                  <select
                    className="input rounded-l-none pl-3 pr-10 py-2 text-base border-l-0"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest' | 'questions')}
                  >
                    <option value="newest">Más recientes</option>
                    <option value="oldest">Más antiguos</option>
                    <option value="questions">Más preguntas</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Cambiar vista */}
            <div className="flex ml-auto">
              <button
                className={`btn-secondary p-2 rounded-l-md border-r-0 ${viewMode === 'grid' ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Vista en cuadrícula"
              >
                <Grid className="h-5 w-5" />
              </button>
              <button
                className={`btn-secondary p-2 rounded-r-md border-l-0 ${viewMode === 'list' ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setViewMode('list')}
                title="Vista en lista"
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Lista de documentos */}
        {filteredDocuments.length > 0 ? (
          viewMode === 'grid' ? renderGridView() : renderListView()
        ) : (
          <div className="bg-card rounded-lg border border-gray-200 p-12 text-center">
            <div className="flex flex-col items-center">
              <div className="p-3 bg-gray-100 rounded-full mb-4">
                <FolderOpen className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No hay documentos</h3>
              <p className="text-gray-500 max-w-md mb-4">
                {searchTerm || selectedType 
                  ? 'No se encontraron documentos que coincidan con tus criterios de búsqueda. Prueba con otros filtros.'
                  : 'Aún no has procesado ningún documento. Sube un documento para empezar a generar preguntas.'}
              </p>
              <Link 
                href="/upload"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                <span>Cargar Documento</span>
              </Link>
            </div>
          </div>
        )}

        {/* Modal de confirmación para eliminar */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-xl shadow-2xl max-w-md w-full p-5 relative animate-fade-in">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="absolute top-3 right-3 p-1 hover:bg-muted rounded-full transition"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
              <div className="flex flex-col items-center gap-2 mb-4">
                <div className="p-2 bg-destructive/10 rounded-full border border-destructive/20 flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                </div>
                <h3 className="text-base font-bold text-destructive text-center">Confirmar eliminación</h3>
              </div>
              <p className="text-center text-muted-foreground mb-5 text-sm">
                ¿Estás seguro de que deseas eliminar este documento?<br/>
                <span className="font-medium">Esta acción no se puede deshacer</span> y las preguntas generadas se perderán <b>permanentemente</b>.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-1.5 rounded-lg border border-border bg-muted text-foreground font-medium text-sm hover:bg-muted/70 transition"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancelar
                </button>
                <button
                  className="px-4 py-1.5 rounded-lg bg-destructive text-white font-semibold text-sm hover:bg-destructive/90 transition flex items-center gap-2 shadow-sm"
                  onClick={confirmDelete}
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Eliminar</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  );
} 