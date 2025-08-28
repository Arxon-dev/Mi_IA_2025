'use client';

import { useState, useEffect } from 'react';
import { Check, Copy, Download, Wand2, Maximize2, Minimize2, Trash2, Loader2, ChevronDown, ChevronUp, Edit, Eye, EyeOff, MoreHorizontal, CheckCircle, AlertCircle } from 'lucide-react';
import { parseGiftQuestion } from '../utils/giftParser';
import { MoodleQuestionView } from './MoodleQuestionView';
import React from 'react';
import SchoolIcon from '@mui/icons-material/School';
import Tooltip from '@mui/material/Tooltip';
import MoodleImportPopover from '@/components/moodle/MoodleImportPopover';
import toast from 'react-hot-toast';
import QuestionValidationModal from './QuestionValidationModal';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface QuestionGeneratorProps {
  isGenerating: boolean;
  onGenerate: () => Promise<void>;
  questions: any[];
  onDeleteQuestion?: (sectionId: string, questionIndex: number) => void;
  sectionId?: string;
  sectionQuestionsDB?: { id: string; content: string; isTemporary?: boolean; savedInTable?: string; type?: string; difficulty?: string; createdAt?: string; sectionId?: string }[];
  editingSectionQuestion?: { [key: string]: string | undefined };
  setEditingSectionQuestion?: React.Dispatch<React.SetStateAction<{ [key: string]: string | undefined }>>;
  fetchSectionQuestions?: (sectionId: string) => Promise<void>;
  onDeletePermanent?: (questionid: string) => void;
  onCleanSingleSectionQuestion?: (questionid: string) => void;
  onSendToTelegram?: (question: { id: string; content: string }) => Promise<void>;
  isSendingToTelegram?: Record<string, boolean>;
  sourceText?: string;
}

export function QuestionGenerator({
  isGenerating,
  onGenerate,
  questions,
  onDeleteQuestion,
  sectionId,
  sectionQuestionsDB,
  editingSectionQuestion,
  setEditingSectionQuestion,
  fetchSectionQuestions,
  onDeletePermanent,
  onCleanSingleSectionQuestion,
  onSendToTelegram,
  isSendingToTelegram,
  sourceText
}: QuestionGeneratorProps) {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'gift' | 'moodle'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('questionViewMode') as 'gift' | 'moodle') || 'gift';
    }
    return 'gift';
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});
  const [popoverAnchor, setPopoverAnchor] = useState<null | HTMLElement>(null);
  const [popoverQuestionGift, setPopoverQuestionGift] = useState<string>('');
  const [popoverOpenIndex, setPopoverOpenIndex] = useState<number | null>(null);
  
  // Estado para controlar el guardado de preguntas individuales
  const [savingQuestions, setSavingQuestions] = useState<Record<string, boolean>>({});

  // Estado para el modal de validación
  const [validationModalOpen, setValidationModalOpen] = useState(false);
  const [questionToValidate, setQuestionToValidate] = useState<{ id: string; content: string } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('questionViewMode', viewMode);
    }
  }, [viewMode]);

  useEffect(() => {
    function handleFullscreenChange() {
      const isFs = document.fullscreenElement === cardRef.current;
      setIsFullscreen(isFs);
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleEnterFullscreen = () => {
    if (cardRef.current && cardRef.current.requestFullscreen) {
      cardRef.current.requestFullscreen();
    }
  };
  const handleExitFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  };

  const handleCopy = () => {
    const questionsToCopyContent = (sectionQuestionsDB && sectionQuestionsDB.length > 0 
      ? sectionQuestionsDB.map(q => q.content) 
      : questions.map(q => typeof q === 'string' ? q : q.content)
    ).join('\n\n');
    navigator.clipboard.writeText(questionsToCopyContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleDownload = () => {
    const textToDownloadContent = (sectionQuestionsDB && sectionQuestionsDB.length > 0
      ? sectionQuestionsDB.map(q => q.content)
      : questions.map(q => typeof q === 'string' ? q : q.content)
    ).join('\n\n');
    const blob = new Blob([textToDownloadContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'preguntas_gift.gift';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleQuestionExpansion = (questionid: string) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [questionid]: !prev[questionid]
    }));
  };

  const expandAllQuestions = () => {
    const allExpanded: Record<string, boolean> = {};
    questionsToShow.forEach(q => {
      allExpanded[q.id] = true;
    });
    setExpandedQuestions(allExpanded);
  };

  const collapseAllQuestions = () => {
    const allCollapsed: Record<string, boolean> = {};
    questionsToShow.forEach(q => {
      allCollapsed[q.id] = false;
    });
    setExpandedQuestions(allCollapsed);
  };

  const questionsToShow: Array<{ id: string; content: string; isTemporary?: boolean; savedInTable?: string; type?: string; difficulty?: string; createdAt?: string; sectionId?: string }> = 
    (sectionQuestionsDB && sectionQuestionsDB.length > 0 
      ? sectionQuestionsDB 
      : questions.map((q, index) => (
          typeof q === 'string' 
            ? { id: `temp-gen-${sectionId}-${index}`, content: q } 
            : q
        ))
    ).filter(q => q && q.content);

  const hasQuestionsToShow = questionsToShow.length > 0;

  useEffect(() => {
    if (questionsToShow.length > 0) {
      const allCollapsed: Record<string, boolean> = {};
      questionsToShow.forEach(q => {
        allCollapsed[q.id] = false;
      });
      setExpandedQuestions(allCollapsed);
    }
  }, [questionsToShow.length]);

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <Button
          onClick={onGenerate}
          disabled={isGenerating}
          size="lg"
          className="w-full sm:w-auto"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              <span>Generando preguntas...</span>
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4 mr-2" />
              <span>Generar preguntas</span>
            </>
          )}
        </Button>

        {hasQuestionsToShow && (
          <div className="flex flex-col sm:flex-row gap-2 items-center">
            <Button
              variant="outline"
              onClick={handleCopy}
              className="w-full sm:w-auto"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  <span>¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  <span>Copiar</span>
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleDownload}
              className="w-full sm:w-auto"
            >
              <Download className="w-4 h-4 mr-2" />
              <span>Descargar GIFT</span>
            </Button>
          </div>
        )}
      </div>

      {/* Questions Display */}
      {hasQuestionsToShow && (
        <Card
          ref={cardRef}
          className={cn(
            "overflow-hidden",
            isFullscreen && "fixed inset-0 z-50 max-h-none max-w-none w-screen h-screen rounded-none"
          )}
        >
          <CardHeader className="pb-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <CardTitle className="text-lg">Preguntas Generadas</CardTitle>
                <Badge variant="secondary">
                  {questionsToShow.length} pregunta{questionsToShow.length !== 1 ? 's' : ''}
                </Badge>
                {/* 🎯 NUEVO: Indicador de tabla personalizada */}
                {questionsToShow.length > 0 && questionsToShow[0].isTemporary && questionsToShow[0].savedInTable && (
                  <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-800">
                    📊 Guardadas en: {questionsToShow[0].savedInTable}
                  </Badge>
                )}
              </div>
              
              <div className="flex gap-2 items-center flex-wrap">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={expandAllQuestions}
                  className="text-xs"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Expandir todas
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={collapseAllQuestions}
                  className="text-xs"
                >
                  <EyeOff className="w-3 h-3 mr-1" />
                  Colapsar todas
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode(viewMode === 'gift' ? 'moodle' : 'gift')}
                  className="text-xs"
                >
                  {viewMode === 'gift' ? 'Vista Moodle' : 'Vista GIFT'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={isFullscreen ? handleExitFullscreen : handleEnterFullscreen}
                  className="text-xs"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className={cn(
            "p-0",
            isFullscreen && "h-[calc(100vh-120px)] overflow-y-auto questions-fullscreen-scrollbar"
          )}>
            <div 
              className={cn(
                "divide-y divide-border",
                isFullscreen && ""
              )}
            >
              {questionsToShow.map((q, index) => {
                const parsedQuestion = parseGiftQuestion(q.content);
                const isExpanded = expandedQuestions[q.id] === true;
                const isEditing = editingSectionQuestion && setEditingSectionQuestion && editingSectionQuestion[q.id] !== undefined && !q.id.startsWith('temp-gen-');
                
                return (
                  <div key={q.id} className="p-6 space-y-4 hover:bg-accent/5 transition-colors group">
                    {/* 🎯 NUEVO: Indicador de tabla personalizada por pregunta */}
                    {q.isTemporary && q.savedInTable && (
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline" className="bg-amber-50 border-amber-300 text-amber-800 text-xs">
                          📊 Guardada en tabla: {q.savedInTable}
                        </Badge>
                        <Badge variant="outline" className="bg-green-50 border-green-300 text-green-800 text-xs">
                          ✨ Vista temporal
                        </Badge>
                      </div>
                    )}
                    
                    {/* Question Actions */}
                    {!q.id.startsWith('temp-gen-') && (!(q.isTemporary && !q.savedInTable)) && (
                      <div className="flex justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        {/* Solo mostrar botón de editar si NO es una pregunta temporal de tabla personalizada */}
                        {!(q.isTemporary && q.savedInTable && q.savedInTable !== 'SectionQuestion') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingSectionQuestion && setEditingSectionQuestion(prev => ({ ...prev, [q.id]: q.content }))}
                            className="h-9 px-3 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300 hover:text-blue-800 transition-all duration-200 shadow-sm hover:shadow-md"
                            title="Editar pregunta"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            <span className="text-xs font-medium">Editar</span>
                          </Button>
                        )}
                        {/* Mostrar mensaje informativo para preguntas de tablas personalizadas */}
                        {q.isTemporary && q.savedInTable && q.savedInTable !== 'SectionQuestion' && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 px-3 py-2 rounded-lg">
                            <AlertCircle className="w-4 h-4" />
                            <span>Esta pregunta está guardada en tabla personalizada "{q.savedInTable}" y no se puede editar desde aquí</span>
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onCleanSingleSectionQuestion && onCleanSingleSectionQuestion(q.id)}
                          className="h-9 px-3 bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 hover:border-amber-300 hover:text-amber-800 transition-all duration-200 shadow-sm hover:shadow-md"
                          title="Limpiar de la interfaz"
                          disabled={!onCleanSingleSectionQuestion}
                        >
                          <span className="mr-1">🧹</span>
                          <span className="text-xs font-medium">Limpiar</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // ✅ NUEVO: Manejar preguntas temporales correctamente
                            if (q.id.startsWith('temp-')) {
                              alert(`❌ No se puede eliminar esta pregunta temporal.\n\n` +
                                    `Esta pregunta está guardada en la tabla personalizada "${q.savedInTable || 'desconocida'}" y solo se muestra temporalmente en esta interfaz.\n\n` +
                                    `💡 Para eliminarla permanentemente, accede a la interfaz específica de esa tabla o recarga la página para ocultar las preguntas temporales.`);
                              return;
                            }
                            
                            if (onDeletePermanent) {
                              onDeletePermanent(q.id);
                            }
                          }}
                          className="h-9 px-3 bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300 hover:text-red-800 transition-all duration-200 shadow-sm hover:shadow-md"
                          title={q.id.startsWith('temp-') ? 'Pregunta temporal - No se puede eliminar' : 'Eliminar permanentemente'}
                          disabled={!onDeletePermanent && !q.id.startsWith('temp-')}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          <span className="text-xs font-medium">Eliminar</span>
                        </Button>
                        {onSendToTelegram && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onSendToTelegram(q)}
                            disabled={isSendingToTelegram?.[q.id]}
                            className="h-9 px-3 bg-cyan-50 border-cyan-200 text-cyan-700 hover:bg-cyan-100 hover:border-cyan-300 hover:text-cyan-800 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50"
                            title="Enviar a Telegram"
                          >
                            {isSendingToTelegram?.[q.id] ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin mr-1" />
                                <span className="text-xs font-medium">Enviando...</span>
                              </>
                            ) : (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="w-4 h-4 mr-1" viewBox="0 0 16 16">
                                  <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8.287 5.906c-.778.324-2.334.994-4.666 2.01-.378.15-.577.298-.595.442-.03.243.275.339.69.47l.175.055c.408.133.958.288 1.243.294.26.006.549-.1.868-.32 2.179-1.471 3.304-2.214 3.374-2.23.05-.012.12-.026.166.016.047.041.042.12.037.141-.03.129-1.227 1.241-1.846 1.817-.193.18-.33.307-.358.336a8.154 8.154 0 0 1-.188.186c-.38.366-.664.64.015 1.088.327.216.589.393.85.571.284.194.568.387.936.629.093.06.183.125.27.187.331.226.63.42.996.595.213.1.375.15.414.15.048 0 .107-.033.165-.088.09-.086.16-.217.228-.424.096-.29.435-1.448.606-2.4C9.29 8.09 9.15 7.51 8.287 5.906z"/>
                                </svg>
                                <span className="text-xs font-medium">Telegram</span>
                              </>
                            )}
                          </Button>
                        )}
                        <Tooltip title="Importar a Moodle">
                          <span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={e => {
                                e.stopPropagation();
                                setPopoverQuestionGift(q.content);
                                setPopoverAnchor(e.currentTarget);
                                setPopoverOpenIndex(index);
                                
                                // ❌ Eliminar este setTimeout que causa scroll automático
                                // setTimeout(() => {
                                //   const modalElement = document.getElementById('moodle-import-modal');
                                //   if (modalElement) {
                                //     modalElement.scrollIntoView({ 
                                //       behavior: 'smooth', 
                                //       block: 'center' 
                                //     });
                                //   } else {
                                //     window.scrollTo({ 
                                //       top: Math.max(0, window.scrollY - 200), 
                                //       behavior: 'smooth' 
                                //     });
                                //   }
                                // }, 150);
                              }}
                              className="h-9 px-3 bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 hover:border-purple-300 hover:text-purple-800 transition-all duration-200 shadow-sm hover:shadow-md"
                              title="Importar a Moodle"
                            >
                              <SchoolIcon className="w-4 h-4 mr-1" />
                              <span className="text-xs font-medium">Moodle</span>
                            </Button>
                          </span>
                        </Tooltip>
                      </div>
                    )}

                    {/* Question Header */}
                    <div 
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                      onClick={() => toggleQuestionExpansion(q.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">
                          Pregunta {index + 1}
                        </Badge>
                        <span className="text-sm text-muted-foreground line-clamp-1 max-w-xs md:max-w-md">
                          {parsedQuestion.enunciado.replace(/<[^>]*>/g, '')}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleQuestionExpansion(q.id);
                        }}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </div>

                    {/* Question Content */}
                    {(isEditing || isExpanded) && (
                      <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                        {isEditing ? (
                          <div className="space-y-3">
                            <textarea
                              value={editingSectionQuestion[q.id] ?? q.content}
                              onChange={e => setEditingSectionQuestion(prev => ({ ...prev, [q.id]: e.target.value }))}
                              className="w-full min-h-[120px] p-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-y"
                              placeholder="Edita el contenido de la pregunta..."
                            />
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingSectionQuestion(prev => { const copy = { ...prev }; delete copy[q.id]; return copy; })}
                              >
                                Cancelar
                              </Button>
                              <Button
                                size="sm"
                                disabled={savingQuestions[q.id]}
                                onClick={async () => {
                                  if (editingSectionQuestion[q.id] !== null && editingSectionQuestion[q.id] !== undefined && editingSectionQuestion[q.id] !== q.content) {
                                    try {
                                      // Marcar como guardando
                                      setSavingQuestions(prev => ({ ...prev, [q.id]: true }));
                                      
                                      console.log(`🔄 [QuestionGenerator] Iniciando actualización de pregunta ${q.id}`);
                                      
                                      // Importar el servicio dinámicamente
                                      const { StorageService } = await import('../services/storageService');
                                      
                                      // Actualizar la pregunta en la base de datos
                                      const updatedQuestion = await StorageService.updateSectionQuestion(q.id, { 
                                        content: editingSectionQuestion[q.id] 
                                      });
                                      
                                      if (!updatedQuestion) {
                                        throw new Error('No se pudo actualizar la pregunta');
                                      }
                                      
                                      console.log(`✅ [QuestionGenerator] Pregunta ${q.id} actualizada exitosamente`);
                                      
                                      // Limpiar el estado de edición SOLO después de confirmación de éxito
                                      setEditingSectionQuestion(prev => { 
                                        const copy = { ...prev }; 
                                        delete copy[q.id]; 
                                        return copy; 
                                      });
                                      
                                      // Esperar un momento antes de recargar para asegurar consistencia de BD
                                      await new Promise(resolve => setTimeout(resolve, 100));
                                      
                                      // Recargar las preguntas solo si es necesario
                                      if (fetchSectionQuestions && sectionId) {
                                        console.log(`🔄 [QuestionGenerator] Recargando preguntas de sección ${sectionId}`);
                                        await fetchSectionQuestions(sectionId);
                                      }
                                      
                                    } catch (error) {
                                      console.error(`❌ [QuestionGenerator] Error al actualizar pregunta ${q.id}:`, error);
                                      
                                      // Manejo específico de errores
                                      let errorMessage = 'Error al guardar la pregunta. Por favor, inténtalo de nuevo.';
                                      
                                      if (error instanceof Error) {
                                        // Si es un error de fetch, intentar obtener más detalles
                                        if (error.message.includes('fetch')) {
                                          try {
                                            // El error ya fue procesado en StorageService, mostrar mensaje genérico
                                            errorMessage = 'Error de conexión al guardar la pregunta.';
                                          } catch (parseError) {
                                            // Error al parsear la respuesta
                                            errorMessage = 'Error al procesar la respuesta del servidor.';
                                          }
                                        } else {
                                          errorMessage = error.message;
                                        }
                                      }
                                      
                                      // Verificar si es un ID temporal
                                      if (q.id.startsWith('temp-')) {
                                        errorMessage = `Esta pregunta está guardada en una tabla personalizada (${q.savedInTable || 'desconocida'}) y no se puede editar desde aquí. Use la interfaz específica de esa tabla para editarla.`;
                                      }
                                      
                                      // No limpiar el estado en caso de error, permitir al usuario reintentar
                                      alert(errorMessage);
                                    }
                                  } else {
                                    // Si no hay cambios, simplemente limpiar el estado de edición
                                    setEditingSectionQuestion(prev => { 
                                      const copy = { ...prev }; 
                                      delete copy[q.id]; 
                                      return copy; 
                                    });
                                  }
                                }}
                              >
                                {savingQuestions[q.id] ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    Guardando...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Guardar
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {viewMode === 'gift' ? (
                              <pre className="whitespace-pre-wrap text-sm font-mono bg-muted p-4 rounded-lg border border-border overflow-x-auto">
                                {q.content}
                              </pre>
                            ) : (
                              <div className="bg-background border border-border rounded-lg p-4">
                                <MoodleQuestionView question={parsedQuestion} index={index} />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Moodle Import Modal */}
                    {popoverOpenIndex === index && questionsToShow[index] && popoverAnchor && (
                      <MoodleImportPopover
                        giftContent={questionsToShow[index].content}
                        onClose={() => {
                          setPopoverAnchor(null);
                          setPopoverOpenIndex(null);
                        }}
                        onSuccess={msg => toast.success(msg)}
                        onError={msg => toast.error(msg)}
                        anchorEl={popoverAnchor} // ✅ Pasar la referencia del botón
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}