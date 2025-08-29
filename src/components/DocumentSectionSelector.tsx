'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DocumentSection, DocumentProgress, DocumentSectionService, SectionType, ProcessingConfig } from '@/services/documentSectionService';
import { 
  ChevronRight, 
  ChevronDown, 
  Check, 
  Clock, 
  File, 
  Bookmark, 
  BookOpen, 
  FileText, 
  Loader2, 
  Search, 
  Wand2, 
  Settings, 
  ChevronUp, 
  Trash2, 
  Copy, 
  RefreshCw, 
  Expand, 
  Minimize,
  FileBarChart,
  SchoolIcon,
  Maximize2,
  Eye,
  EyeOff,
  Play,
  BarChart3,
  Brain,
  Zap,
  Target,
  CheckCircle,
  AlertCircle,
  Archive,
  RotateCcw,
  Send,
  Download,
  Filter,
  Grid,
  List,
  MoreVertical,
  Sparkles,
  Edit,
  Plus,
  Minus,
  X,
  MessageSquare,
  Grid3X3,
  ArrowLeft,
  ArrowRight,
  Minimize2,
  Calculator
} from 'lucide-react';
import {  section  } from '@prisma/client';
import { QuestionGenerator } from './QuestionGenerator';
import { SectionProcessingConfig } from './SectionProcessingConfig';
import { questionTypes } from '@/services/questionGeneratorService';
import { QuestionConfig } from './QuestionConfig';
import type { OptionLengthType } from '@/services/aiService';
import type { section as PrismaSection } from '@prisma/client';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import { StorageService } from '@/services/storageService';
import { MoodleQuestionView } from './MoodleQuestionView';
import { parseGiftQuestion } from '@/utils/giftParser';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import AdvancedQuestionValidator from '@/components/AdvancedQuestionValidator';
import Tooltip from '@mui/material/Tooltip';
import MoodleImportPopover from '@/components/moodle/MoodleImportPopover';
import { getSuggestedQuestions, getSuggestedQuestionsHybrid, getSuggestedQuestionsIntelligent } from '@/utils/questionUtils';
import { ExternalLink } from 'lucide-react';
import QuestionTableSelector from './QuestionTableSelector';

interface DocumentSectionSelectorProps {
  documentId: string;
  documentName: string;
  documentContent?: string;
  selectedSection: PrismaSection | null;
  isGenerating: boolean;
  sectionQuestions: Record<string, string[]>;
  progressMode: 'full' | 'progressive';
  numberOfQuestions: number;
  processingConfig: ProcessingConfig;
  optionLength: OptionLengthType;
  questionTypeCounts?: Record<string, number>;
  questionTypes?: { id: string; name: string; description: string }[];
  searchTerm: string;
  sectionQuestionsDB?: Record<string, any[]>;
  editingSectionQuestion?: { [key: string]: string | undefined };
  customTitle?: string;

  // Props para preguntas del documento completo
  docQuestionsDB: any[];
  loadingDocQuestions: boolean;
  showDocQuestions: boolean;
  editingDocQuestion: { [key: string]: string | undefined };
  isSendingToTelegram: Record<string, boolean>;
  isSendingAllDocQuestionsToTelegram: boolean;
  questionsViewMode: 'gift' | 'moodle';
  
  // Nuevas props para funcionalidad mejorada
  questionCounts: { active: number; archived: number; total: number };
  showArchivedQuestions: boolean;
  questionsHasMore: boolean;
  
  // Props para Telegram de secciones
  isSendingSectionQuestionToTelegram?: Record<string, boolean>;
  
  // Props para validación masiva
  isValidatingAllDocQuestions?: boolean;
  
  // Props para selector de tabla
  selectedQuestionTable?: import('@/types/questionTables').QuestionTableName;
}

function highlightMatch(text: string, query: string) {
  if (!query) return text;
  
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark className="bg-primary/20 text-primary">$1</mark>');
}

function getHiddenQuestionIdsForSection(sectionId: string): string[] {
  return getHiddenQuestionIdsForSectionFromStorage(sectionId);
}

function setHiddenQuestionIdsForSection(sectionId: string, ids: string[]) {
  setHiddenQuestionIdsForSectionInStorage(sectionId, ids);
}

// Función para restaurar todas las preguntas ocultas de una sección
function restoreAllHiddenQuestionsForSection(sectionId: string, fetchSectionQuestions?: (sectionId: string) => void) {
  setHiddenQuestionIdsForSection(sectionId, []);
  if (fetchSectionQuestions) fetchSectionQuestions(sectionId);
}

function getHiddenQuestionIdsForSectionFromStorage(sectionId: string): string[] {
  try {
    const hiddenIds = localStorage.getItem(`hiddenQuestions_${sectionId}`);
    return hiddenIds ? JSON.parse(hiddenIds) : [];
  } catch { return []; }
}

function setHiddenQuestionIdsForSectionInStorage(sectionId: string, ids: string[]) {
  try {
    localStorage.setItem(`hiddenQuestions_${sectionId}`, JSON.stringify(ids));
  } catch (error) {
    console.error('Error saving hidden question IDs:', error);
  }
}

export default function DocumentSectionSelector({
  documentId,
  documentName,
  documentContent,
  selectedSection,
  isGenerating,
  sectionQuestions,
  progressMode,
  numberOfQuestions,
  processingConfig,
  optionLength,
  questionTypeCounts,
  questionTypes: questionTypeDefinitionsFromProps,
  searchTerm,
  sectionQuestionsDB,
  editingSectionQuestion,
  customTitle,
  isSendingSectionQuestionToTelegram,
  // Props para preguntas del documento completo
  docQuestionsDB,
  loadingDocQuestions,
  showDocQuestions,
  editingDocQuestion,
  isSendingToTelegram,
  isSendingAllDocQuestionsToTelegram,
  questionsViewMode,
  questionCounts,
  showArchivedQuestions,
  questionsHasMore,
  // Props para validación masiva
  isValidatingAllDocQuestions,
  // Props para selector de tabla
  selectedQuestionTable = 'SectionQuestion'
}: DocumentSectionSelectorProps) {
  // Estados del componente
  const [sections, setSections] = useState<PrismaSection[]>([]);
  const [loadingSections, setLoadingSections] = useState(true);
  const [errorSections, setErrorSections] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [expandedContent, setExpandedContent] = useState<string | null>(null);
  const [isProcessingConfigExpanded, setIsProcessingConfigExpanded] = useState(false);
  const [sectionCustomTitle, setSectionCustomTitle] = useState('');
  const [hiddenSectionQuestionIdsMap, setHiddenSectionQuestionIdsMap] = useState<Record<string, string[]>>({});
  const [deletingSectionQuestionInfo, setDeletingSectionQuestionInfo] = useState<{sectionId: string, questionid: string} | null>(null);
  const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);
  const [popoverQuestionGift, setPopoverQuestionGift] = useState<string>('');
  const [isValidatorOpen, setIsValidatorOpen] = useState(false);
  const [validationQuestions, setValidationQuestions] = useState<any[]>([]);
  const [validationTitle, setValidationTitle] = useState('');
  const [isDocQuestionsFullscreen, setIsDocQuestionsFullscreen] = useState(false);
  const docQuestionsRef = useRef<HTMLDivElement>(null);
  const [popoverOpenQuestionId, setPopoverOpenQuestionId] = useState<string | null>(null);
  const [moodleImportOpen, setMoodleImportOpen] = useState<boolean>(false);
  const [moodleImportContent, setMoodleImportContent] = useState<string>('');

  // ✨ Estados para el validador del documento completo
  const [isDocValidatorOpen, setIsDocValidatorOpen] = useState(false);
  const [docValidationQuestions, setDocValidationQuestions] = useState<string[]>([]);
  const [documentTitle, setDocumentTitle] = useState<string>('');
  const [buttonPosition, setButtonPosition] = useState<{ x: number; y: number; scrollY: number } | null>(null);

  // ✨ NUEVOS Estados para sugerencias inteligentes
  const [useIntelligentSuggestions, setUseIntelligentSuggestions] = useState(true);
  const [intelligentSuggestions, setIntelligentSuggestions] = useState<Record<string, {
    traditional: number;
    intelligent: number;
    analysis?: any;
    loading: boolean;
  }>>({});

  // Efecto para escuchar cambios de pantalla completa
  useEffect(() => {
    function handleFullscreenChange() {
      const isFullscreen = document.fullscreenElement === docQuestionsRef.current;
      setIsDocQuestionsFullscreen(isFullscreen);
    }
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Funciones para manejar pantalla completa
  const handleEnterDocQuestionsFullscreen = () => {
    if (docQuestionsRef.current && docQuestionsRef.current.requestFullscreen) {
      docQuestionsRef.current.requestFullscreen();
    }
  };

  const handleExitDocQuestionsFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  };

  // Funciones locales para reemplazar las props eliminadas
  const onSectionSelect = (section: PrismaSection | null) => {
    // Función local para seleccionar sección
    console.log('Sección seleccionada:', section);
  };

  const renderContent = (section: PrismaSection) => {
    return (
      <div className="prose prose-sm max-w-none text-foreground">
        <div dangerouslySetInnerHTML={{ __html: section.content }} />
      </div>
    );
  };

  const onGenerateQuestions = async (sectionId: string, customTitle?: string) => {
    console.log('Generar preguntas para sección:', sectionId, customTitle);
  };

  const onProgressModeChange = () => {
    console.log('Cambiar modo de progreso');
  };

  const onNumberOfQuestionsChange = (value: number) => {
    console.log('Cambiar número de preguntas:', value);
  };

  const onProcessingConfigChange = (config: ProcessingConfig) => {
    console.log('Cambiar configuración de procesamiento:', config);
  };

  const onQuestionTypeCountsChange = (value: Record<string, number>) => {
    console.log('Cambiar conteos de tipos de preguntas:', value);
  };

  const onOptionLengthChange = (value: OptionLengthType) => {
    console.log('Cambiar longitud de opciones:', value);
  };

  const onAdvancedConfigChange = (questionTypes: any, difficultyLevels: any, bloomLevels?: any, optionLength?: OptionLengthType) => {
    console.log('Cambiar configuración avanzada');
  };

  const onSearchTermChange = (value: string) => {
    console.log('Cambiar término de búsqueda:', value);
  };

  const onDeleteSingleSectionQuestion = (sectionId: string, questionIndex: number) => {
    console.log('Eliminar pregunta de sección:', sectionId, questionIndex);
  };

  const setEditingSectionQuestion = (value: { [key: string]: string | undefined }) => {
    console.log('Editar pregunta de sección:', value);
  };

  const fetchSectionQuestions = async (sectionId: string) => {
    console.log('Obtener preguntas de sección:', sectionId);
  };

  const onCustomTitleChange = (value: string) => {
    console.log('Cambiar título personalizado:', value);
  };

  const onSendSectionQuestionToTelegram = async (sectionQuestion: any) => {
    console.log('Enviar pregunta de sección a Telegram:', sectionQuestion);
  };

  const setShowDocQuestions = (show: boolean) => {
    console.log('Mostrar preguntas del documento:', show);
  };

  const fetchDocQuestions = async (options?: { page?: number; reset?: boolean; showArchived?: boolean; search?: string }) => {
    console.log('Obtener preguntas del documento:', options);
  };

  const setEditingDocQuestion = (value: { [key: string]: string | undefined }) => {
    console.log('Editar pregunta del documento:', value);
  };

  const handleSendSingleQuestionToTelegram = async (question: any) => {
    console.log('Enviar pregunta individual a Telegram:', question);
  };

  const handleSendAllDocQuestionsToTelegram = async () => {
    console.log('Enviar todas las preguntas del documento a Telegram');
  };

  const setQuestionsViewMode = (mode: 'gift' | 'moodle') => {
    console.log('Cambiar modo de vista de preguntas:', mode);
  };

  const setDeletingDocQuestionId = (id: string | null) => {
    console.log('Eliminar pregunta del documento:', id);
  };

  const toggleShowArchived = () => {
    console.log('Alternar mostrar archivadas');
  };

  const archiveAllDocQuestions = async () => {
    console.log('Archivar todas las preguntas del documento');
  };

  const restoreAllDocQuestions = async () => {
    console.log('Restaurar todas las preguntas del documento');
  };

  const handleSearchQuestions = (term: string) => {
    console.log('Buscar preguntas:', term);
  };

  const loadMoreQuestions = () => {
    console.log('Cargar más preguntas');
  };

  const onQuestionTableChange = (table: import('@/types/questionTables').QuestionTableName) => {
    console.log('Cambiar tabla de preguntas:', table);
  };

  const handleNumQuestionsChange = (value: number) => {
    const validValue = Math.max(1, Math.min(500, value));
    onNumberOfQuestionsChange(validValue);
  };

  const handleUseSuggested = (suggestedCount: number) => {
    onNumberOfQuestionsChange(suggestedCount);
  };

  // ✨ NUEVA: Función para obtener sugerencias inteligentes
  const getIntelligentSuggestion = async (sectionId: string, content: string) => {
    if (!content || !useIntelligentSuggestions) {
      return getSuggestedQuestions(content);
    }

    // Si ya tenemos el cálculo, lo devolvemos
    if (intelligentSuggestions[sectionId] && !intelligentSuggestions[sectionId].loading) {
      return intelligentSuggestions[sectionId].intelligent;
    }

    // Marcar como cargando
    setIntelligentSuggestions(prev => ({
      ...prev,
      [sectionId]: {
        traditional: getSuggestedQuestions(content),
        intelligent: getSuggestedQuestions(content), // Fallback temporal
        loading: true
      }
    }));

    try {
      const result = await getSuggestedQuestionsHybrid(content, true);
      const intelligent = result.questions;
      
      setIntelligentSuggestions(prev => ({
        ...prev,
        [sectionId]: {
          traditional: getSuggestedQuestions(content),
          intelligent,
          analysis: result.analysis,
          loading: false
        }
      }));

      return intelligent;
    } catch (error) {
      console.warn('Error en sugerencia inteligente:', error);
      const traditional = getSuggestedQuestions(content);
      
      setIntelligentSuggestions(prev => ({
        ...prev,
        [sectionId]: {
          traditional,
          intelligent: traditional,
          loading: false
        }
      }));

      return traditional;
    }
  };

  // ✨ NUEVA: Función para obtener el valor de sugerencia a mostrar
  const getSuggestionValue = (sectionId: string, content: string) => {
    if (!useIntelligentSuggestions) {
      return getSuggestedQuestions(content);
    }

    const suggestion = intelligentSuggestions[sectionId];
    if (!suggestion) {
      // Iniciar cálculo asíncrono
      getIntelligentSuggestion(sectionId, content);
      return getSuggestedQuestions(content); // Mostrar tradicional mientras carga
    }

    return suggestion.loading ? suggestion.traditional : suggestion.intelligent;
  };

  // ✨ NUEVA: Función para alternar entre métodos
  const toggleSuggestionMethod = () => {
    setUseIntelligentSuggestions(!useIntelligentSuggestions);
    
    // Si cambiamos a inteligente, pre-calcular para secciones visibles
    if (!useIntelligentSuggestions) {
      sections.forEach(section => {
        if (section.content) {
          getIntelligentSuggestion(section.id, section.content);
        }
      });
    }
  };

  // Efecto para aplicar automáticamente sugerencias inteligentes
  useEffect(() => {
    if (useIntelligentSuggestions && selectedSection) {
      const suggestion = intelligentSuggestions[selectedSection.id];
      if (suggestion && !suggestion.loading) {
        handleUseSuggested(suggestion.intelligent);
      }
    }
  }, [useIntelligentSuggestions, selectedSection, intelligentSuggestions]);

  // Cargar secciones al montar el componente
  useEffect(() => {
    const loadInitialData = async () => {
      setLoadingSections(true);
      setErrorSections(null);
      try {
        // Usar el endpoint API en lugar de PrismaService directamente
        const response = await fetch(`/api/sections?documentId=${documentId}`);
        if (!response.ok) {
          throw new Error(`Error al cargar secciones: ${response.status} ${response.statusText}`);
        }
        const sectionsData = await response.json();
        
        // Organizar secciones por grupos
        const sectionsByGroup: Record<string, PrismaSection[]> = {};
        sectionsData.forEach(section => {
          const groupName = (section as any).groupName || 'Sin grupo';
          if (!sectionsByGroup[groupName]) {
            sectionsByGroup[groupName] = [];
          }
          sectionsByGroup[groupName].push(section);
        });

        // Convertir a array plano pero manteniendo orden de grupos
        const organizedSections: PrismaSection[] = [];
        Object.entries(sectionsByGroup).forEach(([groupName, groupSections]) => {
          organizedSections.push(...groupSections);
        });

        setSections(organizedSections);
        
        // Cargar mapas de preguntas ocultas
        const hiddenQuestionMaps: Record<string, string[]> = {};
        organizedSections.forEach(section => {
          hiddenQuestionMaps[section.id] = getHiddenQuestionIdsForSection(section.id);
        });
        setHiddenSectionQuestionIdsMap(hiddenQuestionMaps);
        
      } catch (error) {
        console.error('Error al cargar secciones:', error);
        setErrorSections('Error al cargar las secciones del documento');
      } finally {
        setLoadingSections(false);
      }
    };

    if (documentId) {
      loadInitialData();
    }
  }, [documentId]);

  const toggleSection = (groupName: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const toggleContent = (sectionId: string) => {
    setExpandedContent(prev => prev === sectionId ? null : sectionId);
  };

  const handleAdvancedConfigChange = (
    questionTypes: any,
    difficultyLevels: any,
    bloomLevels?: any,
    newOptionLength?: OptionLengthType
  ) => {
    if (onAdvancedConfigChange) {
      onAdvancedConfigChange(questionTypes, difficultyLevels, bloomLevels, newOptionLength || optionLength);
    }
  };

  const handleCleanSingleSectionQuestion = (sectionId: string, questionid: string) => {
    const currentHidden = hiddenSectionQuestionIdsMap[sectionId] || [];
    const newHidden = [...currentHidden, questionid];
    setHiddenQuestionIdsForSection(sectionId, newHidden);
    setHiddenSectionQuestionIdsMap(prev => ({
      ...prev,
      [sectionId]: newHidden
    }));
  };

  const handleRestoreAllForSection = (sectionId: string) => {
    setHiddenQuestionIdsForSection(sectionId, []);
    setHiddenSectionQuestionIdsMap(prev => ({
      ...prev,
      [sectionId]: []
    }));
  };

  const handleCleanAllForSection = (sectionId: string) => {
    const allQuestions = sectionQuestionsDB?.[sectionId] || [];
    const questionIds = allQuestions.map(q => q.id);
    setHiddenQuestionIdsForSection(sectionId, questionIds);
    setHiddenSectionQuestionIdsMap(prev => ({
      ...prev,
      [sectionId]: questionIds
    }));
  };

  const handleDeletePermanentInSection = async (sectionId: string, questionid: string) => {
    try {
      await StorageService.deleteSectionQuestion(questionid);
      if (fetchSectionQuestions) {
        await fetchSectionQuestions(sectionId);
      }
      setDeletingSectionQuestionInfo(null);
      toast.success('Pregunta eliminada permanentemente');
    } catch (error) {
      console.error('Error al eliminar pregunta:', error);
      toast.error('Error al eliminar la pregunta');
    }
  };

  const handleDeletePermanentProp = (questionid: string, sectionId: string) => {
    setDeletingSectionQuestionInfo({ sectionId, questionid });
  };

  const handleValidateAllSectionQuestions = async (sectionId: string, sectionTitle: string) => {
    const visibleQuestions = (sectionQuestionsDB?.[sectionId] || []).filter(
      (q: any) => !getHiddenQuestionIdsForSection(sectionId).includes(q.id)
    );
    
    if (visibleQuestions.length === 0) {
      toast.error('No hay preguntas visibles para validar en esta sección');
      return;
    }

    setValidationQuestions(visibleQuestions);
    setValidationTitle(`Validación IA - Sección: ${sectionTitle}`);
    setIsValidatorOpen(true);
  };

  const handleCloseSectionValidator = () => {
    setIsValidatorOpen(false);
    setValidationQuestions([]);
    setValidationTitle('');
  };

  // ✨ Función para manejar la validación del documento completo
  const handleValidateDocQuestions = async (event?: React.MouseEvent) => {
    try {
      console.log('[DEBUG DocumentSectionSelector] ✅ handleValidateDocQuestions INICIADA');
      
      if (!docQuestionsDB || docQuestionsDB.length === 0) {
        toast.error('No hay preguntas del documento para validar');
        return;
      }

      console.log('[DEBUG DocumentSectionSelector] Preguntas encontradas:', docQuestionsDB.length);
      
      // Extraer el contenido string de cada pregunta
      const questionsForValidation = docQuestionsDB.map((questionObj, index) => {
        const questionText = typeof questionObj === 'string' ? questionObj : questionObj.question || questionObj.content || `Pregunta ${index + 1}`;
        console.log(`[DEBUG DocumentSectionSelector] Pregunta ${index + 1}:`, questionText);
        return questionText;
      });

      console.log('[DEBUG DocumentSectionSelector] Preguntas mapeadas exitosamente:', questionsForValidation.length);
      
      // Capturar la posición del botón si está disponible
      if (event && event.currentTarget) {
        const rect = event.currentTarget.getBoundingClientRect();
        const position = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
          scrollY: window.scrollY
        };
        setButtonPosition(position);
        console.log('[DEBUG DocumentSectionSelector] Posición del botón capturada:', position);
      }
      
      setDocValidationQuestions(questionsForValidation);
      setIsDocValidatorOpen(true);
      
      toast.success(`🚀 Validador avanzado preparado con ${questionsForValidation.length} preguntas del documento`);
    } catch (error) {
      console.error('[ERROR DocumentSectionSelector] Error en handleValidateDocQuestions:', error);
      toast.error('Error al preparar la validación avanzada');
    }
  };

  // ✨ Función para cerrar el validador del documento completo
  const handleCloseDocValidator = () => {
    setIsDocValidatorOpen(false);
    setDocValidationQuestions([]);
  };

  // Cargar contenido del documento al inicio
  useEffect(() => {
    const loadDocumentContent = async () => {
      try {
        await fetchDocQuestions?.({ page: 1, reset: true, showArchived: showArchivedQuestions });
      } catch (error) {
        console.error('Error loading document questions:', error);
      }
    };
    
  }, [documentId, showArchivedQuestions]);

  console.log("[DSS] Renderizando. Estado deletingSectionQuestionInfo:", deletingSectionQuestionInfo);

  const onGenerate = async (sectionId: string) => {
    const customTitleToUse = sectionCustomTitle || customTitle;
    await onGenerateQuestions(sectionId, customTitleToUse);
  };

  // Agrupar secciones
  const sectionsByGroup: Record<string, PrismaSection[]> = {};
  sections.forEach(section => {
    const groupName = (section as any).groupName || 'Sin grupo';
    if (!sectionsByGroup[groupName]) {
      sectionsByGroup[groupName] = [];
    }
    sectionsByGroup[groupName].push(section);
  });

  if (loadingSections) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
          <span className="text-muted-foreground">Cargando secciones...</span>
        </div>
      </Card>
    );
  }

  if (errorSections) {
    return (
      <Alert variant="error">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{errorSections}</AlertDescription>
      </Alert>
    );
  }

  if (!sections.length) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No hay secciones disponibles</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="w-full h-full flex flex-col overflow-visible">
      {/* Header del explorador */}
      <Card className="rounded-none border-x-0 border-t-0">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Explorador de Secciones</CardTitle>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onSectionSelect(null)}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Limpiar selección
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Barra de búsqueda */}
      <Card className="rounded-none border-x-0 border-t-0">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar en secciones..."
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-foreground 
                       placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary 
                       transition-all duration-200"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contenido principal */}
      <div className="flex-1 overflow-visible p-2 space-y-4">
        {/* Información del documento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-primary" />
              <span>{documentName}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Título personalizado */}
            <div>
              <label htmlFor="customTitle" className="block text-sm font-medium mb-2 text-foreground">
                Título personalizado para preguntas
              </label>
              <input
                id="customTitle"
                type="text"
                placeholder="Nombre de la norma (opcional)"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground 
                         placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary 
                         transition-all duration-200"
                value={customTitle || sectionCustomTitle}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setSectionCustomTitle(newValue);
                  if (onCustomTitleChange) {
                    onCustomTitleChange(newValue);
                  }
                }}
              />
            </div>

            {/* 🎯 NUEVO: Selector de tabla destino */}
            {onQuestionTableChange && (
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">
                  Tabla destino para preguntas
                </label>
                <QuestionTableSelector
                  selectedTable={selectedQuestionTable}
                  onTableChange={onQuestionTableChange}
                  className="w-full"
                />
              </div>
            )}

            {/* Configuración de preguntas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="numQuestions" className="block text-sm font-medium mb-2 text-foreground">
                  Número de preguntas
                </label>
                <div className="flex space-x-2">
                  <input
                    className="input flex-1"
                    id="numQuestions"
                    type="number"
                    min="1"
                    max="100"
                    value={numberOfQuestions}
                    onChange={(e) => handleNumQuestionsChange(parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Progreso</label>
                <Button 
                  variant="outline"
                  onClick={onProgressModeChange}
                  className="w-full justify-start"
                >
                  <Target className="w-4 h-4 mr-2" />
                  {progressMode === 'full' ? 'Completo' : 'Progresivo'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuración de procesamiento */}
        <Card>
          <CardHeader>
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setIsProcessingConfigExpanded(!isProcessingConfigExpanded)}
            >
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-primary" />
                <span>Modo de Procesamiento</span>
              </CardTitle>
              {isProcessingConfigExpanded ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
          {isProcessingConfigExpanded && (
            <CardContent className="space-y-4">
              <SectionProcessingConfig
                config={processingConfig}
                onConfigChange={onProcessingConfigChange}
                className="mb-4"
                documentId={documentId}
                documentContent={documentContent}
              />
              
              {/* Botón de reprocesamiento manual */}
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Reprocesar documento
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      console.log('🔄 Reprocesando documento manualmente...');
                      // Forzar recarga del documento
                      window.location.reload();
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors flex items-center space-x-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Reprocesar</span>
                  </button>
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                  <strong>Jerárquico + Artículos:</strong> Si seleccionaste procesamiento jerárquico con "ARTÍCULO" habilitado y no ves artículos individuales (Artículo 66, 67, etc.), haz clic para reprocesar.
                </p>
              </div>
              
              <div className="flex items-center justify-between space-x-2 p-3 bg-muted rounded-lg">
                <label htmlFor="totalQuestionsInput" className="text-sm font-medium text-foreground">
                  Preguntas totales:
                </label>
                <input
                  className="input w-20 text-center"
                  id="totalQuestionsInput"
                  type="number"
                  min="1"
                  max="500"
                  value={numberOfQuestions}
                  onChange={e => onNumberOfQuestionsChange(parseInt(e.target.value) || 1)}
                />
              </div>
            </CardContent>
          )}
        </Card>

        {/* Navegación del documento */}
        <Card>
          <CardHeader>
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => onSectionSelect(null)}
            >
              <CardTitle className={cn(
                "flex items-center space-x-2 transition-colors",
                !selectedSection ? "text-primary" : "text-foreground hover:text-primary"
              )}>
                <FileText className="w-5 h-5" />
                <span>Documento completo</span>
              </CardTitle>
              {!selectedSection && (
                <Badge variant="default">Seleccionado</Badge>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Sección de preguntas del documento completo */}
        <Card>
          <CardHeader>
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setShowDocQuestions(!showDocQuestions)}
            >
              <CardTitle className="flex items-center space-x-2">
                <Brain className="w-5 h-5 text-primary" />
                <span>Preguntas del documento completo</span>
                <Badge variant="secondary" className="ml-2">
                  {docQuestionsDB?.length || 0}
                </Badge>
              </CardTitle>
              <div className="flex items-center space-x-2">
                {showDocQuestions ? (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardHeader>
          
          {showDocQuestions && (
            <CardContent ref={docQuestionsRef} className="space-y-4">
              {/* Estadísticas */}
              {questionCounts && (
                <div className="grid grid-cols-3 gap-4">
                  <Card className="p-3">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      <div>
                        <p className="text-sm font-medium">Activas</p>
                        <p className="text-2xl font-bold text-success">{questionCounts.active}</p>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-3">
                    <div className="flex items-center space-x-2">
                      <Archive className="w-4 h-4 text-warning" />
                      <div>
                        <p className="text-sm font-medium">Archivadas</p>
                        <p className="text-2xl font-bold text-warning">{questionCounts.archived}</p>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-3">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Total</p>
                        <p className="text-2xl font-bold text-primary">{questionCounts.total}</p>
                      </div>
                    </div>
                  </Card>
                </div>
              )}
              
              {loadingDocQuestions && (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
                  <span className="text-muted-foreground">Cargando preguntas...</span>
                </div>
              )}
              
              {/* Botones de acción */}
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={archiveAllDocQuestions}
                  className="text-warning border-warning hover:bg-warning hover:text-white"
                >
                  <Archive className="w-4 h-4 mr-2" />
                  Archivar Todas
                </Button>
                
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={restoreAllDocQuestions}
                  className="text-success border-success hover:bg-success hover:text-white"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Restaurar Todas
                </Button>
                
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={handleSendAllDocQuestionsToTelegram}
                  disabled={isSendingAllDocQuestionsToTelegram}
                  className="text-sky-500 border-sky-500 hover:bg-sky-500 hover:text-white"
                >
                  {isSendingAllDocQuestionsToTelegram ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  {isSendingAllDocQuestionsToTelegram ? 'Enviando...' : 'Enviar a Telegram'}
                </Button>
                
                <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          
                                          const allQuestionsGift = docQuestionsDB
                                            .map((q: any) => q.content)
                                            .join('\n\n');
                                          setMoodleImportContent(allQuestionsGift);
                                          setMoodleImportOpen(true);
                                        }}
                                        disabled={!docQuestionsDB || docQuestionsDB.length === 0}
                                        className="text-indigo-500 border-indigo-500 hover:bg-indigo-500 hover:text-white"
                                      >
                                        <SchoolIcon className="w-4 h-4 mr-2" />
                                        Importar {showArchivedQuestions ? 'archivadas' : 'activas'} a Moodle ({docQuestionsDB?.length || 0})
                                      </Button>
                
                {/* Botón de validación IA */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => handleValidateDocQuestions(e)}
                  disabled={!docQuestionsDB || docQuestionsDB.length === 0}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 hover:from-purple-700 hover:to-blue-700"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Validación IA ({docQuestionsDB?.length || 0})
                </Button>
              </div>
              
              {/* Lista de preguntas */}
              <div className="space-y-3">
                {docQuestionsDB.map((q, idx) => (
                  <Card key={q.id} className="p-4">
                    <div className="flex justify-end gap-2 mb-3">
                      <Tooltip title="Editar pregunta">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingDocQuestion({ ...editingDocQuestion, [q.id]: q.content })}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Tooltip>
                      
                      <Tooltip title="Archivar pregunta">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            StorageService.archiveQuestions(documentId, [q.id]).then(() => {
                              fetchDocQuestions({ page: 1, reset: true, showArchived: showArchivedQuestions });
                              toast.success('Pregunta archivada');
                            });
                          }}
                          className="text-warning hover:text-warning"
                        >
                          <Archive className="w-4 h-4" />
                        </Button>
                      </Tooltip>
                      
                      <Tooltip title="Eliminar pregunta">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingDocQuestionId(q.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </Tooltip>
                      
                      <Tooltip title="Enviar a Telegram">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSendSingleQuestionToTelegram(q)}
                          disabled={isSendingToTelegram[q.id]}
                          className="text-sky-500 hover:text-sky-500"
                        >
                          {isSendingToTelegram[q.id] ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </Button>
                      </Tooltip>
                    </div>
                    
                    {editingDocQuestion[q.id] !== null && editingDocQuestion[q.id] !== undefined ? (
                      <div className="space-y-3">
                        <textarea
                          value={String(typeof editingDocQuestion[q.id] === 'string' ? editingDocQuestion[q.id] : (q.content ?? ''))}
                          onChange={e => setEditingDocQuestion({ ...editingDocQuestion, [q.id]: e.target.value })}
                          className="w-full min-h-[120px] p-3 rounded-lg border border-border bg-background text-foreground 
                                   focus:ring-2 focus:ring-primary focus:border-primary resize-y transition-all duration-200"
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { const copy = {...editingDocQuestion}; delete copy[q.id]; setEditingDocQuestion(copy); }}
                          >
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            onClick={async () => {
                              if (editingDocQuestion[q.id] !== null && editingDocQuestion[q.id] !== undefined && String(editingDocQuestion[q.id]) !== q.content) {
                                try {
                                  await StorageService.updateQuestion(documentId, q.id, { content: String(editingDocQuestion[q.id]) });
                                  fetchDocQuestions({ page: 1, reset: true, showArchived: showArchivedQuestions }); 
                                  toast.success('Pregunta actualizada');
                                } catch (err) {
                                  console.error("Error al actualizar la pregunta:", err);
                                  toast.error('Error al actualizar la pregunta');
                                }
                              }
                              const copy = {...editingDocQuestion}; delete copy[q.id]; setEditingDocQuestion(copy);
                            }}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Guardar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="prose prose-sm max-w-none">
                        {questionsViewMode === 'gift' ? (
                          <pre className="whitespace-pre-wrap font-mono text-sm bg-muted p-3 rounded-lg overflow-x-auto">
                            {q.content}
                          </pre>
                        ) : (
                          (() => {
                            try {
                              console.log(`[DEBUG] Parseando pregunta ${q.archived ? 'ARCHIVADA' : 'ACTIVA'} ID: ${q.id}`);
                              console.log(`[DEBUG] Contenido de la pregunta:`, q.content.substring(0, 200) + '...');
                              
                              const parsedQuestion = parseGiftQuestion(q.content);
                              
                              console.log(`[DEBUG] Pregunta parseada exitosamente:`, {
                                enunciado: parsedQuestion.enunciado?.substring(0, 100) + '...',
                                opciones: parsedQuestion.opciones?.length || 0
                              });
                              
                              return (
                                <div className="space-y-3">
                                  {/* Enunciado */}
                                  <div className="text-foreground">
                                    <div 
                                      dangerouslySetInnerHTML={{ __html: parsedQuestion.enunciado || 'Sin enunciado' }}
                                      className="prose prose-sm max-w-none"
                                    />
                                  </div>
                                  
                                  {/* Opciones */}
                                  {parsedQuestion.opciones && parsedQuestion.opciones.length > 0 && (
                                    <div className="space-y-2">
                                      {parsedQuestion.opciones.map((opcion, index) => (
                                        <div key={index} className={cn(
                                          "flex items-start space-x-2 p-2 rounded-lg",
                                          opcion.iscorrect ? "bg-success/10 border border-success/20" : "bg-muted"
                                        )}>
                                          <Badge 
                                            variant={opcion.iscorrect ? "default" : "secondary"}
                                            className="mt-0.5 text-xs"
                                          >
                                            {String.fromCharCode(65 + index)}
                                          </Badge>
                                          <div 
                                            dangerouslySetInnerHTML={{ __html: opcion.text }}
                                            className="flex-1 text-sm"
                                          />
                                          {opcion.iscorrect && (
                                            <CheckCircle className="w-4 h-4 text-success mt-0.5" />
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  
                                  {/* Retroalimentación */}
                                  {parsedQuestion.retroalimentacion && (
                                    <Alert>
                                      <AlertCircle className="h-4 w-4" />
                                      <AlertTitle>Retroalimentación</AlertTitle>
                                      <AlertDescription>
                                        <div dangerouslySetInnerHTML={{ __html: parsedQuestion.retroalimentacion }} />
                                      </AlertDescription>
                                    </Alert>
                                  )}
                                  
                                  {/* Información adicional */}
                                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <Badge variant="outline">
                                      Pregunta GIFT
                                    </Badge>
                                    {q.archived && (
                                      <Badge variant="secondary">
                                        <Archive className="w-3 h-3 mr-1" />
                                        Archivada
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              );
                            } catch (error) {
                              console.error(`[ERROR] Error al parsear pregunta ID: ${q.id}`, error);
                              return (
                                <Alert variant="error">
                                  <AlertCircle className="h-4 w-4" />
                                  <AlertTitle>Error al mostrar pregunta</AlertTitle>
                                  <AlertDescription>
                                    <details className="mt-2">
                                      <summary className="cursor-pointer">Ver contenido original</summary>
                                      <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                                        {q.content}
                                      </pre>
                                    </details>
                                  </AlertDescription>
                                </Alert>
                              );
                            }
                          })()
                        )}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Lista de secciones por grupos */}
        {Object.entries(sectionsByGroup).map(([groupName, groupSections]) => (
          <Card key={groupName}>
            <CardHeader>
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleSection(groupName)}
              >
                <CardTitle className="flex items-center space-x-2">
                  <FileBarChart className="w-5 h-5 text-primary" />
                  <span>{groupName}</span>
                  <Badge variant="secondary">{groupSections.length}</Badge>
                </CardTitle>
                {expandedSections[groupName] ? (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
            
            {expandedSections[groupName] && (
              <CardContent className="space-y-2">
                {groupSections.map((section) => {
                  const visibleSectionQuestions = (sectionQuestionsDB?.[section.id] || []).filter(
                    (q: any) => !getHiddenQuestionIdsForSection(section.id).includes(q.id)
                  );
                  const hasVisibleQuestions = visibleSectionQuestions.length > 0;
                  const hasHiddenQuestions = (hiddenSectionQuestionIdsMap[section.id] || []).length > 0;

                  return (
                    <Card key={section.id} className="border border-border">
                      {/* Header de la sección */}
                      <CardHeader className="pb-2">
                        <div 
                          className={cn(
                            "flex items-center justify-between cursor-pointer transition-colors",
                            selectedSection?.id === section.id ? "text-primary" : "text-foreground hover:text-primary"
                          )}
                          onClick={() => {
                            onSectionSelect(section);
                            toggleContent(section.id);
                          }}
                        >
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <FileText className="w-4 h-4 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium truncate" dangerouslySetInnerHTML={{ 
                                __html: highlightMatch(section.title, searchTerm) 
                              }} />
                              {section.content && (
                                <p className="text-sm text-muted-foreground truncate mt-1">
                                  {section.content.substring(0, 100)}...
                                </p>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 flex-shrink-0">
                              {hasVisibleQuestions && (
                                <Badge variant="default" className="text-xs">
                                  {visibleSectionQuestions.length} preguntas
                                </Badge>
                              )}
                              {selectedSection?.id === section.id && (
                                <Badge variant="default">Seleccionado</Badge>
                              )}
                            </div>
                          </div>
                          {expandedContent === section.id ? (
                            <ChevronDown className="w-4 h-4 flex-shrink-0" />
                          ) : (
                            <ChevronRight className="w-4 h-4 flex-shrink-0" />
                          )}
                        </div>
                      </CardHeader>
                      
                      {expandedContent === section.id && (
                        <CardContent className="space-y-4">
                          {/* Contenido de la sección */}
                          {renderContent ? renderContent(section) : (
                            <div className="prose prose-sm max-w-none text-foreground">
                              <div dangerouslySetInnerHTML={{ 
                                __html: highlightMatch(section.content, searchTerm) 
                              }} />
                            </div>
                          )}
                          
                          {/* Panel de preguntas de la sección */}
                          <Card className="bg-muted/50">
                            <CardHeader>
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-base">
                                  Preguntas de la sección: <span className="text-primary">{section.title}</span>
                                </CardTitle>
                                <div className="flex items-center space-x-2">
                                  {hasVisibleQuestions && (
                                    <>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleCleanAllForSection(section.id)}
                                        className="text-warning border-warning hover:bg-warning hover:text-white"
                                      >
                                        <EyeOff className="w-4 h-4 mr-2" />
                                        Limpiar Todas ({visibleSectionQuestions.length})
                                      </Button>
                                      
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleValidateAllSectionQuestions(section.id, section.title)}
                                        className="text-purple-500 border-purple-500 hover:bg-purple-500 hover:text-white"
                                      >
                                        <Brain className="w-4 h-4 mr-2" />
                                        Validar IA ({visibleSectionQuestions.length})
                                      </Button>
                                      
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          
                                          const allQuestionsGift = visibleSectionQuestions
                                            .map((q: any) => q.content)
                                            .join('\n\n');
                                          setMoodleImportContent(allQuestionsGift);
                                          setMoodleImportOpen(true);
                                        }}
                                        className="text-indigo-500 border-indigo-500 hover:bg-indigo-500 hover:text-white"
                                      >
                                        <SchoolIcon className="w-4 h-4 mr-2" />
                                        Importar a Moodle ({visibleSectionQuestions.length})
                                      </Button>
                                    </>
                                  )}
                                  
                                  {hasHiddenQuestions && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleRestoreAllForSection(section.id)}
                                      className="text-success border-success hover:bg-success hover:text-white"
                                    >
                                      <Eye className="w-4 h-4 mr-2" />
                                      Restaurar Todas ({(hiddenSectionQuestionIdsMap[section.id] || []).length})
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardHeader>
                            
                            <CardContent className="space-y-4">
                              {/* Configuración para esta sección */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Modo progresivo */}
                                <div className="flex items-center space-x-3">
                                  <button
                                    type="button"
                                    onClick={onProgressModeChange || (() => {})}
                                    className={cn(
                                      "relative inline-flex h-6 w-12 items-center rounded-full transition-colors duration-200",
                                      "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 border border-border",
                                      "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 border border-border",
                                      progressMode === 'progressive' ? 'bg-primary' : 'bg-muted'
                                    )}
                                  >
                                    <span
                                      className={cn(
                                        "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200",
                                        progressMode === 'progressive' ? 'translate-x-6' : 'translate-x-1'
                                      )}
                                    />
                                  </button>
                                  <label className="text-sm font-medium text-foreground">
                                    Modo progresivo
                                  </label>
                                </div>
                                
                                {/* Número de preguntas */}
                                <div className="flex items-center space-x-2">
                                  <label className="text-sm font-medium text-foreground">
                                    Preguntas:
                                  </label>
                                  <input
                                    type="number"
                                    min="1"
                                    max="500"
                                    value={numberOfQuestions}
                                    onChange={(e) => handleNumQuestionsChange(parseInt(e.target.value) || 2)}
                                    className="input w-20 text-center"
                                  />
                                  
                                  {/* Sugerencia */}
                                  {section.content && (
                                    <div className="space-y-2">
                                      {/* Toggle entre métodos */}
                                      <div className="flex flex-wrap items-center gap-2 p-2 bg-muted rounded-lg border border-border">
                                        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                                          Sugerencias:
                                        </span>
                                        
                                        <div className="flex flex-wrap gap-1">
                                          <button
                                            onClick={toggleSuggestionMethod}
                                            className={cn(
                                              "inline-flex items-center px-2 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap",
                                              !useIntelligentSuggestions 
                                                ? 'bg-primary text-primary-foreground' 
                                                : 'bg-background text-foreground border border-border hover:bg-muted'
                                            )}
                                          >
                                            <Calculator className="w-3 h-3 mr-1 flex-shrink-0" />
                                            Tradicional
                                          </button>
                                          
                                          <button
                                            onClick={toggleSuggestionMethod}
                                            className={cn(
                                              "inline-flex items-center px-2 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap",
                                              useIntelligentSuggestions 
                                                ? 'bg-primary text-primary-foreground' 
                                                : 'bg-background text-foreground border border-border hover:bg-muted'
                                            )}
                                          >
                                            <Brain className="w-3 h-3 mr-1 flex-shrink-0" />
                                            Inteligente
                                          </button>
                                        </div>
                                        
                                        {useIntelligentSuggestions && (
                                          <Badge variant="secondary" className="text-xs whitespace-nowrap">
                                            🧠 Análisis IA
                                          </Badge>
                                        )}
                                      </div>

                                      {/* Sugerencias tradicionales */}
                                      {!useIntelligentSuggestions && (
                                        <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                                          <span className="whitespace-nowrap">Sugerido: {getSuggestedQuestions(section.content)}</span>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleUseSuggested(getSuggestedQuestions(section.content))}
                                            disabled={numberOfQuestions === getSuggestedQuestions(section.content)}
                                            className="h-6 px-2 text-xs whitespace-nowrap"
                                          >
                                            Usar
                                          </Button>
                                        </div>
                                      )}

                                      {/* Sugerencias inteligentes */}
                                      {useIntelligentSuggestions && (
                                        <div className="space-y-2">
                                          {intelligentSuggestions[section.id]?.loading ? (
                                            <div className="flex flex-wrap items-center gap-2">
                                              <Loader2 className="w-3 h-3 animate-spin text-primary flex-shrink-0" />
                                              <span className="text-xs text-muted-foreground">
                                                Analizando sección...
                                              </span>
                                            </div>
                                          ) : intelligentSuggestions[section.id]?.analysis ? (
                                            <div className="space-y-2">
                                              <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                  Sugerido: {intelligentSuggestions[section.id].intelligent}
                                                </span>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => handleUseSuggested(intelligentSuggestions[section.id].intelligent)}
                                                  disabled={numberOfQuestions === intelligentSuggestions[section.id].intelligent}
                                                  className="h-6 px-2 text-xs whitespace-nowrap"
                                                >
                                                  Usar
                                                </Button>
                                                <Badge 
                                                  variant={
                                                    intelligentSuggestions[section.id].analysis.importance === 'high' 
                                                      ? 'destructive' :
                                                    intelligentSuggestions[section.id].analysis.importance === 'medium' 
                                                      ? 'default' : 'secondary'
                                                  }
                                                  className="text-xs whitespace-nowrap"
                                                >
                                                  {intelligentSuggestions[section.id].analysis.contentType}
                                                </Badge>
                                              </div>
                                              
                                              <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg border border-border">
                                                <div className="font-medium mb-2 text-foreground">📊 Análisis de la sección:</div>
                                                <div className="space-y-1">
                                                  <div className="break-words">• <span className="font-medium">Tipo:</span> {intelligentSuggestions[section.id].analysis.contentType}</div>
                                                  <div className="break-words">• <span className="font-medium">Densidad:</span> {intelligentSuggestions[section.id].analysis.conceptDensity}</div>
                                                  <div className="break-words">• <span className="font-medium">Importancia:</span> {intelligentSuggestions[section.id].analysis.importance}</div>
                                                </div>
                                                <div className="mt-2 pt-2 border-t border-border text-xs">
                                                  <span className="font-medium">Comparación:</span> 
                                                  <span className="break-words ml-1">
                                                    {getSuggestedQuestions(section.content)} → {intelligentSuggestions[section.id].intelligent}
                                                    <span className="ml-1">
                                                      {intelligentSuggestions[section.id].intelligent > getSuggestedQuestions(section.content) ? '⬆️' : 
                                                       intelligentSuggestions[section.id].intelligent < getSuggestedQuestions(section.content) ? '⬇️' : '➡️'}
                                                    </span>
                                                  </span>
                                                </div>
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                                              <span className="whitespace-nowrap">Sugerido: {getSuggestionValue(section.id, section.content)}</span>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleUseSuggested(getSuggestionValue(section.id, section.content))}
                                                disabled={numberOfQuestions === getSuggestionValue(section.id, section.content)}
                                                className="h-6 px-2 text-xs whitespace-nowrap"
                                              >
                                                Usar
                                              </Button>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                      
                                      <p className="text-xs text-muted-foreground break-words">
                                        {useIntelligentSuggestions 
                                          ? "🧠 Análisis basado en contenido y densidad conceptual"
                                          : "📏 Recomendación: ~1 pregunta por cada 100 palabras"
                                        }
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Generador de preguntas */}
                              <div className="bg-background rounded-lg border">
                                <QuestionGenerator
                                  isGenerating={isGenerating && selectedSection?.id === section.id}
                                  onGenerate={() => onGenerate(section.id)}
                                  questions={visibleSectionQuestions}
                                  sectionId={section.id}
                                  sectionQuestionsDB={visibleSectionQuestions}
                                  editingSectionQuestion={editingSectionQuestion}
                                  setEditingSectionQuestion={setEditingSectionQuestion}
                                  fetchSectionQuestions={fetchSectionQuestions}
                                  onDeletePermanent={(questionid) => handleDeletePermanentProp(questionid, section.id)}
                                  onCleanSingleSectionQuestion={(questionid) => handleCleanSingleSectionQuestion(section.id, questionid)}
                                  onSendToTelegram={onSendSectionQuestionToTelegram}
                                  isSendingToTelegram={isSendingSectionQuestionToTelegram}
                                  sourceText={section.content}
                                />
                              </div>
                            </CardContent>
                          </Card>
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Diálogo de confirmación para eliminar */}
      <DeleteConfirmDialog
        isOpen={deletingSectionQuestionInfo !== null}
        onClose={() => {
          console.log("[DSS] Cerrando diálogo (onClose). Estado actual:", deletingSectionQuestionInfo);
          setDeletingSectionQuestionInfo(null);
        }}
        onConfirm={() => {
          console.log("[DSS] Confirmando borrado. Estado actual:", deletingSectionQuestionInfo);
          if (deletingSectionQuestionInfo) {
            handleDeletePermanentInSection(deletingSectionQuestionInfo.sectionId, deletingSectionQuestionInfo.questionid);
          }
        }}
        title={deletingSectionQuestionInfo ? `la pregunta seleccionada (ID: ${deletingSectionQuestionInfo.questionid.substring(0,8)}...) de la sección` : "la pregunta de sección seleccionada"}
      />

      {/* Validador avanzado */}
      <AdvancedQuestionValidator
        isOpen={isValidatorOpen}
        onClose={handleCloseSectionValidator}
        questions={validationQuestions}
      />

      {/* ✨ Validador avanzado para preguntas del documento completo */}
      <AdvancedQuestionValidator
        isOpen={isDocValidatorOpen}
        onClose={handleCloseDocValidator}
        questions={docValidationQuestions}
        documentContent={documentContent}
        documentTitle={documentTitle || documentName}
        buttonPosition={buttonPosition}
        onValidationComplete={(results) => {
          console.log('🚀 Validación del documento completada:', results);
          toast.success(`✨ Validación completada: ${results.validCount}/${results.totalCount} preguntas válidas`);
        }}
      />

      {/* Popover para importar preguntas a Moodle */}
      {moodleImportOpen && (
        <MoodleImportPopover
          giftContent={moodleImportContent}
          onClose={() => {
            setMoodleImportOpen(false);
          }}
          onSuccess={(msg) => {
            toast.success(msg);
            setMoodleImportOpen(false);
          }}
          onError={(msg) => {
            toast.error(msg);
            setMoodleImportOpen(false);
          }}
        />
      )}
    </div>
  );
}
