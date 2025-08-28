import React, { useState, useEffect, useRef } from 'react';
import { AIService, availableModels } from '@/services/aiService';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { 
  X, 
  CheckCircle, 
  AlertCircle, 
  Zap, 
  Brain, 
  ArrowUp, 
  Settings, 
  Play, 
  Pause, 
  RotateCcw,
  MessageSquare,
  TrendingUp,
  Clock,
  Target,
  Activity,
  Sparkles,
  Bot,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface ChatMessage {
  role: "user" | "validator";
  content: string;
  questionIndex?: number;
  isValid?: boolean;
  timestamp?: number;
}

interface AdvancedValidationResults {
  validCount: number;
  invalidCount: number;
  totalCount: number;
  messages: ChatMessage[];
  detailedAnalysis: {
    questionIndex: number;
    questionContent: string;
    feedback: string;
    isValid: boolean;
    score: number;
  }[];
  startTime?: number;
  endTime?: number;
}

interface AdvancedQuestionValidatorProps {
  isOpen: boolean;
  onClose: () => void;
  questions: (string | { content: string; [key: string]: any })[];
  documentContent?: string;
  documentTitle?: string;
  buttonPosition?: { x: number; y: number; scrollY: number } | null;
  onValidationComplete?: (results: AdvancedValidationResults) => void;
}

export default function AdvancedQuestionValidator({
  isOpen,
  onClose,
  questions,
  documentContent = '',
  documentTitle = '',
  buttonPosition,
  onValidationComplete
}: AdvancedQuestionValidatorProps) {
  // Estados del componente - TODOS AL INICIO
  const [validationResults, setValidationResults] = useState<AdvancedValidationResults | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [validationProgress, setValidationProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'openai' | 'anthropic' | 'google' | 'deepseek' | 'xai' | 'alibaba'>('google');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.0-flash-thinking-exp');
  const [models, setModels] = useState<any[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);

  // Efecto para asegurar que el modal sea visible cuando se abra
  useEffect(() => {
    if (isOpen) {
      // Prevenir scroll del body
      document.body.style.overflow = 'hidden';
      
      // Opcional: hacer scroll suave al centro de la pantalla
      const modalElement = document.querySelector('[data-modal="advanced-validator"]');
      if (modalElement) {
        modalElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      // Restaurar scroll del body
      document.body.style.overflow = 'unset';
    }

    // Cleanup al desmontar el componente
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // 🔍 DEBUG: Verificar qué tipo de datos estamos recibiendo
  useEffect(() => {
    console.log('[DEBUG AdvancedQuestionValidator] 📊 PROPS RECIBIDAS:');
    console.log('- isOpen:', isOpen);
    console.log('- questions:', questions);
    console.log('- documentContent length:', documentContent?.length || 0);
    console.log('- documentTitle:', documentTitle);
  }, [isOpen, questions, documentContent, documentTitle]);

  useEffect(() => {
    const filtered = availableModels.filter(m => m.provider === selectedProvider);
    setModels(filtered);
    if (filtered.length > 0 && !filtered.find(m => m.id === selectedModel)) {
      setSelectedModel(filtered[0].id);
    }
  }, [selectedProvider]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      setShowScrollTop(container.scrollTop > 200);
    };
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (chat.length > 0) {
      scrollContainerRef.current?.scrollTo({ 
        top: scrollContainerRef.current.scrollHeight, 
        behavior: 'smooth' 
      });
    }
  }, [chat]);

  // Calcular posición inteligente del modal - SIMPLIFICADO para centrar en viewport
  const getModalPosition = () => {
    // Siempre centrar en el viewport actual del usuario
    return 'items-center justify-center';
  };

  const getModalAnimation = () => {
    // Animación simple de entrada desde el centro
    return 'animate-in zoom-in-95 duration-300';
  };

  // Early return si el modal no está abierto - DESPUÉS DE TODOS LOS HOOKS
  if (!isOpen) return null;

  console.log('[DEBUG AdvancedQuestionValidator] ✅ RENDERIZANDO MODAL - isOpen es true');
  console.log('[DEBUG AdvancedQuestionValidator] buttonPosition:', buttonPosition);

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Función para determinar si un feedback es válido
  const isValidFeedback = (content: string) => {
    console.log(`[DEBUG isValidFeedback] 🔍 ANALIZANDO CONTENIDO:`);
    console.log(`[DEBUG isValidFeedback] 📝 Contenido completo:`, content);
    
    // ✅ VALIDACIÓN NUEVA (FORMATO ESPECTACULAR): Reconocer el nuevo formato con **negrita**
    const newFormatPattern = /✅\s*\*\*VÁLIDA\*\*\s*-\s*Contenido verificado y opciones correctamente clasificadas|✅\s*\*\*VÁLIDA\*\*|🏆.*\[✅.*\*\*VÁLIDA\*\*.*\]/i.test(content);
    console.log(`[DEBUG isValidFeedback] 🆕 newFormatPattern resultado:`, newFormatPattern);
    
    // ✅ VALIDACIÓN RIGUROSA: Reconocer respuestas de verificación profunda de contenido (formato anterior)
    const rigorousValidPattern = /✅ VÁLIDA - Contenido verificado y opciones correctamente clasificadas|✅ VÁLIDA - Contenido verificado/i.test(content);
    console.log(`[DEBUG isValidFeedback] 🔬 rigorousValidPattern resultado:`, rigorousValidPattern);
    
    // ✅ VALIDACIÓN FLEXIBLE ANTERIOR: Mantener para compatibilidad
    const flexibleValidPattern = /✅ VÁLIDA - Cumple con el formato y contenido requerido|✅ VÁLIDA|VÁLIDA - Pregunta bien estructurada y educativa/i.test(content);
    console.log(`[DEBUG isValidFeedback] 🔧 flexibleValidPattern resultado:`, flexibleValidPattern);
    
    // 🔄 LÓGICA ANTIGUA: Mantener para compatibilidad con validaciones previas
    const legacyPositive = /cumple con las instrucciones y el texto fuente|cumple con las instrucciones|cumple con las instrucciones y el formato requerido|cumple con las instrucciones, el formato requerido y el texto fuente/i.test(content);
    console.log(`[DEBUG isValidFeedback] 🕰️ legacyPositive resultado:`, legacyPositive);
    
    // ❌ ERRORES CRÍTICOS: Detectar problemas serios de contenido (REFINADO - evitar falsos positivos)
    const hasContentError = /❌.*\*\*RECHAZADA\*\*|❌ ERROR DE CONTENIDO|ERROR DE CONTENIDO:|respuesta final:\s*no cumple|no es la respuesta correcta|error principal:|la opción correcta debe ser|preferible usar la palabra exacta|debería decir|referencia incorrecta|discrepancia en la palabra clave|retroalimentación incompleta|^ERROR:|FALLA:|INCORRECTO:/i.test(content);
    console.log(`[DEBUG isValidFeedback] ❌ hasContentError resultado:`, hasContentError);
    
    // 🎯 RESULTADO: Válida si cumple cualquier patrón positivo Y NO tiene errores de contenido
    const finalResult = (newFormatPattern || rigorousValidPattern || flexibleValidPattern || legacyPositive) && !hasContentError;
    console.log(`[DEBUG isValidFeedback] 🎯 RESULTADO FINAL:`, finalResult);
    console.log(`[DEBUG isValidFeedback] 🧮 Cálculo: (${newFormatPattern} || ${rigorousValidPattern} || ${flexibleValidPattern} || ${legacyPositive}) && !${hasContentError} = ${finalResult}`);
    
    return finalResult;
  };

  // Validación individual de pregunta
  const validateSingleQuestion = async (question: string | any, index: number): Promise<ChatMessage> => {
    // 🔍 DEBUG: Verificar qué se está enviando a la API
    console.log(`[DEBUG validateSingleQuestion] Validando pregunta ${index}:`);
    console.log(`[DEBUG validateSingleQuestion] Tipo de 'question':`, typeof question);
    console.log(`[DEBUG validateSingleQuestion] Contenido de 'question':`, question);
    
    // ✅ SOLUCIÓN: Extraer el contenido string del objeto si es necesario
    let questionContent: string;
    
    if (typeof question === 'string') {
      questionContent = question;
      console.log(`[DEBUG validateSingleQuestion] ✅ Pregunta ${index} es string directo`);
    } else if (question && typeof question === 'object' && typeof question.content === 'string') {
      questionContent = question.content;
      console.log(`[DEBUG validateSingleQuestion] ✅ Pregunta ${index} extraída del objeto.content`);
    } else {
      console.error(`[DEBUG validateSingleQuestion] ❌ La pregunta ${index} no es un string ni tiene content válido:`, question);
      return {
        role: "validator",
        content: `❌ Error: La pregunta ${index} no es un string válido. Recibido: ${typeof question}`,
        questionIndex: index,
        isValid: false,
        timestamp: Date.now()
      };
    }

    console.log(`[DEBUG validateSingleQuestion] Contenido final extraído:`, questionContent?.substring(0, 100));
    console.log(`[DEBUG validateSingleQuestion] Longitud del contenido:`, questionContent?.length);

    try {
      const requestBody = { 
        question: questionContent, 
        provider: selectedProvider, 
        model: selectedModel, 
        sourceText: documentContent 
      };
      
      console.log(`[DEBUG validateSingleQuestion] Body de la request:`, requestBody);

      const res = await fetch("/api/validate-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });
      
      const data = await res.json();
      console.log(`[DEBUG validateSingleQuestion] Respuesta de la API:`, data);
      
      if (data.feedback) {
        console.log(`[DEBUG validateSingleQuestion] 🚨 LLAMANDO isValidFeedback para pregunta ${index}`);
        const isValid = isValidFeedback(data.feedback);
        console.log(`[DEBUG validateSingleQuestion] 🚨 isValidFeedback RETORNÓ:`, isValid);
        console.log(`[DEBUG validateSingleQuestion] ✅ Valor final de isValid asignado:`, isValid);
        console.log(`[DEBUG validateSingleQuestion] 📋 Objeto de retorno que se va a devolver:`, {
          role: "validator",
          content: data.feedback,
          questionIndex: index,
          isValid,
          timestamp: Date.now()
        });
        return {
          role: "validator",
          content: data.feedback,
          questionIndex: index,
          isValid,
          timestamp: Date.now()
        };
      } else {
        return {
          role: "validator",
          content: `❌ Error: ${data.error || 'No se pudo validar la pregunta.'}`,
          questionIndex: index,
          isValid: false,
          timestamp: Date.now()
        };
      }
    } catch (e: any) {
      console.error(`[DEBUG validateSingleQuestion] Error de conexión:`, e);
      return {
        role: "validator",
        content: `❌ Error de conexión: ${e.message}`,
        questionIndex: index,
        isValid: false,
        timestamp: Date.now()
      };
    }
  };

  // Proceso principal de validación
  const handleValidateAll = async () => {
    if (questions.length === 0) {
      toast.error('No hay preguntas para validar');
      return;
    }

    setIsValidating(true);
    setIsPaused(false);
    setCurrentQuestionIndex(0);
    setValidationProgress(0);
    setChat([]);
    const startTimestamp = Date.now();
    setStartTime(startTimestamp);

    // Mensaje inicial con mejores detalles
    const initialMessage: ChatMessage = {
      role: "user",
      content: `🚀 Iniciando validación avanzada con IA\n\n📊 Detalles de la sesión:\n• ${questions.length} preguntas a validar\n• Documento: "${documentTitle}"\n• Modelo: ${selectedModel}\n• Proveedor: ${selectedProvider}\n• Inicio: ${new Date().toLocaleTimeString()}`,
      timestamp: startTimestamp
    };
    setChat([initialMessage]);

    const validationMessages: ChatMessage[] = [];
    const detailedAnalysis: AdvancedValidationResults['detailedAnalysis'] = [];

    try {
      for (let i = 0; i < questions.length; i++) {
        if (isPaused) {
          toast.info('Validación pausada');
          break;
        }

        setCurrentQuestionIndex(i);
        setValidationProgress(((i + 1) / questions.length) * 100);

        // Toast de progreso con más información
        toast.loading(`🤖 Analizando pregunta ${i + 1}/${questions.length} con ${selectedModel}...`, {
          id: 'validation-progress',
          duration: 2000
        });

        const result = await validateSingleQuestion(questions[i], i + 1);
        console.log(`[DEBUG handleValidateAll] 📩 Resultado recibido pregunta ${i + 1}:`, result);
        console.log(`[DEBUG handleValidateAll] ✅ isValid del resultado:`, result.isValid);
        validationMessages.push(result);
        
        // Añadir al análisis detallado
        const questionForAnalysis = typeof questions[i] === 'string' 
          ? questions[i] as string
          : (questions[i] as any).content || 'Contenido no disponible';
          
        detailedAnalysis.push({
          questionIndex: i + 1,
          questionContent: questionForAnalysis,
          feedback: result.content,
          isValid: result.isValid || false,
          score: result.isValid ? 100 : 0
        });

        // Actualizar chat en tiempo real
        setChat(prev => [...prev, result]);
        console.log(`[DEBUG handleValidateAll] 💬 Chat actualizado. Pregunta ${i + 1} añadida al chat`);

        // Pausa pequeña para la experiencia visual
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      // Completar validación
      const endTimestamp = Date.now();
      const validCount = validationMessages.filter(msg => msg.isValid).length;
      const invalidCount = validationMessages.filter(msg => !msg.isValid).length;
      const duration = Math.round((endTimestamp - startTimestamp) / 1000);
      
      console.log(`[DEBUG handleValidateAll] 📊 CONTEO FINAL:`);
      console.log(`[DEBUG handleValidateAll] 📋 validationMessages:`, validationMessages.map(msg => ({ questionIndex: msg.questionIndex, isValid: msg.isValid })));
      console.log(`[DEBUG handleValidateAll] ✅ validCount:`, validCount);
      console.log(`[DEBUG handleValidateAll] ❌ invalidCount:`, invalidCount);
      console.log(`[DEBUG handleValidateAll] 📏 totalCount:`, questions.length);
      
      const results: AdvancedValidationResults = {
        validCount,
        invalidCount,
        totalCount: questions.length,
        messages: [initialMessage, ...validationMessages],
        detailedAnalysis,
        startTime: startTimestamp,
        endTime: endTimestamp
      };

      setValidationResults(results);
      onValidationComplete?.(results);

      // Mensaje de finalización
      const completionMessage: ChatMessage = {
        role: "user",
        content: `✅ Validación completada exitosamente\n\n📈 Resultados finales:\n• Válidas: ${validCount}/${questions.length} (${Math.round((validCount/questions.length)*100)}%)\n• Requieren revisión: ${invalidCount}\n• Tiempo total: ${duration}s\n• Promedio: ${Math.round(duration/questions.length*10)/10}s por pregunta`,
        timestamp: endTimestamp
      };
      setChat(prev => [...prev, completionMessage]);

      // Toast final mejorado
      toast.success(
        `🎉 Validación completada\n✅ ${validCount} válidas | ⚠️ ${invalidCount} a revisar\n⏱️ ${duration}s total`,
        { id: 'validation-progress', duration: 8000 }
      );

    } catch (error) {
      console.error('Error en validación avanzada:', error);
      toast.error('Error durante la validación avanzada');
    } finally {
      setIsValidating(false);
      setValidationProgress(100);
    }
  };

  const handleReset = () => {
    setChat([]);
    setValidationResults(null);
    setCurrentQuestionIndex(0);
    setValidationProgress(0);
    setIsValidating(false);
    setIsPaused(false);
    setStartTime(null);
  };

  const formatDuration = (start: number, end?: number) => {
    const duration = Math.round(((end || Date.now()) - start) / 1000);
    if (duration < 60) return `${duration}s`;
    return `${Math.floor(duration / 60)}m ${duration % 60}s`;
  };

  const validCount = chat.filter(msg => msg.role === 'validator' && msg.isValid).length;
  const invalidCount = chat.filter(msg => msg.role === 'validator' && !msg.isValid).length;
  
  // 🔧 FIX: Usar validationResults si existe, sino usar chat
  const finalValidCount = validationResults?.validCount ?? validCount;
  const finalInvalidCount = validationResults?.invalidCount ?? invalidCount;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in-0 duration-300"
      data-modal="advanced-validator"
      style={{
        // Asegurar que el modal esté siempre centrado en el viewport
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div className={cn(
        "bg-background border border-border rounded-xl shadow-2xl w-full max-w-6xl min-h-[80vh] max-h-[95vh] flex flex-col overflow-hidden",
        getModalAnimation()
      )}>
        
        {/* Header mejorado */}
        <div className="border-b border-border bg-gradient-to-r from-card/95 to-card/90 backdrop-blur-xl">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative p-2 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg">
                  <Brain className="w-6 h-6 text-primary" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-success rounded-full animate-pulse" />
                </div>
                <div>
                  <CardTitle className="text-xl flex items-center space-x-2">
                    <span>Validador Avanzado IA</span>
                    <Badge variant="secondary" className="text-xs animate-pulse">
                      <Bot className="w-3 h-3 mr-1" />
                      {questions.length} preguntas
                    </Badge>
                  </CardTitle>
                  <CardDescription className="flex items-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span>Análisis inteligente del documento "{documentTitle}"</span>
                  </CardDescription>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSettings(!showSettings)}
                  disabled={isValidating}
                  className="transition-all duration-200 hover:scale-105"
                >
                  <Settings className={cn("w-4 h-4 transition-transform duration-200", showSettings && "rotate-180")} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="transition-all duration-200 hover:scale-105"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Configuración desplegable mejorada */}
            {showSettings && (
              <div className="mt-4 animate-in slide-in-from-top-2 duration-300">
                <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center space-x-2">
                      <Sparkles className="w-4 h-4" />
                      <span>Configuración de IA</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground flex items-center space-x-2">
                          <span>Proveedor de IA</span>
                          <Badge variant="outline" className="text-xs">{selectedProvider}</Badge>
                        </label>
                        <select 
                          value={selectedProvider} 
                          onChange={e => setSelectedProvider(e.target.value as any)}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                          disabled={isValidating}
                        >
                          {Array.from(new Set(availableModels.map(m => m.provider))).map(p => (
                            <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground flex items-center space-x-2">
                          <span>Modelo</span>
                          <Badge variant="outline" className="text-xs">{models.find(m => m.id === selectedModel)?.name || selectedModel}</Badge>
                        </label>
                        <select 
                          value={selectedModel} 
                          onChange={e => setSelectedModel(e.target.value)}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                          disabled={isValidating}
                        >
                          {models.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Estadísticas en tiempo real mejoradas */}
            {(finalValidCount > 0 || finalInvalidCount > 0) && (
              <div className="flex items-center justify-center space-x-4 mt-4 animate-in fade-in-0 duration-500">
                {finalValidCount > 0 && (
                  <div className="flex items-center space-x-2 px-4 py-2 bg-success/10 text-success rounded-lg border border-success/20 animate-in slide-in-from-left-2">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">{finalValidCount} Válidas</span>
                  </div>
                )}
                {finalInvalidCount > 0 && (
                  <div className="flex items-center space-x-2 px-4 py-2 bg-destructive/10 text-destructive rounded-lg border border-destructive/20 animate-in slide-in-from-right-2">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">{finalInvalidCount} A revisar</span>
                  </div>
                )}
                <div className="flex items-center space-x-2 px-4 py-2 bg-muted rounded-lg border border-border">
                  <Activity className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {chat.length - 1}/{questions.length}
                  </span>
                  {startTime && (
                    <span className="text-xs text-muted-foreground">
                      • {formatDuration(startTime)}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Barra de progreso mejorada */}
            {isValidating && (
              <div className="mt-4 space-y-3 animate-in slide-in-from-bottom-2 duration-300">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>Pregunta {currentQuestionIndex + 1} de {questions.length}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-primary font-medium">{Math.round(validationProgress)}%</span>
                    {startTime && (
                      <span className="text-xs text-muted-foreground">
                        {formatDuration(startTime)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="relative w-full bg-muted rounded-full h-3 overflow-hidden shadow-inner">
                  <div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-700 ease-out shadow-sm"
                    style={{ width: `${validationProgress}%` }}
                  />
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                </div>
              </div>
            )}
          </CardHeader>
        </div>

        {/* Controles principales mejorados */}
        <div className="p-4 border-b border-border bg-gradient-to-r from-muted/10 to-muted/5">
          <div className="flex justify-center items-center space-x-3">
            {!isValidating ? (
              <Button
                onClick={handleValidateAll}
                disabled={questions.length === 0}
                size="lg"
                className="px-8 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                <Zap className="w-4 h-4 mr-2" />
                Iniciar Validación IA
              </Button>
            ) : (
              <Button
                onClick={() => setIsPaused(!isPaused)}
                variant="secondary"
                size="lg"
                className="transition-all duration-200 transform hover:scale-105"
              >
                {isPaused ? <Play className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
                {isPaused ? 'Reanudar' : 'Pausar'}
              </Button>
            )}
            
            <Button
              onClick={handleReset}
              disabled={isValidating}
              variant="outline"
              className="transition-all duration-200 transform hover:scale-105"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reiniciar
            </Button>
          </div>
        </div>

        {/* Área de conversación mejorada */}
        <div className="flex-1 relative flex flex-col min-h-0">
          <div
            ref={scrollContainerRef}
            className="flex-1 p-6 space-y-4 overflow-y-auto custom-scrollbar"
          >
            {chat.length === 0 && !isValidating && (
              <div className="text-center py-16 animate-in fade-in-0 duration-700">
                <div className="relative p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full w-24 h-24 mx-auto mb-8 flex items-center justify-center">
                  <Brain className="w-10 h-10 text-primary" />
                  <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-pulse" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  Listo para el análisis inteligente
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {questions.length} preguntas preparadas para validación con IA avanzada
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-md mx-auto">
                  <div className="text-center p-4 rounded-lg bg-card border border-border hover:shadow-md transition-shadow duration-200">
                    <Target className="w-8 h-8 mx-auto mb-3 text-primary" />
                    <h4 className="font-medium mb-1">Análisis preciso</h4>
                    <p className="text-sm text-muted-foreground">Evaluación detallada de cada pregunta</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-card border border-border hover:shadow-md transition-shadow duration-200">
                    <Clock className="w-8 h-8 mx-auto mb-3 text-primary" />
                    <h4 className="font-medium mb-1">Tiempo real</h4>
                    <p className="text-sm text-muted-foreground">Resultados instantáneos y progreso visual</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-card border border-border hover:shadow-md transition-shadow duration-200">
                    <TrendingUp className="w-8 h-8 mx-auto mb-3 text-primary" />
                    <h4 className="font-medium mb-1">Mejora continua</h4>
                    <p className="text-sm text-muted-foreground">Feedback para optimizar contenido</p>
                  </div>
                </div>
              </div>
            )}

            {chat.map((msg, i) => (
              <div key={i} className="group animate-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${i * 100}ms` }}>
                {msg.role === "user" ? (
                  <Alert className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 shadow-sm">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <AlertTitle className="text-primary">Sistema de Validación</AlertTitle>
                    <AlertDescription className="mt-1 whitespace-pre-line">
                      {msg.content}
                    </AlertDescription>
                    {msg.timestamp && (
                      <div className="text-xs text-muted-foreground mt-2">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </div>
                    )}
                  </Alert>
                ) : (
                  <Card className={cn(
                    "transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1",
                    msg.isValid 
                      ? "border-success/20 bg-gradient-to-br from-success/5 to-success/10 shadow-success/10" 
                      : "border-destructive/20 bg-gradient-to-br from-destructive/5 to-destructive/10 shadow-destructive/10"
                  )}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {msg.isValid ? (
                            <>
                              <div className="relative p-2 bg-success/10 rounded-full">
                                <CheckCircle className="w-5 h-5 text-success" />
                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-success rounded-full animate-ping" />
                              </div>
                              <div>
                                <CardTitle className="text-sm text-success flex items-center space-x-2">
                                  <span>Pregunta {msg.questionIndex}</span>
                                  <Sparkles className="w-4 h-4" />
                                </CardTitle>
                                <CardDescription className="text-success/70">
                                  Validación exitosa
                                </CardDescription>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="relative p-2 bg-destructive/10 rounded-full">
                                <AlertCircle className="w-5 h-5 text-destructive" />
                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full animate-pulse" />
                              </div>
                              <div>
                                <CardTitle className="text-sm text-destructive">
                                  Pregunta {msg.questionIndex}
                                </CardTitle>
                                <CardDescription className="text-destructive/70">
                                  Requiere revisión
                                </CardDescription>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={msg.isValid ? "success" : "destructive"} 
                            className="text-xs animate-in zoom-in-75 duration-200"
                          >
                            {msg.isValid ? "✓ Aprobada" : "⚠ Revisar"}
                          </Badge>
                          {msg.timestamp && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(msg.timestamp).toLocaleTimeString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Mostrar pregunta original mejorada */}
                      {msg.questionIndex && 
                       questions[msg.questionIndex - 1] && 
                       typeof questions[msg.questionIndex - 1] === 'string' && (
                        <div className="p-4 bg-muted/30 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors duration-200">
                          <div className="flex items-center space-x-2 mb-2">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <p className="text-sm font-medium text-muted-foreground">Pregunta analizada:</p>
                          </div>
                          <p className="text-sm font-mono text-foreground leading-relaxed">
                            {(questions[msg.questionIndex - 1] as string).substring(0, 300)}
                            {(questions[msg.questionIndex - 1] as string).length > 300 && (
                              <span className="text-muted-foreground">... (+{(questions[msg.questionIndex - 1] as string).length - 300} caracteres)</span>
                            )}
                          </p>
                        </div>
                      )}
                      
                      <div className="prose prose-sm max-w-none text-sm text-foreground leading-relaxed p-3 bg-background/50 rounded-lg border border-border/30">
                        <ReactMarkdown 
                          components={{
                            strong: ({children}) => <strong className="text-primary font-bold">{children}</strong>,
                            p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                            h1: ({children}) => <h1 className="text-lg font-bold text-primary mb-3 flex items-center space-x-2">{children}</h1>,
                            h2: ({children}) => <h2 className="text-base font-semibold text-foreground mt-4 mb-2 flex items-center space-x-2">{children}</h2>,
                            h3: ({children}) => <h3 className="text-sm font-medium text-muted-foreground mt-3 mb-1">{children}</h3>,
                            ul: ({children}) => <ul className="list-none space-y-1 ml-4">{children}</ul>,
                            li: ({children}) => <li className="flex items-start space-x-2">{children}</li>,
                            hr: () => <hr className="border-border/50 my-3" />,
                            code: ({children}) => <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">{children}</code>
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ))}

            {isValidating && (
              <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 animate-pulse">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
                      <div className="absolute inset-0 animate-ping w-6 h-6 border border-primary/30 rounded-full"></div>
                    </div>
                    <div>
                      <span className="text-primary font-medium">
                        Analizando pregunta {currentQuestionIndex + 1} de {questions.length}
                      </span>
                      <p className="text-sm text-muted-foreground">
                        Usando {selectedModel} para análisis profundo...
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Botón scroll to top mejorado */}
          {showScrollTop && (
            <Button
              onClick={scrollToTop}
              size="sm"
              className="fixed bottom-6 right-6 rounded-full p-3 shadow-xl bg-gradient-to-r from-primary to-primary/90 hover:shadow-2xl transition-all duration-300 transform hover:scale-110 z-10"
            >
              <ArrowUp className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Footer con resumen mejorado */}
        {validationResults && (
          <div className="border-t border-border bg-gradient-to-r from-muted/10 to-muted/5 p-4 animate-in slide-in-from-bottom-4 duration-500">
            <Card className="border-primary/10 bg-gradient-to-br from-card to-card/95">
              <CardHeader className="pb-3">
                <CardTitle className="text-center flex items-center justify-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <span>Resumen de Validación</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                  <div className="space-y-2 p-3 rounded-lg bg-success/5 border border-success/20">
                    <div className="flex items-center justify-center space-x-1">
                      <CheckCircle className="w-4 h-4 text-success" />
                      <span className="text-sm font-medium text-success">Válidas</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{validationResults.validCount}</p>
                  </div>
                  <div className="space-y-2 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                    <div className="flex items-center justify-center space-x-1">
                      <AlertCircle className="w-4 h-4 text-destructive" />
                      <span className="text-sm font-medium text-destructive">A revisar</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{validationResults.invalidCount}</p>
                  </div>
                  <div className="space-y-2 p-3 rounded-lg bg-muted/20 border border-border">
                    <div className="flex items-center justify-center space-x-1">
                      <Target className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-muted-foreground">Total</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{validationResults.totalCount}</p>
                  </div>
                  <div className="space-y-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-center justify-center space-x-1">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-muted-foreground">Precisión</span>
                    </div>
                    <p className="text-2xl font-bold text-primary">
                      {Math.round((validationResults.validCount / validationResults.totalCount) * 100)}%
                    </p>
                  </div>
                  <div className="space-y-2 p-3 rounded-lg bg-muted/20 border border-border">
                    <div className="flex items-center justify-center space-x-1">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">Duración</span>
                    </div>
                    <p className="text-lg font-bold text-foreground">
                      {validationResults.startTime && validationResults.endTime 
                        ? formatDuration(validationResults.startTime, validationResults.endTime)
                        : '--'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
} 