'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Clock, 
  Search, 
  Download,
  FileText,
  Filter,
  Calendar,
  SortDesc,
  Eye,
  Trash2,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react';
import { StorageService, StoredDocument, PrismaQuestion, PrismaSection } from '@/services/storageService';
import {  sectionquestion  } from '@prisma/client';

// Definición de tipos
interface HistoryEntry {
  id: string;
  title: string;
  date: string;
  type: string;
  questionCount: number;
  status: 'completed' | 'processing' | 'error';
  fileSize?: string;
  blooms: {
    remember: number;
    understand: number;
    apply: number;
    analyze: number;
    evaluate: number;
    create: number;
  };
  content?: string;
}

// Interfaz para el documento con las propiedades adicionales que necesitamos
interface DocumentFromStorage extends StoredDocument {
  blooms?: HistoryEntry['blooms'];
}

export default function HistoryPage() {
  const router = useRouter();
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<HistoryEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'questions'>('newest');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);
  const [docQuestions, setDocQuestions] = useState<Record<string, { global: PrismaQuestion[]; sections: { section: PrismaSection; questions: SectionQuestion[] }[] }>>({});
  const [loadingQuestions, setLoadingQuestions] = useState<string | null>(null);
  const [docs, setDocs] = useState<DocumentFromStorage[]>([]);

  useEffect(() => {
    async function loadHistory() {
      try {
        setLoading(true);
        const docs: DocumentFromStorage[] = await StorageService.getDocuments();
        
        if (docs.length > 0) {
          const mappedEntries: HistoryEntry[] = docs.map(doc => {
            let dateStr: string;
            try {
              dateStr = doc.date instanceof Date 
                ? doc.date.toISOString()
                : new Date(doc.date).toISOString();
            } catch (error) {
              dateStr = new Date().toISOString();
            }

            const questionCount = typeof doc.questionCount === 'number' 
              ? doc.questionCount 
              : doc.questionCount === null 
                ? 0 
                : Number(doc.questionCount) || 0;

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
              date: dateStr,
              type: doc.type,
              questionCount: questionCount,
              status: 'completed' as const,
              fileSize,
              content: doc.content,
              blooms: doc.blooms || { 
                remember: 20,
                understand: 20,
                apply: 20,
                analyze: 20,
                evaluate: 10,
                create: 10
              }
            };
          });

          setHistoryEntries(mappedEntries);
          setFilteredEntries(mappedEntries);
          setDocs(docs);
        }
      } catch (error) {
        console.error('Error al cargar el historial:', error);
        setError('Error al cargar el historial');
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, []);

  useEffect(() => {
    let filtered = [...historyEntries];
    
    if (searchTerm) {
      filtered = filtered.filter(entry => 
        entry.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedType) {
      filtered = filtered.filter(entry => entry.type === selectedType);
    }
    
    filtered.sort((a, b) => {
      if (sortOrder === 'newest') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (sortOrder === 'oldest') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      } else { 
        return b.questionCount - a.questionCount;
      }
    });
    
    setFilteredEntries(filtered);
  }, [historyEntries, searchTerm, selectedType, sortOrder]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error al formatear la fecha:', error);
      return 'Fecha no válida';
    }
  };

  const handleDelete = (id: string) => {
    setEntryToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (entryToDelete) {
      try {
        setLoading(true);
        await StorageService.deleteDocument(entryToDelete);
        
        setHistoryEntries(prevEntries => 
          prevEntries.filter(entry => entry.id !== entryToDelete)
        );
        setShowDeleteModal(false);
        setDeleteSuccess(true);
        setTimeout(() => setDeleteSuccess(false), 3000);
      } catch (err) {
        console.error('Error al eliminar el documento:', err);
        setError('Error al eliminar el documento. Por favor, inténtalo de nuevo.');
      } finally {
        setLoading(false);
        setEntryToDelete(null);
      }
    }
  };

  const handleView = (id: string) => {
    router.push(`/documents/${id}`);
  };

  const handleDownload = async (entry: HistoryEntry) => {
    if (!entry || !entry.id) {
        alert('Información del documento no disponible para la descarga.');
        return;
    }
    try {
      setLoading(true);
      let questionsText = `// Preguntas para ${entry.title}\n// (Funcionalidad de descarga de preguntas específicas aún no implementada completamente en StorageService)\n\n${entry.content || 'Contenido no disponible'}`;

      const blob = new Blob([questionsText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Preguntas_${entry.title.replace(/\s+/g, '_')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error al descargar preguntas:', error);
      alert('Error al preparar la descarga de las preguntas.');
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'legal':
        return 'bg-blue-100 text-blue-800';
      case 'military':
        return 'bg-green-100 text-green-800';
      case 'technical':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          icon: <CheckCircle className="h-4 w-4 mr-1" />,
          text: 'Completado',
          color: 'text-green-600'
        };
      case 'processing':
        return {
          icon: <Clock className="h-4 w-4 mr-1" />,
          text: 'Procesando',
          color: 'text-yellow-600'
        };
      case 'error':
        return {
          icon: <AlertCircle className="h-4 w-4 mr-1" />,
          text: 'Error',
          color: 'text-red-600'
        };
      default:
        return {
          icon: <Clock className="h-4 w-4 mr-1" />,
          text: 'Desconocido',
          color: 'text-gray-600'
        };
    }
  };

  const getBloomPercentages = (entry: HistoryEntry) => {
    return entry.blooms;
  };

  const renderBloomLevels = (entry: HistoryEntry) => {
    const blooms = getBloomPercentages(entry);
    const bloomColors = {
      remember: 'bg-red-200 text-red-800',
      understand: 'bg-orange-200 text-orange-800',
      apply: 'bg-yellow-200 text-yellow-800',
      analyze: 'bg-green-200 text-green-800',
      evaluate: 'bg-blue-200 text-blue-800',
      create: 'bg-purple-200 text-purple-800'
    };

    return (
      <div className="mt-2">
        <div className="text-xs text-muted-foreground mb-1">Distribución Bloom:</div>
        <div className="flex flex-wrap gap-1">
          {Object.entries(blooms).map(([level, percentage]) => (
            <span key={level} className={`px-2 py-1 rounded text-xs ${bloomColors[level as keyof typeof bloomColors]}`}>
              {level.charAt(0).toUpperCase() + level.slice(1)}: {percentage}%
            </span>
          ))}
        </div>
      </div>
    );
  };

  const reloadQuestions = async (doc: DocumentFromStorage) => {
    setLoadingQuestions(doc.id);
    // Cargar preguntas globales - FIXED: extraer questions del response
    const globalQuestionsResponse = await StorageService.getQuestionsForDocument(doc.id);
    const globalQuestions = globalQuestionsResponse.questions;
    // Cargar preguntas por sección
    let sections: PrismaSection[] = [];
    if (doc.sections && Array.isArray(doc.sections)) {
      sections = doc.sections as PrismaSection[];
    }
    const sectionQuestions: { section: PrismaSection; questions: SectionQuestion[] }[] = [];
    for (const section of sections) {
      const questions = await StorageService.getQuestionsForSection(section.id);
      sectionQuestions.push({ section, questions });
    }
    setDocQuestions(prev => ({ ...prev, [doc.id]: { global: globalQuestions, sections: sectionQuestions } }));
    setLoadingQuestions(null);
  };

  const handleExpand = async (doc: DocumentFromStorage) => {
    if (expandedDocId === doc.id) {
      setExpandedDocId(null);
      return;
    }
    setExpandedDocId(doc.id);
    setLoadingQuestions(doc.id);
    // Cargar preguntas globales - FIXED: extraer questions del response
    const globalQuestionsResponse = await StorageService.getQuestionsForDocument(doc.id);
    const globalQuestions = globalQuestionsResponse.questions;
    // Cargar preguntas por sección
    let sections: PrismaSection[] = [];
    if (doc.sections && Array.isArray(doc.sections)) {
      sections = doc.sections as PrismaSection[];
    } else {
      // Si no están en el doc, intenta obtenerlas desde la API si tienes un método
      // sections = await StorageService.getSectionsForDocument(doc.id); // Si existe
    }
    const sectionQuestions: { section: PrismaSection; questions: SectionQuestion[] }[] = [];
    for (const section of sections) {
      const questions = await StorageService.getQuestionsForSection(section.id);
      sectionQuestions.push({ section, questions });
    }
    setDocQuestions(prev => ({ ...prev, [doc.id]: { global: globalQuestions, sections: sectionQuestions } }));
    setLoadingQuestions(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Historial de Documentos</h1>
        <p className="text-muted-foreground mt-1">
          Consulta y gestiona los documentos procesados anteriormente
        </p>
      </div>

      {deleteSuccess && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-800 flex items-start gap-2 animate-fadeIn">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p>El documento ha sido eliminado correctamente.</p>
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center mb-4">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
        </div>
      )}

      <div className="bg-card rounded-lg shadow-sm border border-border p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground"
              placeholder="Buscar documento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="flex-shrink-0">
            <div className="relative inline-block w-full md:w-auto">
              <div className="flex">
                <div className="flex items-center px-3 border border-r-0 border-border bg-muted text-muted-foreground rounded-l-md">
                  <Filter className="h-4 w-4" />
                </div>
                <select
                  className="block w-full md:w-auto pl-3 pr-10 py-2 text-base border border-border rounded-r-md bg-background text-foreground focus:outline-none focus:ring-primary focus:border-primary"
                  value={selectedType || ''}
                  onChange={(e) => setSelectedType(e.target.value || null)}
                  disabled={loading}
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

          <div className="flex-shrink-0">
            <div className="relative inline-block w-full md:w-auto">
              <div className="flex">
                <div className="flex items-center px-3 border border-r-0 border-border bg-muted text-muted-foreground rounded-l-md">
                  <SortDesc className="h-4 w-4" />
                </div>
                <select
                  className="block w-full md:w-auto pl-3 pr-10 py-2 text-base border border-border rounded-r-md bg-background text-foreground focus:outline-none focus:ring-primary focus:border-primary"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest' | 'questions')}
                  disabled={loading}
                >
                  <option value="newest">Más recientes</option>
                  <option value="oldest">Más antiguos</option>
                  <option value="questions">Más preguntas</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading && <div className="text-center py-4">Cargando historial...</div>}
      {!loading && error && !filteredEntries.length && <div className="text-center py-4 text-destructive">{error}</div>}
      {!loading && !error && filteredEntries.length === 0 && (
         <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Clock className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-1">No hay documentos</h3>
            <p className="text-muted-foreground max-w-md">
              {searchTerm || selectedType 
                ? 'No se encontraron documentos que coincidan con tus criterios de búsqueda. Prueba con otros filtros.'
                : 'Aún no has procesado ningún documento. Sube un documento para empezar a generar preguntas.'}
            </p>
          </div>
      )}

      {!loading && !error && filteredEntries.length > 0 && (
        <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
          <div className="divide-y divide-border">
            {filteredEntries.map((entry) => {
              const currentBlooms = getBloomPercentages(entry);
              return (
                <div key={entry.id} className="p-4 hover:bg-muted/50 transition-colors duration-150">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3 flex-grow">
                      <div className="p-2 bg-secondary text-primary rounded-md flex-shrink-0">
                        <FileText className="h-6 w-6" />
                      </div>
                      
                      <div className="flex-grow min-w-0">
                        <h3 className="font-medium text-foreground truncate" title={entry.title}>{entry.title}</h3>
                        
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>{formatDate(entry.date)}</span>
                          </div>
                          
                          <div className={`px-2 py-0.5 rounded-full text-xs ${getTypeColor(entry.type)}`}>
                            {entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}
                          </div>
                          
                          <div className={`flex items-center ${getStatusInfo(entry.status).color}`}>
                            {getStatusInfo(entry.status).icon}
                            <span>{getStatusInfo(entry.status).text}</span>
                          </div>
                           {entry.fileSize && (
                            <div className="flex items-center">
                                <span className="mr-1">•</span>
                                <span>{entry.fileSize}</span>
                            </div>
                           )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col md:flex-row items-end md:items-center gap-4 flex-shrink-0">
                      {entry.status === 'completed' && (
                        <div className="flex flex-col items-center">
                          <div className="text-2xl font-semibold text-foreground">{entry.questionCount}</div>
                          <div className="text-xs text-muted-foreground">Preguntas</div>
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        {entry.status === 'completed' && (
                          <>
                            <button 
                              onClick={() => handleView(entry.id)}
                              className="p-2 bg-background hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
                              title="Ver documento"
                              disabled={loading}
                            >
                              <Eye className="h-5 w-5" />
                            </button>
                            
                            <button 
                              onClick={() => handleDownload(entry)}
                              className="p-2 bg-primary/10 hover:bg-primary/20 rounded-md text-primary transition-colors"
                              title="Descargar preguntas"
                              disabled={loading}
                            >
                              <Download className="h-5 w-5" />
                            </button>
                            <button 
                              onClick={() => { 
                                const doc = docs.find(d => d.id === entry.id); 
                                if (doc) handleExpand(doc); 
                              }} 
                              className="p-2 bg-background hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors" 
                              title={expandedDocId === entry.id ? 'Ocultar preguntas generadas' : 'Ver preguntas generadas'} 
                              disabled={loading}
                            >
                              {expandedDocId === entry.id ? <X className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                            </button>
                          </>
                        )}
                        
                        <button 
                          onClick={() => handleDelete(entry.id)}
                          className="p-2 bg-destructive/10 hover:bg-destructive/20 rounded-md text-destructive transition-colors"
                          title="Eliminar documento"
                          disabled={loading}
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {renderBloomLevels(entry)}
                  
                  {/* Preguntas expandidas */}
                  {expandedDocId === entry.id && (
                    <div className="mt-4 border-t border-border pt-4">
                      {loadingQuestions === entry.id ? (
                        <div className="text-center py-4 text-muted-foreground">
                          Cargando preguntas...
                        </div>
                      ) : docQuestions[entry.id] ? (
                        <div className="space-y-4">
                          {/* Preguntas globales */}
                          {docQuestions[entry.id].global.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-foreground mb-2">
                                Preguntas Globales ({docQuestions[entry.id].global.length})
                              </h4>
                              <div className="space-y-2">
                                {docQuestions[entry.id].global.map((question, index) => (
                                  <div key={question.id} className="bg-muted/50 p-3 rounded-md">
                                    <div className="flex justify-between items-start">
                                      <div className="flex-grow">
                                        <span className="text-sm text-muted-foreground">#{index + 1}</span>
                                        <p className="text-sm mt-1">{question.content}</p>
                                        <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                                          <span>Tipo: {question.type}</span>
                                          <span>Dificultad: {question.difficulty}</span>
                                          {question.bloomLevel && <span>Bloom: {question.bloomLevel}</span>}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Preguntas por sección */}
                          {docQuestions[entry.id].sections.map(({ section, questions }) => (
                            questions.length > 0 && (
                              <div key={section.id}>
                                <h4 className="font-semibold text-foreground mb-2">
                                  {section.title} ({questions.length} preguntas)
                                </h4>
                                <div className="space-y-2">
                                  {questions.map((question, index) => (
                                    <div key={question.id} className="bg-muted/50 p-3 rounded-md">
                                      <div className="flex justify-between items-start">
                                        <div className="flex-grow">
                                          <span className="text-sm text-muted-foreground">#{index + 1}</span>
                                          <p className="text-sm mt-1">{question.content}</p>
                                          <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                                            <span>Tipo: {question.type}</span>
                                            <span>Dificultad: {question.difficulty}</span>
                                            {question.bloomLevel && <span>Bloom: {question.bloomLevel}</span>}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          No se pudieron cargar las preguntas
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-6 w-6 text-destructive mr-2" />
              <h3 className="text-lg font-semibold text-foreground">Confirmar eliminación</h3>
            </div>
            <p className="text-muted-foreground mb-6">
              ¿Estás seguro de que quieres eliminar este documento? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-muted-foreground bg-background border border-border rounded-md hover:bg-muted transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-destructive-foreground bg-destructive rounded-md hover:bg-destructive/90 transition-colors"
                disabled={loading}
              >
                {loading ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 