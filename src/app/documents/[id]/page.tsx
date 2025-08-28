'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Loader2, ChevronLeft, Download, Copy, Trash2, Check, Play, Settings, RefreshCw, Wand2, FileText, AlertCircle, ChevronDown, ChevronUp, ChevronRight, Minimize2, Maximize2, Type, AlignLeft, Search, Eye, CheckCircle } from 'lucide-react';
import { StorageService } from '@/services/storageService';
import { AIService } from '@/services/aiService';
import { DocumentSectionService, ProcessingConfig, ProcessingMode } from '@/services/documentSectionService';
import type { document as PrismaDocument, section as PrismaSection, question as PrismaQuestion } from '@prisma/client';
import DocumentSectionSelector from '@/components/DocumentSectionSelector';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';
import QuestionValidationResults from '@/components/QuestionValidationResults';
import { PromptValidationService } from '@/services/promptValidationService';
import { ApiKeyManager } from '@/components/ApiKeyManager';
import type { OptionLengthType } from '@/services/aiService';
import { QuestionConfig } from '@/components/QuestionConfig';
import { questionTypes as baseQuestionTypes, difficultyLevels as baseDifficultyLevels } from '@/services/questionGeneratorService';
import { bloomLevels as baseBloomLevels } from '@/services/bloomTaxonomyService';
import rehypeRaw from 'rehype-raw';
import { MarkdownViewer } from '@/components/MarkdownViewer';
import { v4 as uuidv4 } from 'uuid';
import { parseGiftQuestion, type GiftParsedQuestion, type GiftOption } from '@/utils/giftParser';
import { MoodleQuestionView } from '@/components/MoodleQuestionView';
import { toast } from 'sonner';
import { shuffleOptionsForTelegram } from '@/utils/questionUtils';
import AdvancedQuestionValidator from '@/components/AdvancedQuestionValidator';
import QuestionTableSelector from '@/components/QuestionTableSelector';
import type { QuestionTableName } from '@/types/questionTables';

interface PageDocument extends Omit<PrismaDocument, 'type' | 'updatedat' | 'processingtime' | 'tokens'> {
  sections?: PrismaSection[];
  questions?: PrismaQuestion[];
  title: string;
  content: string;
  id: string;
  questionCount?: number;
  tokens?: number | null;
  processingtime?: number;
  type?: string;
  updatedat?: Date;
}

// Definición de los tipos de pregunta que se pasarán al selector
const questionTypeDefinitionsForSelector = [
  { id: 'textual', name: 'Preguntas textuales', description: 'Preguntas basadas directamente en el documento' },
  { id: 'blank', name: 'Espacios en blanco', description: 'Preguntas que requieren completar términos clave o datos numéricos' },
  { id: 'incorrect', name: 'Identificación de incorrectas', description: 'Preguntas que requieren identificar la respuesta INCORRECTA' },
  { id: 'none', name: 'Ninguna es correcta', description: 'Preguntas donde ninguna de las opciones es correcta' },
];

// Definición del tipo para el cuerpo de la solicitud de la API de Telegram
interface SendPollRequestBody {
  question: string;
  options: string[];
  correct_option_id: number;
  explanation?: string;
  chat_id?: string;
}

// --- Helpers para ocultar preguntas usando localStorage ---
function getHiddenQuestionIdsForDoc(documentId: string): string[] {
  if (typeof window === 'undefined') return [];
  return JSON.parse(localStorage.getItem(`hiddenQuestions_document_${documentId}`) || '[]');
}
function setHiddenQuestionIdsForDoc(documentId: string, ids: string[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`hiddenQuestions_document_${documentId}`, JSON.stringify(ids));
}
function getHiddenQuestionIdsForSection(sectionId: string): string[] {
  if (typeof window === 'undefined') return [];
  return JSON.parse(localStorage.getItem(`hiddenQuestions_section_${sectionId}`) || '[]');
}
function setHiddenQuestionIdsForSection(sectionId: string, ids: string[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`hiddenQuestions_section_${sectionId}`, JSON.stringify(ids));
}
// --- NUEVO: Restaurar todas las preguntas limpiadas (documento o sección) ---
/**
 * Restaura todas las preguntas ocultas (limpiadas) para un documento.
 * Borra los IDs ocultos en localStorage y actualiza el estado.
 */
function restoreAllHiddenQuestionsForDoc(documentId: string, fetchDocQuestions: () => void) {
  setHiddenQuestionIdsForDoc(documentId, []);
  fetchDocQuestions();
}
/**
 * Restaura todas las preguntas ocultas (limpiadas) para una sección.
 * Borra los IDs ocultos en localStorage y actualiza el estado.
 */
function restoreAllHiddenQuestionsForSection(sectionId: string, fetchSectionQuestions: (sectionId: string) => void) {
  setHiddenQuestionIdsForSection(sectionId, []);
  fetchSectionQuestions(sectionId);
}

// FUNCIÓN ACTUALIZADA para limpiar HTML para Telegram (más genérica)
function cleanHtmlForTelegram(htmlString: string | undefined): string {
  if (!htmlString) return '';
  // Reemplazar <br> o <br/> o <br /> por saltos de línea
  let cleanedString = htmlString.replace(/<br\s*\/?>/gi, '\n');
  // Quitar TODAS las etiquetas HTML restantes
  cleanedString = cleanedString.replace(/<[^>]*>/g, '');
  // Decodificar entidades HTML comunes (opcional, pero buena práctica)
  cleanedString = cleanedString.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&apos;/g, "'");
  return cleanedString;
}

export default function DocumentPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params?.id as string;

  const [currentDocument, setCurrentDocument] = useState<PageDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [copiedContent, setCopiedContent] = useState(false);
  const [copiedQuestions, setCopiedQuestions] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedSection, setSelectedSection] = useState<PrismaSection | null>(null);
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [numberOfQuestions, setNumberOfQuestions] = useState<number>(5);
  const [validationResults, setValidationResults] = useState<any | null>(null);
  const [sectionQuestions, setSectionQuestions] = useState<Record<string, string[]>>({});
  const [processingConfig, setProcessingConfig] = useState<ProcessingConfig>({
    mode: ProcessingMode.HIERARCHICAL,
    options: {
      minSectionLength: 100,
      maxSectionLength: 5000,
      hierarchical: {
        levels: ['Artículo', 'ARTÍCULO', 'Art.', 'ART.'],
        maxDepth: 1
      }
    }
  });
  const [questionTypeCounts, setQuestionTypeCounts] = useState<Record<string, number>>({});
  const [optionLength, setOptionLength] = useState<OptionLengthType>('media');
  const [isContentExpanded, setIsContentExpanded] = useState(false); // Para el documento completo
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [progressMode, setProgressMode] = useState<'full' | 'progressive'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('progressMode') as 'full' | 'progressive') || 'progressive';
    }
    return 'progressive';
  });
  const [questionTypes, setQuestionTypes] = useState<{ id: string; name: string; description: string; percentage: number; }[]>([
    { id: 'textual', name: 'Preguntas textuales', description: 'Preguntas tipo test tradicionales', percentage: 100 },
  ]);
  const [difficultyLevels, setDifficultyLevels] = useState<{ id: string; name: string; weight: number }[]>([
    { id: 'medium', name: 'Media', weight: 100 },
  ]);
  const [bloomLevels, setBloomLevels] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDocQuestions, setShowDocQuestions] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('showRightPanel');
      return stored === null ? true : stored === 'true';
    }
    return true;
  });
  const [questionsViewMode, setQuestionsViewMode] = useState<'gift' | 'moodle'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('questionsViewMode') as 'gift' | 'moodle') || 'gift';
    }
    return 'gift';
  });
  const [deleteDocQuestionsConfirm, setDeleteDocQuestionsConfirm] = useState(false);
  const [deleteSectionId, setDeleteSectionId] = useState<string | null>(null);
  const [customTitle, setCustomTitle] = useState<string>(() => {
    if (typeof window !== 'undefined' && documentId) {
      return localStorage.getItem(`customTitle_${documentId}`) || "";
    }
    return "";
  });

  // --- NUEVO: Estados para edición/borrado de preguntas ---
  const [editingSectionQuestion, setEditingSectionQuestion] = useState<{ [key: string]: string | undefined }>({});
  const [sectionQuestionsDB, setSectionQuestionsDB] = useState<Record<string, any[]>>({});
  const [loadingSectionQuestions, setLoadingSectionQuestions] = useState<Record<string, boolean>>({});
  const [editingDocQuestion, setEditingDocQuestion] = useState<{ [key: string]: string | undefined }>({});
  const [docQuestionsDB, setDocQuestionsDB] = useState<any[]>([]);
  const [loadingDocQuestions, setLoadingDocQuestions] = useState(false);
  const [deletingDocQuestionId, setDeletingDocQuestionId] = useState<string | null>(null);
  const [isSendingToTelegram, setIsSendingToTelegram] = useState<Record<string, boolean>>({});
  const [isSendingSectionQuestionToTelegram, setIsSendingSectionQuestionToTelegram] = useState<Record<string, boolean>>({});
  const [isSendingAllDocQuestionsToTelegram, setIsSendingAllDocQuestionsToTelegram] = useState(false);

  // Estados para paginación y filtros
  const [currentPage, setCurrentPage] = useState(1);
  const [questionsHasMore, setQuestionsHasMore] = useState(false);
  const [showArchivedQuestions, setShowArchivedQuestions] = useState(false);
  const [questionCounts, setQuestionCounts] = useState({ active: 0, archived: 0, total: 0 });
  const [searchQuestionTerm, setSearchQuestionTerm] = useState('');

  // ✅ NUEVO: Estados para validación masiva
  const [isValidatingAllDocQuestions, setIsValidatingAllDocQuestions] = useState(false);

  // ✨ Estados para el Validador Avanzado
  const [showAdvancedValidator, setShowAdvancedValidator] = useState(false);
  const [validatorQuestions, setValidatorQuestions] = useState<string[]>([]);
  const [advancedValidationResults, setAdvancedValidationResults] = useState<any>(null);

  // ✨ Estados para el validador del documento completo
  const [isDocValidatorOpen, setIsDocValidatorOpen] = useState(false);
  const [docValidationQuestions, setDocValidationQuestions] = useState<string[]>([]);
  const [documentContent, setDocumentContent] = useState<string>('');

  // 🎯 NUEVO: Estado para el selector de tabla
  const [selectedQuestionTable, setSelectedQuestionTable] = useState<QuestionTableName>('SectionQuestion');
  const [documentTitle, setDocumentTitle] = useState<string>('');
  const [buttonPosition, setButtonPosition] = useState<{ x: number; y: number; scrollY: number } | null>(null);

  // ✨ Preguntas de prueba temporales para testing
  const testQuestions = [
    "¿Qué es la programación según el documento?",
    "¿Cuáles son los tipos de datos más comunes mencionados?",
    "¿Qué son las funciones en programación?",
    "¿Qué incluyen las estructuras de control?",
    "¿Qué es un algoritmo según el texto?"
  ];

  // ✅ DEBUG: Agregar console.log para verificar el estado
  useEffect(() => {
    console.log('[DEBUG] showAdvancedValidator cambió a:', showAdvancedValidator);
    console.log('[DEBUG] validatorQuestions.length:', validatorQuestions.length);
  }, [showAdvancedValidator, validatorQuestions]);

  const loadDocument = async () => {
    if (!documentId) return;
    try {
      setLoading(true); setError(null);
      
      // 🔍 DEBUGGING: Cargar documento
      console.log('🔍 [DEBUG] Cargando documento:', documentId);
      const doc = await StorageService.getDocumentById(documentId);
      if (!doc) {
        setError('Documento no encontrado'); setLoading(false); return;
      }
      
      // 🔍 DEBUGGING: Información del documento
      console.log('🔍 [DEBUG] Documento cargado:', {
        id: doc.id,
        title: doc.title,
        contentLength: doc.content?.length || 0,
        type: doc.type,
        sectionsExist: !!doc.sections,
        sectionsCount: doc.sections?.length || 0
      });
      
      // 🔍 DEBUGGING: Procesar documento
      console.log('🔍 [DEBUG] Procesando documento...');
      const processedDoc = await DocumentSectionService.updateDocument(doc as any);
      
      // 🔍 DEBUGGING: Resultado del procesamiento
      console.log('🔍 [DEBUG] Documento procesado:', {
        id: processedDoc.id,
        title: processedDoc.title,
        sectionsAfterProcess: processedDoc.sections?.length || 0,
        sectionTitles: processedDoc.sections?.map(s => s.title).slice(0, 5) || []
      });
      
      setCurrentDocument(processedDoc as PageDocument);
    } catch (err: any) { 
      console.error('🔍 [DEBUG] Error al cargar documento:', err);
      setError('Error al cargar el documento: ' + err.message);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    AIService.initialize();
    loadDocument();
  }, [documentId]);

  useEffect(() => {
    if (documentId) {
      const config = DocumentSectionService.getProcessingConfig(documentId);
      setProcessingConfig(config);
    }
  }, [documentId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('showRightPanel', String(showRightPanel));
      localStorage.setItem('questionsViewMode', questionsViewMode);
    }
  }, [showRightPanel, questionsViewMode]);

  useEffect(() => {
    if (typeof window !== 'undefined' && documentId) {
      localStorage.setItem(`customTitle_${documentId}`, customTitle);
    }
  }, [customTitle, documentId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('progressMode', progressMode);
    }
  }, [progressMode]);

  const handleDelete = async () => {
    if (!documentId) return;

    try {
      await StorageService.deleteDocument(documentId);
      router.push('/documents');
    } catch (err) {
      console.error('Error al eliminar el documento:', err);
      setError('Error al eliminar el documento');
    }
  };

  const handleDownloadQuestionsText = async () => {
    if (!currentDocument || !currentDocument.questions || currentDocument.questions.length === 0) {
        alert('No hay preguntas generadas para descargar.');
        return;
    }
    const questionsText = currentDocument.questions.map(q => q.content).join('\n\n');
    const blob = new Blob([questionsText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Preguntas_${currentDocument.title.replace(/\s+/g, '_')}.gift`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyContent = async () => {
    if (!currentDocument) return;

    try {
      await navigator.clipboard.writeText(currentDocument.content);
      setCopiedContent(true);
      setTimeout(() => setCopiedContent(false), 2000);
    } catch (err) {
      console.error('Error al copiar al portapapeles:', err);
      setError('Error al copiar al portapapeles');
    }
  };

  const handleCopyQuestions = async () => {
    if (!currentDocument || !docQuestionsDB || docQuestionsDB.length === 0) {
        alert('No hay preguntas generadas para descargar.');
        return;
    }
    const questionsText = docQuestionsDB.map(q => q.content).join('\n\n');
    const blob = new Blob([questionsText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Preguntas_${currentDocument.title.replace(/\s+/g, '_')}.gift`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleGenerateQuestions = async (sectionId?: string, customTitleParam?: string, targetTable?: QuestionTableName): Promise<void> => {
    if (!documentId || !currentDocument) {
      setError('No hay ningún documento seleccionado');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      setValidationResults(null);

      // Obtener las secciones actualizadas antes de generar preguntas
      const sections = await DocumentSectionService.getSections(documentId);
      let questions: string;
      let targetSection: PrismaSection | null = null;

      if (sectionId) {
        // --- GENERACIÓN Y GUARDADO DE PREGUNTAS DE SECCIÓN ---
        targetSection = (sections.find(s => s.id === sectionId) || null) as PrismaSection | null;
        if (!targetSection?.content) {
          throw new Error('La sección seleccionada no tiene contenido');
        }
        
        // 🧹 NUEVO: Archivar preguntas anteriores antes de generar nuevas (mantiene historial en BD)
        console.log(`🧹 [handleGenerateQuestions] Archivando preguntas anteriores de la sección ${sectionId} (historial mantenido en BD)`);
        try {
          await StorageService.clearSectionQuestions(sectionId);
          console.log(`✅ [handleGenerateQuestions] Preguntas anteriores archivadas exitosamente (historial preservado en BD)`);
        } catch (clearError) {
          console.warn(`⚠️ [handleGenerateQuestions] Error al archivar preguntas anteriores (continuando con generación):`, clearError);
          // No detenemos el proceso, solo advertimos
        }
        
        // ✅ CORRECCIÓN: Usar AIService.generateQuestions correctamente CON CONFIGURACIONES
        questions = await AIService.generateQuestions(
          targetSection.content, // Contenido de la sección
          numberOfQuestions, 
          questionTypeCounts, // 🎯 APLICAR configuraciones guardadas 
          optionLength, 
          undefined, // modelOverride
          customTitleParam || customTitle // título personalizado
        );

        // --- CORRECCIÓN: Parseo más robusto de la salida de la IA para secciones ---
        let rawQuestions = questions.trim();
        let questionsArray: string[] = [];

        // NUEVO: Buscar preguntas usando el patrón de formato GIFT sin comentarios
        // Patrón: <b>TÍTULO</b><br><br> seguido de texto y {opciones}
        const questionPattern = /<b>[^<]+<\/b><br><br>[\s\S]*?{[\s\S]*?}/g;
        const questionMatches = rawQuestions.match(questionPattern);
        
        if (questionMatches && questionMatches.length > 0) {
          questionsArray = questionMatches.map(q => q.trim());
          console.log(`[handleGenerateQuestions] ✅ Encontradas ${questionsArray.length} preguntas usando patrón GIFT sin comentarios`);
        } else {
          // Fallback: Intentar separar por cualquier bloque que termine en }
          const fallbackPattern = /[^}]*{[^}]*}/g;
          const fallbackMatches = rawQuestions.match(fallbackPattern);
          if (fallbackMatches && fallbackMatches.length > 0) {
            questionsArray = fallbackMatches.map(q => q.trim());
            console.log(`[handleGenerateQuestions] ⚠️ Usando fallback, encontradas ${questionsArray.length} preguntas`);
          } else {
            // Si no se pueden separar, tratar toda la respuesta como una sola pregunta
            questionsArray = [rawQuestions];
            console.log(`[handleGenerateQuestions] ⚠️ No se pudieron separar preguntas, tratando como una sola`);
          }
        }

        // --- NUEVO: Validar y filtrar preguntas con parseGiftQuestion antes de guardar ---
        const validQuestionsForTelegram: string[] = [];
        const invalidQuestions: string[] = [];

        for (const q of questionsArray) {
            try {
                const parsed = parseGiftQuestion(q);
                // Verificar si el parseo fue exitoso y si tiene opciones (indicativo de formato quiz)
                if (parsed && parsed.opciones && parsed.opciones.length > 0) {
                    validQuestionsForTelegram.push(q);
                } else {
                    console.warn('[handleGenerateQuestions] Pregunta generada con formato inválido para Telegram (se omitirá):', q.substring(0, 200) + '...');
                    invalidQuestions.push(q);
                }
            } catch (parseError) {
                console.error('[handleGenerateQuestions] Error al parsear pregunta con GIFTParser (se omitirá):', q.substring(0, 200) + '...', 'Error:', parseError);
                invalidQuestions.push(q);
            }
        }

        if (validQuestionsForTelegram.length === 0) {
             // Si no hay preguntas válidas, lanzar un error específico o mostrar un mensaje
             const totalAttempted = questionsArray.length;
             const errorMsg = `No se generaron preguntas en un formato válido para Telegram. Intentos: ${totalAttempted}, Válidas: 0. Revise el prompt o la capacidad del modelo.`;
             console.error('[handleGenerateQuestions]', errorMsg, 'Preguntas inválidas:', invalidQuestions);
             setError(errorMsg); // Mostrar error al usuario
             setIsGenerating(false);
             return; // Detener el proceso si no hay preguntas válidas
        }

        // Validar y mostrar resultados (usando solo las preguntas válidas)
        const validationResults = await PromptValidationService.validateQuestionSet(validQuestionsForTelegram);
        setValidationResults({
          validCount: validationResults.validCount,
          totalCount: validQuestionsForTelegram.length,
          score: validationResults.totalScore,
          commonIssues: validationResults.commonIssues,
          recommendations: validationResults.recommendations
        });
        // 🎯 NUEVO: Guardar en la tabla seleccionada (SectionQuestion o tabla temática)
        const newQuestionsPayload = validQuestionsForTelegram.map((q) => ({ 
          content: q, 
          type: 'gift', 
          difficulty: 'medium', 
          bloomLevel: null, 
          lastScheduledSendAt: null,
          sendCount: 0,
          lastsuccessfulsendat: null,
          isActive: true
        }));
        
        let createdQuestionsWithIds: any[] = [];
        
        if (targetTable === 'SectionQuestion') {
          // Usar el método tradicional para SectionQuestion
          createdQuestionsWithIds = await StorageService.addMultipleSectionQuestions(sectionId, newQuestionsPayload);
          console.log('[DocumentPage.handleGenerateQuestions] createdQuestionsWithIds (SectionQuestion):', JSON.stringify(createdQuestionsWithIds, null, 2));
          
          // 🔧 FIX: Refrescar las preguntas desde la base de datos en lugar de actualizar directamente el estado
          // Esto asegura que mostramos exactamente lo que está en la BD después de la creación
          if (fetchSectionQuestions) {
            await fetchSectionQuestions(sectionId);
          }
        } else {
          // 🧹 NUEVO: Para tablas personalizadas, también archivar preguntas anteriores del mismo sectionId
          console.log(`🧹 [handleGenerateQuestions] Archivando preguntas anteriores de la tabla personalizada ${targetTable} para sectionId ${sectionId}`);
          try {
            // 🔧 FIX: Verificar que targetTable no sea undefined antes de llamar a clearCustomTableQuestions
            if (targetTable) {
              await StorageService.clearCustomTableQuestions(targetTable, sectionId);
              console.log(`✅ [handleGenerateQuestions] Preguntas anteriores archivadas en tabla ${targetTable} (historial preservado)`);
            }
          } catch (clearError) {
            console.warn(`⚠️ [handleGenerateQuestions] Error al archivar preguntas anteriores en tabla ${targetTable} (continuando):`, clearError);
          }
          
          // Usar el nuevo método para tablas temáticas
          createdQuestionsWithIds = await StorageService.addQuestionsToCustomTable(
            targetTable || 'SectionQuestion',
            newQuestionsPayload,
            sectionId,
            documentId
          );
          console.log(`[DocumentPage.handleGenerateQuestions] createdQuestionsWithIds (${targetTable}):`, JSON.stringify(createdQuestionsWithIds, null, 2));
          
          // 🎯 NUEVA LÓGICA: Para tablas temáticas, crear preguntas temporales para mostrar en UI
          // Esto permite al usuario ver inmediatamente las preguntas generadas con un indicador de la tabla destino
          const tempQuestionsForUI = createdQuestionsWithIds.map((q, index) => ({
            id: `temp-${targetTable}-${sectionId}-${index}`,
            content: newQuestionsPayload[index].content,
            isTemporary: true,
            savedInTable: targetTable,
            type: newQuestionsPayload[index].type,
            difficulty: newQuestionsPayload[index].difficulty,
            createdAt: new Date().toISOString(),
            sectionId: sectionId
          }));
          
          // Actualizar sectionQuestionsDB con las preguntas temporales para mostrar en UI
          setSectionQuestionsDB(prev => ({ 
            ...prev, 
            [sectionId]: tempQuestionsForUI 
          }));
          
          console.log(`✅ [handleGenerateQuestions] ${createdQuestionsWithIds.length} preguntas guardadas en tabla personalizada: ${targetTable} y mostradas temporalmente en UI`);
        }
        
        const tableDisplayName = targetTable === 'SectionQuestion' ? 'SectionQuestion' : targetTable;
        
        if (targetTable === 'SectionQuestion') {
          toast.success(`✅ ${createdQuestionsWithIds.length} pregunta(s) generada(s) y guardada(s) en ${tableDisplayName} exitosamente.`);
        } else {
          toast.success(`✅ ${createdQuestionsWithIds.length} pregunta(s) generada(s) y guardada(s) en tabla "${tableDisplayName}" exitosamente.\n\n👁️ Ahora puedes verlas temporalmente en la UI de la sección.\n📊 Están guardadas permanentemente en la tabla personalizada.`, {
            duration: 7000
          });
        }

        setIsGenerating(false);
        return; // Ensure void return after successful section generation
      }

      // --- GENERACIÓN Y GUARDADO DE PREGUNTAS DEL DOCUMENTO COMPLETO ---
      if (!currentDocument.content) {
        throw new Error('El documento no tiene contenido');
      }
      
      // ✅ CORRECCIÓN: Usar AIService.generateQuestions correctamente CON CONFIGURACIONES
      questions = await AIService.generateQuestions(
        currentDocument.content, // Contenido del documento completo
        numberOfQuestions, 
        questionTypeCounts, // 🎯 APLICAR configuraciones guardadas
        optionLength, 
        undefined, // modelOverride
        customTitleParam || customTitle // título personalizado
      );

      // --- CORRECCIÓN: Parseo más robusto de la salida de la IA para documento completo ---
      let rawQuestions = questions.trim();
      let questionsArray: string[] = [];

      // NUEVO: Buscar preguntas usando el patrón de formato GIFT sin comentarios
      // Patrón: <b>TÍTULO</b><br><br> seguido de texto y {opciones}
      const questionPattern = /<b>[^<]+<\/b><br><br>[\s\S]*?{[\s\S]*?}/g;
      const questionMatches = rawQuestions.match(questionPattern);
      
      if (questionMatches && questionMatches.length > 0) {
        questionsArray = questionMatches.map(q => q.trim());
        console.log(`[handleGenerateQuestions - Doc] ✅ Encontradas ${questionsArray.length} preguntas usando patrón GIFT sin comentarios`);
      } else {
        // Fallback: Intentar separar por cualquier bloque que termine en }
        const fallbackPattern = /[^}]*{[^}]*}/g;
        const fallbackMatches = rawQuestions.match(fallbackPattern);
        if (fallbackMatches && fallbackMatches.length > 0) {
          questionsArray = fallbackMatches.map(q => q.trim());
          console.log(`[handleGenerateQuestions - Doc] ⚠️ Usando fallback, encontradas ${questionsArray.length} preguntas`);
        } else {
          // Si no se pueden separar, tratar toda la respuesta como una sola pregunta
          questionsArray = [rawQuestions];
          console.log(`[handleGenerateQuestions - Doc] ⚠️ No se pudieron separar preguntas, tratando como una sola`);
        }
      }

      // --- NUEVO: Validar y filtrar preguntas con parseGiftQuestion antes de guardar (Documento completo) ---
      const validDocQuestions: string[] = [];
      const invalidDocQuestions: string[] = [];

      for (const q of questionsArray) {
          try {
              const parsed = parseGiftQuestion(q);
               // Verificar si el parseo fue exitoso y si tiene opciones (indicativo de formato quiz)
              if (parsed && parsed.opciones && parsed.opciones.length > 0) {
                  validDocQuestions.push(q);
              } else {
                   console.warn('[handleGenerateQuestions - Doc] Pregunta generada con formato inválido para Telegram (se omitirá):', q.substring(0, 200) + '...');
                   invalidDocQuestions.push(q);
              }
          } catch (parseError) {
              console.error('[handleGenerateQuestions - Doc] Error al parsear pregunta con GIFTParser (se omitirá):', q.substring(0, 200) + '...', 'Error:', parseError);
              invalidDocQuestions.push(q);
          }
      }

      if (validDocQuestions.length === 0) {
         const totalAttempted = questionsArray.length;
         const errorMsg = `No se generaron preguntas válidas para el documento completo. Intentos: ${totalAttempted}, Válidas: 0. Revise el prompt o la capacidad del modelo.`;
         console.error('[handleGenerateQuestions - Doc]', errorMsg, 'Preguntas inválidas:', invalidDocQuestions);
         setError(errorMsg); // Mostrar error al usuario
         setIsGenerating(false);
         return; // Detener el proceso si no hay preguntas válidas
      }

      if (questionsArray.length === 0) { // Esta validación antigua ya no es necesaria si validDocQuestions.length === 0
        throw new Error('El formato de las preguntas generadas no es válido');
      }
      const validationResults = await PromptValidationService.validateQuestionSet(validDocQuestions); // Usar solo las válidas
      setValidationResults({
        validCount: validationResults.validCount,
        totalCount: validDocQuestions.length,
        score: validationResults.totalScore,
        commonIssues: validationResults.commonIssues,
        recommendations: validationResults.recommendations
      });
      // Guardar en la base de datos SOLO en Question (sectionId: null)
      const newDocQuestions = validDocQuestions.map((q: string) => ({ 
            documentId, 
            content: q, 
            type: 'gift', 
            difficulty: 'medium', 
            bloomLevel: null, 
            sectionId: null, 
            archived: false, 
            lastScheduledSendAt: null,
            sendCount: 0,
            lastsuccessfulsendat: null
          })); // Added type string to q
      await Promise.all(newDocQuestions.map(q => StorageService.addQuestion(q)));
      
      // ✅ CORRECCIÓN: Actualizar la lista de preguntas manteniendo el filtro actual
      // Si estábamos viendo archivadas, seguir viendo solo archivadas (las nuevas son activas, no aparecerán)
      // Si estábamos viendo activas, veremos las nuevas + las activas existentes
      await fetchDocQuestions({ 
        page: 1, 
        reset: true, 
        showArchived: showArchivedQuestions  // Mantener el filtro actual
      });
      
      // Toast informativo basado en el filtro actual
      if (showArchivedQuestions) {
        toast.success(`✅ ${validDocQuestions.length} preguntas generadas como ACTIVAS.\n💡 Cambia a vista "Activas" para verlas.`, {
          duration: 5000
        });
      } else {
        toast.success(`✅ ${validDocQuestions.length} preguntas generadas correctamente y añadidas a la lista.`);
      }
      
      setIsGenerating(false);
    } catch (err) {
      setIsGenerating(false);
      setError('Error al generar preguntas: ' + (err instanceof Error ? err.message : String(err)));
      return; // Ensure void return in catch block
    }
  };

  const handleSectionSelect = (section: PrismaSection | null) => {
    setSelectedSection(section);
  };

  const handleProcessingConfigChange = (newConfig: ProcessingConfig) => {
    if (!currentDocument?.id) return;
    
    setProcessingConfig(newConfig);
    DocumentSectionService.saveProcessingConfig(currentDocument.id, newConfig);
    
    // Recargar las secciones si el modo cambió O si cambiaron las opciones jerárquicas
    const shouldReload = processingConfig && (
      newConfig.mode !== processingConfig.mode ||
      (newConfig.mode === 'HIERARCHICAL' && 
       JSON.stringify(newConfig.options.hierarchical) !== JSON.stringify(processingConfig.options.hierarchical))
    );
    
    if (shouldReload) {
      console.log('🔄 Configuración de procesamiento cambió, recargando documento...', {
        oldMode: processingConfig.mode,
        newMode: newConfig.mode,
        oldHierarchical: processingConfig.options.hierarchical,
        newHierarchical: newConfig.options.hierarchical
      });
      
      // Mostrar mensaje de carga
      setLoading(true);
      setError(null);
      
      // Recargar después de un pequeño delay para que se vea el loading
      setTimeout(() => {
        loadDocument();
      }, 100);
    }
  };

  const handleProgressModeChange = () => {
    setProgressMode(prev => prev === 'full' ? 'progressive' : 'full');
  };

  // ✅ NUEVO: Función para alternar expansión de una sección específica
  const toggleSectionExpansion = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // ✅ MEJORADO: renderContentWithToggle ahora acepta sectionId para expansión individual
  const renderContentWithToggle = (content: string, type: string | null, sectionId?: string) => {
    const characterLimit = 500;
    const isLongContent = content.length > characterLimit;
    
    // Si no es contenido largo, mostrar completo
    if (!isLongContent) {
      if (type === 'text/markdown' || type === 'markdown') {
        return <div className="prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none"><ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown></div>;
      }
      return <pre className="whitespace-pre-wrap break-words overflow-x-auto text-sm text-foreground bg-muted p-4 rounded-md">{content}</pre>;
    }
    
    // Para contenido largo, verificar si está expandido
    const isExpanded = sectionId ? expandedSections[sectionId] : isContentExpanded;
    const isContentTruncated = !isExpanded;
    
    const displayContent = isContentTruncated ? `${content.substring(0, characterLimit)}...` : content;
    
    // Estadísticas del contenido
    const wordCount = content.split(/\\s+/).filter(word => word.length > 0).length;
    const characterCount = content.length;
    const paragraphCount = content.split('\\n\\n').filter(p => p.trim().length > 0).length;
    
    const contentElement = type === 'text/markdown' || type === 'markdown' ? (
      <div className="prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayContent}</ReactMarkdown>
      </div>
    ) : (
      <pre className="whitespace-pre-wrap break-words overflow-x-auto text-sm text-foreground bg-muted p-4 rounded-md">{displayContent}</pre>
    );
    
    return (
      <div className="space-y-4">
        {contentElement}
        
        {/* ✅ Panel de control de expansión con estadísticas */}
        <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
              <span className="flex items-center space-x-1">
                <FileText className="w-3 h-3" />
                <span>{characterCount.toLocaleString()} caracteres</span>
              </span>
              <span className="flex items-center space-x-1">
                <Type className="w-3 h-3" />
                <span>{wordCount.toLocaleString()} palabras</span>
              </span>
              <span className="flex items-center space-x-1">
                <AlignLeft className="w-3 h-3" />
                <span>{paragraphCount.toLocaleString()} párrafos</span>
              </span>
            </div>
            
            <button
              onClick={() => {
                if (sectionId) {
                  toggleSectionExpansion(sectionId);
                } else {
                  setIsContentExpanded(!isContentExpanded);
                }
              }}
              className="flex items-center space-x-2 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-md transition-colors text-sm font-medium"
            >
              {isExpanded ? (
                <>
                  <Minimize2 className="w-4 h-4" />
                  <span>Contraer contenido</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4" />
                  <span>Ver contenido completo</span>
                </>
              )}
            </button>
          </div>
          
          {/* ✅ Barra de progreso visual */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Contenido mostrado</span>
              <span>{isExpanded ? '100%' : `${Math.round((characterLimit / characterCount) * 100)}%`}</span>
            </div>
            <div className="w-full bg-muted-foreground/20 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: isExpanded ? '100%' : `${Math.min(100, (characterLimit / characterCount) * 100)}%` 
                }}
              />
            </div>
          </div>
          
          {/* ✅ Mensajes contextuales */}
          {isExpanded ? (
            <div className="mt-3 text-xs text-muted-foreground flex items-center space-x-4">
              <span className="flex items-center space-x-1">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span>Contenido completamente expandido</span>
              </span>
              <span className="flex items-center space-x-1">
                <Search className="w-3 h-3" />
                <span>Usa Ctrl+F para buscar texto específico</span>
              </span>
            </div>
          ) : (
            <div className="mt-3 text-xs text-muted-foreground flex items-center space-x-1">
              <Eye className="w-3 h-3" />
              <span>Vista previa: {characterLimit.toLocaleString()} de {characterCount.toLocaleString()} caracteres</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  function normalizeText(text: string) {
    // Quita tildes, pasa a minúsculas y elimina puntuación
    return text
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quita tildes correctamente
      .toLowerCase()
      .replace(/[.,:;¡!¿?"'`´\-]/g, '') // quita puntuación
      .replace(/\s+/g, ' ');
  }

  function highlightMarkdown(text: string, query: string) {
    if (!query) return text;
    // Divide el término de búsqueda en palabras normalizadas
    const words = query.trim().split(/\s+/).filter(Boolean).map(normalizeText);
    if (words.length === 0) return text;
    // Prepara el texto original y el texto normalizado
    let result = '';
    let i = 0;
    const original = text;
    const normalized = normalizeText(text);
    while (i < original.length) {
      let matched = false;
      for (const word of words) {
        if (!word) continue;
        // Busca la palabra normalizada en la posición actual
        const normSlice = normalizeText(original.slice(i, i + word.length));
        if (normSlice === word) {
          result += `<span class=\"bg-yellow-300 text-accent-foreground font-semibold rounded px-0.5\">${original.slice(i, i + word.length)}</span>`;
          i += word.length;
          matched = true;
          break;
        }
      }
      if (!matched) {
        result += original[i];
        i++;
      }
    }
    return result;
  }

  // Función para eliminar preguntas del documento completo
  const deleteAllDocQuestions = () => {
    if (!currentDocument) return;
    const updatedDoc: PageDocument = {
        ...currentDocument,
        questions: [],
        questionCount: 0,
        updatedat: new Date()
      };
    StorageService.saveDocument({
          ...updatedDoc,
          tokens: updatedDoc.tokens || undefined,
          processingtime: updatedDoc.processingtime || undefined
        }).then(savedDoc => {
          setCurrentDocument({
          ...savedDoc,
          tokens: currentDocument.tokens,
          processingtime: currentDocument.processingtime,
          title: savedDoc.title || '', // Asegurar que title esté presente
          content: savedDoc.content || '', // Asegurar que content esté presente
          id: savedDoc.id || documentId // Asegurar que id esté presente
        } as PageDocument);
      setDeleteDocQuestionsConfirm(false);
    });
  };

  // Función para eliminar preguntas por sección
  const deleteSectionQuestions = (sectionId: string) => {
    setSectionQuestions(prev => {
      const updated = { ...prev };
      delete updated[sectionId];
      return updated;
    });
    setDeleteSectionId(null);
  };

  // Nueva función para eliminar una sola pregunta del documento completo
  const handleDeleteSingleQuestion = (questionid: string) => {
    if (!currentDocument) return;
    const updatedQuestions = (currentDocument.questions ?? []).filter(q => q.id !== questionid);
    console.log('[DEBUG] Eliminando pregunta:', questionid);
    console.log('[DEBUG] Preguntas restantes:', updatedQuestions);
    const updatedDoc = {
      ...currentDocument,
      questions: updatedQuestions,
      questionCount: updatedQuestions.length,
      updatedAt: new Date()
    };
    StorageService.saveDocument(updatedDoc).then(savedDoc => {
      console.log('[DEBUG] Documento guardado tras eliminar pregunta:', savedDoc);
      setCurrentDocument({
        ...savedDoc,
        tokens: currentDocument.tokens,
        processingtime: currentDocument.processingtime,
        title: savedDoc.title || '', 
        content: savedDoc.content || '',
        id: savedDoc.id || documentId,
        date: savedDoc.date || new Date(),
        questioncount: savedDoc.questioncount || 0,
        createdat: savedDoc.createdat || new Date(),
        trial745: savedDoc.trial745 || false
      } as PageDocument);
    });
  };

  // Función para eliminar una sola pregunta de una sección (solo estado local)
  const handleDeleteSingleSectionQuestion = (sectionId: string, questionIndex: number) => {
    if (!currentDocument) return;

    const questionContentToDelete = sectionQuestions[sectionId]?.[questionIndex];

    if (!questionContentToDelete) {
      console.error('[handleDeleteSingleSectionQuestion] No se pudo encontrar el contenido de la pregunta de sección a eliminar. sectionId:', sectionId, 'questionIndex:', questionIndex);
      return;
    }

    console.log('[DEBUG handleDeleteSingleSectionQuestion] Intentando eliminar:', { sectionId, questionIndex, questionContentToDelete });
    console.log('[DEBUG handleDeleteSingleSectionQuestion] currentDocument.questions ANTES de filtrar (primeras 5 para brevedad):', JSON.stringify(currentDocument.questions?.slice(0,5), null, 2));

    setSectionQuestions(prev => {
      const updated = { ...prev };
      if (!updated[sectionId]) return updated;
      updated[sectionId] = updated[sectionId].filter((_, idx) => idx !== questionIndex);
      return updated;
    });

    let questionFoundAndRemoved = false;
    const updatedDocumentQuestions = (currentDocument.questions ?? []).filter(q => {
      const isMatch = q.sectionid === sectionId && q.content === questionContentToDelete;
      if (isMatch && !questionFoundAndRemoved) {
        console.log('[DEBUG handleDeleteSingleSectionQuestion] Coincidencia encontrada y eliminando de currentDocument.questions:', JSON.stringify(q, null, 2));
        questionFoundAndRemoved = true;
        return false;
      }
      return true;
    });

    console.log('[DEBUG handleDeleteSingleSectionQuestion] ¿Se encontró y eliminó la pregunta de currentDocument.questions?:', questionFoundAndRemoved);
    console.log('[DEBUG handleDeleteSingleSectionQuestion] updatedDocumentQuestions DESPUÉS de filtrar (primeras 5 para brevedad):', JSON.stringify(updatedDocumentQuestions.slice(0,5), null, 2));

    if (!questionFoundAndRemoved) {
      console.warn('[handleDeleteSingleSectionQuestion] No se encontró la pregunta de sección en currentDocument.questions para eliminarla de la BD. Contenido:', questionContentToDelete, 'SectionID:', sectionId);
    }
    
    const updatedDoc: PageDocument = {
      ...currentDocument,
      questions: updatedDocumentQuestions,
      questionCount: updatedDocumentQuestions.length,
      updatedat: new Date()
    };

    StorageService.saveDocument({
      ...updatedDoc,
      tokens: updatedDoc.tokens || undefined,
      processingtime: updatedDoc.processingtime || undefined
    }).then(savedDoc => {
      setCurrentDocument({
        ...savedDoc,
        tokens: currentDocument.tokens,
        processingtime: currentDocument.processingtime,
        title: savedDoc.title || '', // Asegurar que title esté presente
        content: savedDoc.content || '', // Asegurar que content esté presente
        id: savedDoc.id || documentId // Asegurar que id esté presente
      } as PageDocument); 
      console.log('[handleDeleteSingleSectionQuestion] Documento guardado. currentDocument.questions DEBERÍA estar actualizado.');
    }).catch(err => {
      setError('Error al guardar el documento tras eliminar pregunta de sección: ' + (err instanceof Error ? err.message : String(err)));
      console.error('[handleDeleteSingleSectionQuestion] Error al guardar:', err);
    });
  };

  const fetchSectionQuestions = async (sectionId: string) => {
    setLoadingSectionQuestions(prev => ({ ...prev, [sectionId]: true }));
    const questions = await StorageService.getQuestionsForSection(sectionId);
    setSectionQuestionsDB(prev => ({ ...prev, [sectionId]: questions }));
    setLoadingSectionQuestions(prev => ({ ...prev, [sectionId]: false }));
  };

  // Función actualizada para cargar preguntas con paginación
  const fetchDocQuestions = async (options?: { 
    page?: number; 
    reset?: boolean; 
    showArchived?: boolean;
    search?: string;
  }) => {
    const {
      page = 1,
      reset = false,
      showArchived = showArchivedQuestions,
      search = searchQuestionTerm
    } = options || {};

    setLoadingDocQuestions(true);
    try {
      const response = await StorageService.getQuestionsForDocument(documentId, {
        page,
        limit: 50,
        showArchived,
        search
      });
      
      console.log("[DEBUG fetchDocQuestions] Respuesta recibida:", response);
      
      if (reset || page === 1) {
        setDocQuestionsDB(response.questions);
      } else {
        setDocQuestionsDB(prev => [...prev, ...response.questions]);
      }
      
      setCurrentPage(page);
      setQuestionsHasMore(response.pagination.hasMore);
      setQuestionCounts(response.counts);
      
    } catch (fetchError) {
      console.error("Error en fetchDocQuestions:", fetchError);
      setError("Error al recargar las preguntas del documento. Revisa la consola para más detalles."); 
    } finally {
      setLoadingDocQuestions(false);
    }
  };

  // Función para cargar más preguntas (scroll infinito)
  const loadMoreQuestions = () => {
    if (!loadingDocQuestions && questionsHasMore) {
      fetchDocQuestions({ page: currentPage + 1, showArchived: showArchivedQuestions });
    }
  };

  // Función para archivar todas las preguntas activas
  const archiveAllDocQuestions = async () => {
    try {
      const result = await StorageService.archiveAllQuestions(documentId);
      console.log("[DEBUG] Preguntas archivadas:", result);
      setQuestionCounts(result.counts);
      // Recargar la primera página manteniendo el filtro actual
      fetchDocQuestions({ page: 1, reset: true, showArchived: showArchivedQuestions });
      toast.success(`${result.updated} preguntas archivadas correctamente`);
    } catch (error) {
      console.error("Error al archivar preguntas:", error);
      toast.error("Error al archivar las preguntas");
    }
  };

  // Función para restaurar todas las preguntas archivadas
  const restoreAllDocQuestions = async () => {
    try {
      const result = await StorageService.restoreAllQuestions(documentId);
      console.log("[DEBUG] Preguntas restauradas:", result);
      setQuestionCounts(result.counts);
      // Recargar la primera página manteniendo el filtro actual
      fetchDocQuestions({ page: 1, reset: true, showArchived: showArchivedQuestions });
      toast.success(`${result.restored} preguntas restauradas correctamente`);
    } catch (error) {
      console.error("Error al restaurar preguntas:", error);
      toast.error("Error al restaurar las preguntas");
    }
  };

  // Función para toggle de mostrar archivadas
  const toggleShowArchived = () => {
    const newShowArchived = !showArchivedQuestions;
    setShowArchivedQuestions(newShowArchived);
    setCurrentPage(1);
    fetchDocQuestions({ page: 1, reset: true, showArchived: newShowArchived });
  };

  // Función para buscar preguntas
  const handleSearchQuestions = (term: string) => {
    setSearchQuestionTerm(term);
    setCurrentPage(1);
    fetchDocQuestions({ page: 1, reset: true, search: term, showArchived: showArchivedQuestions });
  };

  useEffect(() => {
    if (documentId) fetchDocQuestions({ showArchived: showArchivedQuestions });
  }, [documentId, showArchivedQuestions]);

  const handleGenerateDocQuestions = async () => {
    return handleGenerateQuestions("", customTitle);
  };

  const handleSendAllDocQuestionsToTelegram = async () => {
    if (!currentDocument || !currentDocument.questions || currentDocument.questions.length === 0) {
      toast.error('No hay preguntas de documento para enviar a Telegram.');
      return;
    }
    setIsSendingAllDocQuestionsToTelegram(true);
    const toastId = toast.loading('Enviando todas las preguntas del documento a Telegram...');
    let successCount = 0;
    let errorCount = 0;

    for (const questionObject of currentDocument.questions) {
      try {
        const parsedQuestion = parseGiftQuestion(questionObject.content);
        if (!parsedQuestion || !parsedQuestion.enunciado) {
          console.warn('No se pudo parsear la pregunta GIFT o falta el enunciado:', questionObject.content);
          errorCount++;
          continue;
        }

        let questionText = cleanHtmlForTelegram(parsedQuestion.enunciado);
        if (questionText.length > 300) questionText = questionText.substring(0, 297) + "...";

        let optionsTexts: string[] = parsedQuestion.opciones.map(opt => {
          let optText = cleanHtmlForTelegram(opt.text);
          if (optText.length > 100) optText = optText.substring(0, 97) + "...";
          return optText;
        });
        
        const correctOptIndex = parsedQuestion.opciones.findIndex(opt => opt.iscorrect);

        if (optionsTexts.length === 0 || correctOptIndex === -1) {
          console.warn('Pregunta sin opciones o sin respuesta correcta definida:', parsedQuestion);
          errorCount++;
          continue;
        }

        let explanationText = parsedQuestion.retroalimentacion ? cleanHtmlForTelegram(parsedQuestion.retroalimentacion) : undefined;
        if (explanationText && explanationText.length > 200) explanationText = explanationText.substring(0, 197) + "...";

        const pollData: SendPollRequestBody = {
          question: questionText,
          options: optionsTexts,
          correct_option_id: correctOptIndex,
          explanation: explanationText,
          chat_id: process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID
        };

        const randomizedPollData = shuffleOptionsForTelegram(pollData);

        const response = await fetch('/api/telegram/send-question', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(randomizedPollData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error al enviar pregunta:', errorData.message || 'Error desconocido', 'Payload:', randomizedPollData);
          errorCount++;
        } else {
          successCount++;
        }
        await new Promise(resolve => setTimeout(resolve, 300)); 
      } catch (err: any) {
        console.error('Error en el bucle de envío de preguntas:', err);
        errorCount++;
      }
    }
    setIsSendingAllDocQuestionsToTelegram(false);
    if (errorCount > 0) {
      toast.error(
        `Envío completado con errores. ${successCount} enviadas, ${errorCount} fallaron.`,
        { id: toastId, duration: 5000 }
      );
    } else {
      toast.success(
        `¡${successCount} preguntas del documento enviadas a Telegram con éxito!`,
        { id: toastId, duration: 5000 }
      );
    }
  };

  const handleSendSingleQuestionToTelegram = async (questionObject: PrismaQuestion) => {
    setIsSendingToTelegram(prev => ({ ...prev, [questionObject.id]: true }));
    try {
      const parsedQuestion = parseGiftQuestion(questionObject.content);
      if (!parsedQuestion || !parsedQuestion.enunciado) {
        toast.error('No se pudo parsear la pregunta GIFT o falta el enunciado.');
        setIsSendingToTelegram(prev => ({ ...prev, [questionObject.id]: false }));
        return;
      }

      let questionText = cleanHtmlForTelegram(parsedQuestion.enunciado);
      if (questionText.length > 300) questionText = questionText.substring(0, 297) + "...";

      let optionsTexts: string[] = parsedQuestion.opciones.map(opt => {
        let optText = cleanHtmlForTelegram(opt.text);
        if (optText.length > 100) optText = optText.substring(0, 97) + "...";
        return optText;
      });
      const correctOptIndex = parsedQuestion.opciones.findIndex(opt => opt.iscorrect);

      if (optionsTexts.length === 0 || correctOptIndex === -1) {
        toast.error('Pregunta sin opciones válidas o sin respuesta correcta definida.');
        setIsSendingToTelegram(prev => ({ ...prev, [questionObject.id]: false }));
        return;
      }

      let explanationText = parsedQuestion.retroalimentacion ? cleanHtmlForTelegram(parsedQuestion.retroalimentacion) : undefined;
      if (explanationText && explanationText.length > 200) explanationText = explanationText.substring(0, 197) + "...";

      const pollData: SendPollRequestBody = {
        question: questionText,
        options: optionsTexts,
        correct_option_id: correctOptIndex,
        explanation: explanationText,
        chat_id: process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID 
      };

      const randomizedPollData = shuffleOptionsForTelegram(pollData);

      const response = await fetch('/api/telegram/send-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(randomizedPollData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error al enviar pregunta a Telegram:', errorData.message || 'Error desconocido', 'Payload:', randomizedPollData);
        throw new Error(errorData.message || 'Error al enviar la pregunta a Telegram');
      }
      toast.success('Pregunta enviada a Telegram con éxito.');
    } catch (err: any) {
      console.error('Error al enviar pregunta a Telegram:', err);
      toast.error(err.message || 'Error al enviar la pregunta.');
    } finally {
      setIsSendingToTelegram(prev => ({ ...prev, [questionObject.id]: false }));
    }
  };

  // Firma corregida para coincidir con lo que pasa QuestionGenerator
  // y para resolver el error de linter en DocumentSectionSelector
  const handleSendSingleSectionQuestionToTelegram = async (questionData: { id: string; content: string; sectionIdFromContext?: string; originalIndexFromContext?: number}) => {
    // sectionIdFromContext y originalIndexFromContext son opcionales aquí, 
    // ya que no se pasan directamente desde QuestionGenerator con la firma actual de su prop.
    // Usaremos questionData.id para la unicidad del estado de carga.
    const questionKey = questionData.id; // Usar el ID de la pregunta para el estado de carga

    setIsSendingSectionQuestionToTelegram(prev => ({ ...prev, [questionKey]: true }));
    try {
      const sectionQuestionContent = questionData.content;

      if (typeof sectionQuestionContent !== 'string') {
        toast.error('El contenido de la pregunta de sección no es válido (no es un string).');
        console.error('Contenido de pregunta inválido:', sectionQuestionContent);
        setIsSendingSectionQuestionToTelegram(prev => ({ ...prev, [questionKey]: false }));
        return;
      }

      const parsedQuestion = parseGiftQuestion(sectionQuestionContent);
      if (!parsedQuestion || !parsedQuestion.enunciado) {
        toast.error('No se pudo parsear la pregunta GIFT de la sección o falta el enunciado.');
        setIsSendingSectionQuestionToTelegram(prev => ({ ...prev, [questionKey]: false }));
        return;
      }

      let questionText = cleanHtmlForTelegram(parsedQuestion.enunciado);
      if (questionText.length > 300) questionText = questionText.substring(0, 297) + "...";

      let optionsTexts: string[] = parsedQuestion.opciones.map(opt => {
        let optText = cleanHtmlForTelegram(opt.text);
        if (optText.length > 100) optText = optText.substring(0, 97) + "...";
        return optText;
      });
      const correctOptIndex = parsedQuestion.opciones.findIndex(opt => opt.iscorrect);

      if (optionsTexts.length === 0 || correctOptIndex === -1) {
        toast.error('Pregunta de sección sin opciones válidas o sin respuesta correcta definida.');
        setIsSendingSectionQuestionToTelegram(prev => ({ ...prev, [questionKey]: false }));
        return;
      }

      let explanationText = parsedQuestion.retroalimentacion ? cleanHtmlForTelegram(parsedQuestion.retroalimentacion) : undefined;
      if (explanationText && explanationText.length > 200) explanationText = explanationText.substring(0, 197) + "...";

      const pollData: SendPollRequestBody = {
        question: questionText,
        options: optionsTexts,
        correct_option_id: correctOptIndex,
        explanation: explanationText,
        chat_id: process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID 
      };

      const randomizedPollData = shuffleOptionsForTelegram(pollData);

      const response = await fetch('/api/telegram/send-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(randomizedPollData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error al enviar pregunta de sección a Telegram:', errorData.message || 'Error desconocido', 'Payload:', randomizedPollData);
        throw new Error(errorData.message || 'Error al enviar la pregunta de sección a Telegram');
      }
      toast.success('Pregunta de sección enviada a Telegram con éxito.');
    } catch (err: any) {
      console.error('Error al enviar pregunta de sección a Telegram:', err);
      toast.error(err.message || 'Error al enviar la pregunta de sección.');
    } finally {
      setIsSendingSectionQuestionToTelegram(prev => ({ ...prev, [questionKey]: false }));
    }
  };

  // Función de validación de secciones removida - ahora se maneja con AdvancedSectionQuestionValidator

  // ✨ Función para manejar la validación del documento completo
  const handleValidateDocQuestions = async (event?: React.MouseEvent) => {
    try {
      console.log('[DEBUG DocumentSectionSelector] ✅ handleValidateDocQuestions INICIADA');
      
      // Usar preguntas de prueba si no hay preguntas del documento
      let questionsToValidate = testQuestions;
      
      if (docQuestionsDB && docQuestionsDB.length > 0) {
        console.log('[DEBUG DocumentSectionSelector] Preguntas encontradas:', docQuestionsDB.length);
        // Extraer el contenido string de cada pregunta
        questionsToValidate = docQuestionsDB.map((questionObj, index) => {
          const questionText = typeof questionObj === 'string' ? questionObj : questionObj.question || questionObj.content || `Pregunta ${index + 1}`;
          return questionText;
        });
      } else {
        console.log('[DEBUG DocumentSectionSelector] Usando preguntas de prueba:', testQuestions.length);
      }

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

      // Configurar el validador
      setDocValidationQuestions(questionsToValidate);
      setDocumentContent(currentDocument?.content || 'Contenido de prueba del documento');
      setDocumentTitle(currentDocument?.title || 'Documento de prueba');
      setIsDocValidatorOpen(true);

      console.log('[DEBUG DocumentSectionSelector] ✅ Modal configurado y abierto');
    } catch (error) {
      console.error('[DEBUG DocumentSectionSelector] ❌ Error en handleValidateDocQuestions:', error);
      toast.error('Error al abrir el validador');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p>Cargando documento...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-destructive text-center mb-4 bg-destructive/10 p-4 rounded-md">
          <AlertCircle className="h-8 w-8 mx-auto mb-2"/>
          <p className="text-xl font-semibold">Error</p>
          <p>{error}</p>
        </div>
        <Link href="/documents" className="btn-primary">
          Volver a documentos
        </Link>
      </div>
    );
  }
  if (!currentDocument) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-muted-foreground">
        <p>No se encontró el documento.</p>
        <Link href="/documents" className="btn-primary mt-4">
          Volver a documentos
        </Link>
      </div>
    );
  }

  if (processingConfig === undefined) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-foreground">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p>Cargando configuración...</p>
      </div>
    );
  }

  const questionsTextForCopy = currentDocument.questions?.map(q => q.content).join('\n\n') || '';

  // Filtrar preguntas del documento completo (sin sección)
  // Primero, creamos un conjunto (Set) con el contenido de todas las preguntas de sección para una búsqueda eficiente.
  const sectionQuestionContents = new Set<string>();
  Object.values(sectionQuestions).forEach(questionsInSection => {
    questionsInSection.forEach(content => {
      sectionQuestionContents.add(content);
    });
  });

  // Luego, filtramos las preguntas del documento completo
  const docQuestions = (currentDocument.questions ?? [])
    .filter(q => !q.sectionid) // Solo preguntas globales (sin sectionId)
    .filter(globalQ => !sectionQuestionContents.has(globalQ.content)); // Y que no estén ya en las preguntas de sección

  // --- Al cargar preguntas, filtrarlas según los IDs ocultos ---
  console.log("[DEBUG DocumentPage Render] docQuestionsDB ANTES de calcular visibleDocQuestions:", docQuestionsDB);
  const visibleDocQuestions = docQuestionsDB.filter(q => !getHiddenQuestionIdsForDoc(documentId).includes(q.id));
  console.log("[DEBUG DocumentPage Render] visibleDocQuestions CALCULADO:", visibleDocQuestions);

  // Función para renderizar contenido de sección (evita función inline)
  const renderSectionContent = (section: PrismaSection) => (
    <div className="space-y-2">
      {renderContentWithToggle(section.content, currentDocument?.type || null, section.id)}
    </div>
  );

  // Función para generar preguntas de sección (evita función inline)
  const handleSectionGenerateQuestions = (sectionId: string, customTitle?: string) => {
    return handleGenerateQuestions(sectionId, customTitle, selectedQuestionTable);
  };

  // Función para manejar cambios de configuración (evita función inline)
  const handleQuestionConfigChange = (
    newQuestionTypes: any[],
    newDifficultyLevels: any[],
    newBloomLevels?: any[],
    newOptionLength?: OptionLengthType
  ) => {
    setQuestionTypes(newQuestionTypes);
    setDifficultyLevels(newDifficultyLevels);
    setBloomLevels(newBloomLevels || []);
    setOptionLength(newOptionLength || 'media');
    setQuestionTypeCounts(
      newQuestionTypes.reduce((acc: Record<string, number>, t: any) => ({ ...acc, [t.id]: t.percentage }), {})
    );
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-background text-foreground">
      {/* OPCIÓN A: Solo barra del navegador (actual) */}
      <div className="flex-1 min-w-0 flex flex-col bg-background relative">
        <button
          onClick={() => setShowRightPanel(v => !v)}
          className="absolute top-4 right-2 z-40 border border-border rounded-full shadow-lg p-2 hover:bg-muted/80 transition-all flex items-center gap-1 bg-card"
          title={showRightPanel ? 'Ocultar configuración' : 'Mostrar configuración'}
        >
          <Settings className="w-5 h-5 text-muted-foreground" />
          {showRightPanel ? <ChevronRight className="w-4 h-4 text-muted-foreground" /> : <ChevronLeft className="w-4 h-4 text-muted-foreground" />}
        </button>
        <div className="flex-none p-3 sm:p-4 border-b border-border">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Link
              href="/documents"
              className="btn-secondary text-sm flex items-center"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Volver
            </Link>
            <div className="flex items-center gap-2 mr-16">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(currentDocument.content);
                  setCopiedContent(true);
                  setTimeout(() => setCopiedContent(false), 2000);
                }}
                className={`btn-secondary h-9 px-4 rounded-lg font-semibold text-sm flex items-center gap-2 transition-colors ${!currentDocument.content ? 'bg-muted text-muted-foreground border-muted cursor-not-allowed' : ''}`}
                disabled={!currentDocument.content}
              >
                {copiedContent ? (
                  <>
                    <Check className={`w-4 h-4 mr-2 ${!currentDocument.content ? 'text-muted-foreground' : ''}`} />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className={`w-4 h-4 mr-2 ${!currentDocument.content ? 'text-muted-foreground' : ''}`} />
                    Copiar contenido
                  </>
                )}
              </button>
              <button
                onClick={() => setDeleteConfirm(true)}
                className="btn-danger-secondary text-sm flex items-center"
                title="Eliminar documento"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Eliminar
              </button>
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold mt-3 text-foreground">{currentDocument.title}</h1>
        </div>

        <div className="min-h-screen">
          <button
            onClick={() => setIsContentExpanded(!isContentExpanded)}
            className="w-full text-left p-3 sm:p-4 border-b border-border hover:bg-muted/50 focus:outline-none transition-colors flex justify-between items-center"
          >
            <h2 className="text-base sm:text-lg font-semibold text-foreground flex items-center">
              <FileText className="w-5 h-5 mr-2 flex-shrink-0" />
              Contenido del Documento
            </h2>
            {currentDocument && currentDocument.content.length > 500 && (
              isContentExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
          {isContentExpanded && (
            <div className="flex-1 overflow-visible p-3 sm:p-4">
              {currentDocument && renderContentWithToggle(currentDocument.content, currentDocument.type || null)}
            </div>
          )}
          {currentDocument && currentDocument.sections && currentDocument.sections.length > 0 && (
            <DocumentSectionSelector
              documentId={documentId}
              documentName={currentDocument?.title || 'Documento sin nombre'}
              documentContent={currentDocument?.content || ''}
              onSectionSelect={handleSectionSelect}
              renderContent={renderSectionContent}
              selectedSection={selectedSection}
              isGenerating={isGenerating}
              onGenerateQuestions={handleSectionGenerateQuestions}
              sectionQuestions={sectionQuestions}
              progressMode={progressMode}
              onProgressModeChange={handleProgressModeChange}
              numberOfQuestions={numberOfQuestions}
              onNumberOfQuestionsChange={setNumberOfQuestions}
              processingConfig={processingConfig}
              onProcessingConfigChange={handleProcessingConfigChange}
              onQuestionTypeCountsChange={setQuestionTypeCounts}
              optionLength={optionLength}
              onOptionLengthChange={setOptionLength}
              questionTypeCounts={questionTypeCounts}
              questionTypes={questionTypes}
              searchTerm={searchTerm}
              onSearchTermChange={setSearchTerm}
              onDeleteSingleSectionQuestion={handleDeleteSingleSectionQuestion}
              sectionQuestionsDB={sectionQuestionsDB}
              editingSectionQuestion={editingSectionQuestion}
              setEditingSectionQuestion={setEditingSectionQuestion}
              fetchSectionQuestions={fetchSectionQuestions}
              onSendSectionQuestionToTelegram={handleSendSingleSectionQuestionToTelegram}
              isSendingSectionQuestionToTelegram={isSendingSectionQuestionToTelegram}
              customTitle={customTitle}
              onCustomTitleChange={setCustomTitle}
              docQuestionsDB={docQuestionsDB}
              loadingDocQuestions={loadingDocQuestions}
              showDocQuestions={showDocQuestions}
              setShowDocQuestions={setShowDocQuestions}
              fetchDocQuestions={fetchDocQuestions}
              editingDocQuestion={editingDocQuestion}
              setEditingDocQuestion={setEditingDocQuestion}
              handleSendSingleQuestionToTelegram={handleSendSingleQuestionToTelegram}
              isSendingToTelegram={isSendingToTelegram}
              handleSendAllDocQuestionsToTelegram={handleSendAllDocQuestionsToTelegram}
              isSendingAllDocQuestionsToTelegram={isSendingAllDocQuestionsToTelegram}
              questionsViewMode={questionsViewMode}
              setQuestionsViewMode={setQuestionsViewMode}
              setDeletingDocQuestionId={setDeletingDocQuestionId}
              questionCounts={questionCounts}
              showArchivedQuestions={showArchivedQuestions}
              toggleShowArchived={toggleShowArchived}
              archiveAllDocQuestions={archiveAllDocQuestions}
              restoreAllDocQuestions={restoreAllDocQuestions}
              handleSearchQuestions={handleSearchQuestions}
              questionsHasMore={questionsHasMore}
              loadMoreQuestions={loadMoreQuestions}
              // ✅ NUEVO: Props para validación masiva
              isValidatingAllDocQuestions={isValidatingAllDocQuestions}
              // 🎯 NUEVO: Props para selector de tabla
              selectedQuestionTable={selectedQuestionTable}
              onQuestionTableChange={setSelectedQuestionTable}
            />
          )}
        </div>
      </div>
      
      {showRightPanel && (
        <div className="border-l border-border bg-card min-w-[220px] max-w-[340px] w-auto p-2">
          <QuestionConfig
            onConfigChange={handleQuestionConfigChange}
          />
          <div className="bg-muted p-4 rounded-lg shadow flex flex-col gap-2 mt-4">
            <label htmlFor="num-questions" className="sr-only">Cantidad de preguntas</label>
            <div className="flex flex-wrap items-center gap-2 w-full">
              <div className="flex items-center border border-border rounded-l-lg bg-background h-10 flex-shrink-0">
                <button
                  type="button"
                  className="w-8 h-10 flex items-center justify-center text-base font-bold text-primary hover:bg-muted transition disabled:opacity-50"
                  onClick={() => setNumberOfQuestions(n => Math.max(1, n - 1))}
                  disabled={isGenerating || numberOfQuestions <= 1}
                  aria-label="Disminuir cantidad"
                >
                  -
                </button>
                <input
                  id="num-questions"
                  type="number"
                  min={1}
                  max={50}
                  value={numberOfQuestions}
                  onChange={e => setNumberOfQuestions(Number(e.target.value))}
                  className="w-10 h-10 px-0 text-center border-0 bg-transparent text-base text-foreground focus:ring-2 focus:ring-primary"
                  aria-label="Cantidad de preguntas"
                  disabled={isGenerating}
                />
                <button
                  type="button"
                  className="w-8 h-10 flex items-center justify-center text-base font-bold text-primary hover:bg-muted transition disabled:opacity-50"
                  onClick={() => setNumberOfQuestions(n => Math.min(50, n + 1))}
                  disabled={isGenerating || numberOfQuestions >= 50}
                  aria-label="Aumentar cantidad"
                >
                  +
                </button>
              </div>
              <span className="text-xs text-muted-foreground mt-2 sm:mt-0 sm:ml-2 whitespace-normal break-words flex-1 min-w-0">
                La cantidad introducida se generará a partir de todo el documento.
              </span>
            </div>
            <div className="flex items-center gap-2 w-full mt-2">
              <button
                className="h-10 px-4 rounded-md border border-orange-400 text-orange-400 bg-transparent font-semibold text-sm flex items-center gap-2 transition-colors
                  hover:bg-orange-400 hover:text-white active:bg-orange-500 active:text-white disabled:opacity-50"
                onClick={() => handleGenerateQuestions()}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Generando...
                  </>
                ) : (
                  `Generar Preguntas`
                )}
              </button>
            </div>
          </div>

          {/* ✅ NUEVO: Mostrar resultados de validación */}
          {validationResults && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2 text-foreground">🤖 Validación con IA del Documento</h3>
              <QuestionValidationResults 
                validCount={validationResults.validCount}
                totalCount={validationResults.totalCount}
                score={validationResults.score}
                commonIssues={validationResults.commonIssues}
                recommendations={validationResults.recommendations}
                distractorLengthWarnings={validationResults.distractorLengthWarnings}
                issuesByType={validationResults.issuesByType}
              />
            </div>
          )}

          {/* Resultados de validación de secciones removidos - ahora se maneja con AdvancedSectionQuestionValidator */}
        </div>
      )}
      <DeleteConfirmDialog
        isOpen={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        onConfirm={handleDelete}
        title={currentDocument?.title || 'este documento'}
      />
      <DeleteConfirmDialog
        isOpen={deletingDocQuestionId !== null}
        onClose={() => setDeletingDocQuestionId(null)}
        onConfirm={async () => {
          if (deletingDocQuestionId && documentId) {
            await handleDeleteSingleQuestion(deletingDocQuestionId);
          }
        }}
        title={deletingDocQuestionId ? `¿Seguro que quieres eliminar esta pregunta?` : ''}
      />
    </div>
  );
}