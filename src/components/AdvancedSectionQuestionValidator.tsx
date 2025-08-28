import React, { useState, useEffect, useRef } from 'react';
import { AIService, availableModels } from '@/services/aiService';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { X, Sparkles, CheckCircle, AlertCircle, Zap, Brain, ArrowUp, Settings, Play, Pause, RotateCcw, BookOpen } from 'lucide-react';

interface ChatMessage {
  role: "user" | "validator";
  content: string;
  questionIndex?: number;
  isValid?: boolean;
}

interface AdvancedSectionValidationResults {
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
  sectionId: string;
  sectionTitle: string;
}

interface AdvancedSectionQuestionValidatorProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Array<{ id: string; content: string; [key: string]: any }>;
  sectionContent?: string;
  sectionTitle?: string;
  sectionId: string;
  onValidationComplete?: (results: AdvancedSectionValidationResults) => void;
}

export const AdvancedSectionQuestionValidator: React.FC<AdvancedSectionQuestionValidatorProps> = ({
  isOpen,
  onClose,
  questions,
  sectionContent = '',
  sectionTitle = '',
  sectionId,
  onValidationComplete
}) => {
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [validationProgress, setValidationProgress] = useState(0);
  const [selectedProvider, setSelectedProvider] = useState<'openai' | 'anthropic' | 'google' | 'deepseek' | 'xai' | 'alibaba'>('google');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.0-flash-thinking-exp');
  const [models, setModels] = useState<any[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [validationResults, setValidationResults] = useState<AdvancedSectionValidationResults | null>(null);

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

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Función para determinar si un feedback es válido
  const isValidFeedback = (content: string) => {
    // ✅ VALIDACIÓN NUEVA (FORMATO ESPECTACULAR): Reconocer el nuevo formato con **negrita**
    const newFormatPattern = /✅\s*\*\*VÁLIDA\*\*\s*-\s*Contenido verificado y opciones correctamente clasificadas|✅\s*\*\*VÁLIDA\*\*|🏆.*\[✅.*\*\*VÁLIDA\*\*.*\]/i.test(content);
    
    // ✅ VALIDACIÓN RIGUROSA: Formato anterior
    const rigorousValidPattern = /✅ VÁLIDA - Contenido verificado y opciones correctamente clasificadas|✅ VÁLIDA/i.test(content);
    
    // 🔄 LÓGICA ANTIGUA: Mantener para compatibilidad
    const positive = /cumple con las instrucciones y el texto fuente|cumple con las instrucciones/i.test(content);
    
    // ❌ ERRORES CRÍTICOS: Detectar problemas serios
    const hasCorrection = /❌.*\*\*RECHAZADA\*\*|❌ ERROR DE CONTENIDO|corrección sugerida|corrección necesaria|no es la respuesta correcta|no cumple con las instrucciones|error principal|la opción correcta debe ser|no es literal|imprecisión|preferible usar la palabra exacta|debería decir|no es exactamente literal|palabra exacta|referencia incorrecta|discrepancia en la palabra clave/i.test(content);
    
    return (newFormatPattern || rigorousValidPattern || positive) && !hasCorrection;
  };

  // Validación individual de pregunta
  const validateSingleQuestion = async (question: string, index: number): Promise<ChatMessage> => {
    try {
      const res = await fetch("/api/validate-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          question, 
          provider: selectedProvider, 
          model: selectedModel, 
          sourceText: sectionContent 
        })
      });
      
      const data = await res.json();
      
      if (data.feedback) {
        const isValid = isValidFeedback(data.feedback);
        return {
          role: "validator",
          content: data.feedback,
          questionIndex: index,
          isValid
        };
      } else {
        return {
          role: "validator",
          content: `❌ Error: ${data.error || 'No se pudo validar la pregunta.'}`,
          questionIndex: index,
          isValid: false
        };
      }
    } catch (e: any) {
      return {
        role: "validator",
        content: `❌ Error de conexión: ${e.message}`,
        questionIndex: index,
        isValid: false
      };
    }
  };

  // Proceso principal de validación
  const handleValidateAll = async () => {
    if (questions.length === 0) {
      toast.error('No hay preguntas para validar en esta sección');
      return;
    }

    setIsValidating(true);
    setIsPaused(false);
    setCurrentQuestionIndex(0);
    setValidationProgress(0);
    setChat([]);

    // Mensaje inicial
    const initialMessage: ChatMessage = {
      role: "user",
      content: `📖 Iniciando validación avanzada de ${questions.length} preguntas de la sección "${sectionTitle}"`
    };
    setChat([initialMessage]);

    const validationMessages: ChatMessage[] = [];
    const detailedAnalysis: AdvancedSectionValidationResults['detailedAnalysis'] = [];

    try {
      for (let i = 0; i < questions.length; i++) {
        if (isPaused) {
          toast.info('Validación pausada');
          break;
        }

        setCurrentQuestionIndex(i);
        setValidationProgress(((i + 1) / questions.length) * 100);

        // Toast de progreso
        toast.loading(`🤖 Validando pregunta ${i + 1} de ${questions.length} (Sección: ${sectionTitle})...`, {
          id: 'section-validation-progress',
          duration: 1000
        });

        const result = await validateSingleQuestion(questions[i].content, i + 1);
        validationMessages.push(result);
        
        // Añadir al análisis detallado
        detailedAnalysis.push({
          questionIndex: i + 1,
          questionContent: questions[i].content,
          feedback: result.content,
          isValid: result.isValid || false,
          score: result.isValid ? 100 : 0
        });

        // Actualizar chat en tiempo real
        setChat(prev => [...prev, result]);

        // Pausa pequeña para la experiencia visual
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Completar validación
      const validCount = validationMessages.filter(msg => msg.isValid).length;
      const invalidCount = validationMessages.filter(msg => !msg.isValid).length;
      
      const results: AdvancedSectionValidationResults = {
        validCount,
        invalidCount,
        totalCount: questions.length,
        messages: [initialMessage, ...validationMessages],
        detailedAnalysis,
        sectionId,
        sectionTitle
      };

      setValidationResults(results);
      onValidationComplete?.(results);

      // Toast final
      toast.dismiss('section-validation-progress');
      if (validCount === questions.length) {
        toast.success(`🎉 ¡Validación completada! Todas las ${validCount} preguntas de la sección son válidas`);
      } else {
        toast.warning(`⚠️ Validación completada: ${validCount} válidas, ${invalidCount} requieren revisión en la sección "${sectionTitle}"`);
      }

    } catch (error) {
      console.error('Error durante validación:', error);
      toast.error('Error durante la validación de la sección');
    } finally {
      setIsValidating(false);
      setValidationProgress(100);
    }
  };

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
    if (isPaused) {
      toast.info('Validación reanudada');
    } else {
      toast.info('Validación pausada');
    }
  };

  const handleReset = () => {
    setIsValidating(false);
    setIsPaused(false);
    setCurrentQuestionIndex(0);
    setValidationProgress(0);
    setChat([]);
    setValidationResults(null);
    toast.info('Validación reiniciada');
  };

  const getProgressColor = () => {
    if (validationProgress < 33) return 'from-purple-500/80 to-pink-500/80';
    if (validationProgress < 66) return 'from-blue-500/80 to-purple-500/80';
    return 'from-green-500/80 to-blue-500/80';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-gradient-to-br from-gray-900/95 to-black/95 rounded-2xl border border-purple-500/30 shadow-2xl overflow-hidden">
        
        {/* Header con gradiente radiant */}
        <div className="relative bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-purple-600/20 p-6 border-b border-purple-500/30">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-blue-500/10 animate-pulse"></div>
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Validador Avanzado de Sección
                </h2>
                <p className="text-gray-400 text-sm">
                  Sección: <span className="text-purple-300 font-medium">{sectionTitle}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 bg-gray-800/80 hover:bg-gray-700/80 rounded-lg border border-gray-600/50 transition-all duration-200"
                title="Configuración"
              >
                <Settings className="w-5 h-5 text-gray-300" />
              </button>
              
              <button
                onClick={onClose}
                className="p-2 bg-red-600/80 hover:bg-red-500/80 rounded-lg border border-red-500/50 transition-all duration-200"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Configuración expandible */}
          {showSettings && (
            <div className="mt-4 p-4 bg-black/40 rounded-lg border border-gray-600/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Proveedor de IA
                  </label>
                  <select
                    value={selectedProvider}
                    onChange={(e) => setSelectedProvider(e.target.value as any)}
                    className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-100 focus:border-purple-500"
                    disabled={isValidating}
                  >
                    <option value="anthropic">Anthropic</option>
                    <option value="openai">OpenAI</option>
                    <option value="google">Google</option>
                    <option value="deepseek">DeepSeek</option>
                    <option value="xai">xAI</option>
                    <option value="alibaba">Alibaba</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Modelo
                  </label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full p-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-100 focus:border-purple-500"
                    disabled={isValidating}
                  >
                    {models.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Barra de progreso */}
          {(isValidating || validationProgress > 0) && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-300 mb-2">
                <span>Progreso</span>
                <span>{Math.round(validationProgress)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${getProgressColor()} transition-all duration-300 ease-out`}
                  style={{ width: `${validationProgress}%` }}
                />
              </div>
              {isValidating && (
                <div className="mt-2 text-center text-sm text-gray-400">
                  Validando pregunta {currentQuestionIndex + 1} de {questions.length}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Controles */}
        <div className="p-4 bg-gray-900/50 border-b border-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {!isValidating ? (
                <button
                  onClick={handleValidateAll}
                  disabled={questions.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="w-4 h-4" />
                  Iniciar Validación
                </button>
              ) : (
                <button
                  onClick={handlePauseResume}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white rounded-lg transition-all duration-200"
                >
                  {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  {isPaused ? 'Reanudar' : 'Pausar'}
                </button>
              )}

              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all duration-200"
              >
                <RotateCcw className="w-4 h-4" />
                Reiniciar
              </button>
            </div>

            {/* Estadísticas en tiempo real */}
            {validationResults && (
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-green-400">{validationResults.validCount}</span>
                </div>
                <div className="flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span className="text-red-400">{validationResults.invalidCount}</span>
                </div>
                <div className="text-gray-400">
                  Total: {validationResults.totalCount}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chat de validación */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 p-4 h-96 bg-gradient-to-b from-gray-900/30 to-black/30"
        >
          {chat.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Brain className="w-16 h-16 text-purple-400 mx-auto mb-4 opacity-50" />
                <p className="text-gray-400">
                  Listo para validar {questions.length} preguntas de la sección "{sectionTitle}"
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  Haz clic en "Iniciar Validación" para comenzar
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {chat.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'validator' && (
                    <div className={`p-2 rounded-full ${
                      message.isValid === true ? 'bg-green-500/20' : 
                      message.isValid === false ? 'bg-red-500/20' : 
                      'bg-blue-500/20'
                    }`}>
                      {message.isValid === true ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : message.isValid === false ? (
                        <AlertCircle className="w-5 h-5 text-red-400" />
                      ) : (
                        <Zap className="w-5 h-5 text-blue-400" />
                      )}
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30'
                        : message.isValid === true
                        ? 'bg-green-500/10 border border-green-500/30'
                        : message.isValid === false
                        ? 'bg-red-500/10 border border-red-500/30'
                        : 'bg-gray-800/60 border border-gray-600/30'
                    }`}
                  >
                    {message.questionIndex && (
                      <div className="text-xs text-gray-400 mb-1">
                        Pregunta #{message.questionIndex}
                      </div>
                    )}
                    <div className="text-gray-100 text-sm">
                      <ReactMarkdown 
                        components={{
                          strong: ({children}) => <strong className="text-purple-300 font-bold">{children}</strong>,
                          p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                          h1: ({children}) => <h1 className="text-lg font-bold text-purple-300 mb-3 flex items-center space-x-2">{children}</h1>,
                          h2: ({children}) => <h2 className="text-base font-semibold text-gray-100 mt-4 mb-2 flex items-center space-x-2">{children}</h2>,
                          h3: ({children}) => <h3 className="text-sm font-medium text-gray-300 mt-3 mb-1">{children}</h3>,
                          ul: ({children}) => <ul className="list-none space-y-1 ml-4">{children}</ul>,
                          li: ({children}) => <li className="flex items-start space-x-2">{children}</li>,
                          hr: () => <hr className="border-gray-600/50 my-3" />,
                          code: ({children}) => <code className="bg-gray-700 px-1 py-0.5 rounded text-xs font-mono">{children}</code>
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  </div>

                  {message.role === 'user' && (
                    <div className="p-2 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full">
                      <Sparkles className="w-5 h-5 text-purple-400" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Botón scroll to top */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="absolute bottom-20 right-6 p-3 bg-gradient-to-br from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white rounded-full shadow-lg transition-all duration-200"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        )}

        {/* Footer con información de la sección */}
        <div className="p-4 bg-gray-900/80 border-t border-gray-700/50">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span>Sección: {sectionTitle}</span>
            </div>
            <div>
              {questions.length} preguntas para validar
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 