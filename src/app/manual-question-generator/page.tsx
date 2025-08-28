"use client";
import React, { useState, useEffect } from "react";
import { AIService, availableModels } from "@/services/aiService";
import { toast } from "react-hot-toast";
import { validateGiftQuestions, ValidationErrorDetail } from '@/utils/giftValidator';
import QuestionValidationResults from '@/components/QuestionValidationResults';
import QuestionTableSelector from '@/components/QuestionTableSelector';
import type { QuestionTableName } from '@/types/questionTables';
import { 
  BarChart, 
  Bot, 
  Copy, 
  FileText, 
  Zap, 
  Settings, 
  AlertCircle,
  Info,
  Check,
  Loader2,
  Clock,
  X,
  Brain,
  Calculator,
  Database
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { getSuggestedQuestions, getSuggestedQuestionsIntelligent } from '@/utils/questionUtils';

export default function ManualQuestionGeneratorPage() {
  const [manualText, setManualText] = useState("");
  const [manualResult, setManualResult] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [initError, setInitError] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [userEditedNumQuestions, setUserEditedNumQuestions] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrorDetail[]>([]);
  const [optionLength, setOptionLength] = useState<'muy_corta' | 'media' | 'larga' | 'telegram'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('manual-optionLength') as any) || 'muy_corta';
    }
    return 'muy_corta';
  });
  
  // Estado para proveedor y modelo
  const [selectedProvider, setSelectedProvider] = useState<'openai' | 'anthropic' | 'google' | 'deepseek' | 'xai' | 'alibaba'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('manual-provider') as any) || 'anthropic';
    }
    return 'anthropic';
  });
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('manual-model') || 'claude-3-opus';
    }
    return 'claude-3-opus';
  });
  const [models, setModels] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  // Estado para la normativa
  const [normativa, setNormativa] = useState<string>("");
  
  // Estado para la tabla de preguntas seleccionada
  const [selectedQuestionTable, setSelectedQuestionTable] = useState<QuestionTableName>('SectionQuestion');

  // ✨ NUEVOS Estados para sugerencias inteligentes
  const [useIntelligentSuggestions, setUseIntelligentSuggestions] = useState(true); // Cambiar de false a true
  const [suggestionAnalysis, setSuggestionAnalysis] = useState<any>(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);

  const estimateTokensSimple = (text: string) => Math.ceil(text.length / 4);

  // Sugerencia automática: 1 pregunta cada 100 palabras
  const suggestedQuestions = getSuggestedQuestions(manualText);

  // Sincronizar numQuestions con la sugerencia automáticamente si el usuario no lo ha editado
  useEffect(() => {
    if (!userEditedNumQuestions && manualText.trim().length > 0) {
      if (useIntelligentSuggestions && suggestionAnalysis) {
        // Usar sugerencia inteligente si está disponible
        setNumQuestions(suggestionAnalysis.suggestedQuestions);
      } else {
        // Fallback a sugerencia tradicional
        setNumQuestions(suggestedQuestions);
      }
    }
  }, [manualText, suggestedQuestions, userEditedNumQuestions, useIntelligentSuggestions, suggestionAnalysis]);

  // Si el usuario edita el campo, marcar la bandera
  const handleNumQuestionsChange = (value: number) => {
    setNumQuestions(value);
    setUserEditedNumQuestions(true);
  };

  // Si el usuario pulsa "Usar" sugerido, restablecer la bandera
  const handleUseSuggested = () => {
    const suggested = getSuggestedQuestions(manualText);
    setNumQuestions(suggested);
  };

  // ✨ NUEVAS Funciones para sugerencias inteligentes
  const updateIntelligentSuggestion = async () => {
    if (!manualText.trim() || !useIntelligentSuggestions) {
      setSuggestionAnalysis(null);
      return;
    }

    setLoadingSuggestion(true);
    try {
      const analysis = await getSuggestedQuestionsIntelligent(manualText);
      setSuggestionAnalysis(analysis);
    } catch (error) {
      console.warn('Error en análisis inteligente:', error);
      setSuggestionAnalysis(null);
    } finally {
      setLoadingSuggestion(false);
    }
  };

  const toggleSuggestionMethod = () => {
    setUseIntelligentSuggestions(!useIntelligentSuggestions);
  };

  const handleUseIntelligentSuggested = () => {
    if (suggestionAnalysis) {
      setNumQuestions(suggestionAnalysis.suggestedQuestions);
    }
  };

  // Efecto para actualizar sugerencias cuando cambia el texto o el método
  useEffect(() => {
    if (useIntelligentSuggestions && manualText.trim()) {
      const timer = setTimeout(() => {
        updateIntelligentSuggestion();
      }, 500); // Debounce de 500ms

      return () => clearTimeout(timer);
    } else {
      setSuggestionAnalysis(null);
    }
  }, [manualText, useIntelligentSuggestions]);

  useEffect(() => {
    let mounted = true;
    setIsReady(false);
    setInitError("");
    AIService.initialize()
      .then(() => { if (mounted) setIsReady(true); })
      .catch((e) => {
        if (mounted) {
          setInitError("Error al inicializar el servicio de IA: " + (e?.message || "Desconocido"));
          setIsReady(false);
        }
      });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    // Cargar modelos disponibles según el proveedor seleccionado
    const filtered = availableModels.filter(m => m.provider === selectedProvider);
    setModels(filtered);
    if (filtered.length > 0 && !filtered.find(m => m.id === selectedModel)) {
      setSelectedModel(filtered[0].id);
    }
    // Guardar proveedor en localStorage
    if (selectedProvider) localStorage.setItem('manual-provider', selectedProvider);
  }, [selectedProvider]);

  useEffect(() => {
    // Guardar modelo en localStorage
    if (selectedModel) localStorage.setItem('manual-model', selectedModel);
  }, [selectedModel]);

  // Sincronizar con la base de datos al cambiar proveedor o modelo
  useEffect(() => {
    if (!selectedProvider || !selectedModel) return;
    setIsSyncing(true);
    AIService.setModelAndProvider(selectedProvider, selectedModel)
      .then(() => {
        toast.success('Proveedor y modelo sincronizados con la base de datos');
      })
      .catch((e) => {
        toast.error('Error al sincronizar proveedor/modelo: ' + (e?.message || 'Desconocido'));
      })
      .finally(() => setIsSyncing(false));
  }, [selectedProvider, selectedModel]);

  // Cargar normativa de localStorage al montar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedNorma = localStorage.getItem('manual-normativa');
      if (savedNorma) setNormativa(savedNorma);
    }
  }, []);

  // Guardar normativa en localStorage al cambiar
  useEffect(() => {
    if (typeof window !== 'undefined' && normativa) {
      localStorage.setItem('manual-normativa', normativa);
    }
  }, [normativa]);

  useEffect(() => {
    if (optionLength) localStorage.setItem('manual-optionLength', optionLength);
  }, [optionLength]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setManualResult("");
    setValidationErrors([]);
    try {
      // Pasar el modelo seleccionado a la generación
      const modelObj = models.find(m => m.id === selectedModel);
      if (!modelObj) throw new Error('Modelo no encontrado');
      // Pasar la normativa como argumento adicional
      const questions = await AIService.generateQuestions(manualText, numQuestions, undefined, optionLength, modelObj, normativa);
      setManualResult(questions);
      
      // Validar preguntas generadas
      const validation = validateGiftQuestions(questions, { numQuestions, optionLength });
      setValidationErrors(validation.errors);
      
      // Si se seleccionó una tabla personalizada, guardar las preguntas
      // Permitir guardar si hay preguntas válidas, aunque no coincida el número exacto
      const hasValidQuestions = questions.trim().length > 0 && questions.includes('{') && questions.includes('}');
      if (selectedQuestionTable !== 'SectionQuestion' && hasValidQuestions) {
        try {
          const response = await fetch('/api/questions/custom-table', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              questions: questions,
              tableName: selectedQuestionTable,
              sourceText: manualText.substring(0, 500) + (manualText.length > 500 ? '...' : ''),
              normativa: normativa || undefined
            }),
          });
          
          if (!response.ok) {
            throw new Error('Error al guardar las preguntas');
          }
          
          const result = await response.json();
          const questionCount = questions.split(/\n\n/).filter(q => q.includes('{') && q.includes('}')).length;
          toast.success(`${questionCount} preguntas guardadas en ${selectedQuestionTable}`);
        } catch (saveError: any) {
          console.error('Error al guardar preguntas:', saveError);
          toast.error('Preguntas generadas pero no se pudieron guardar: ' + (saveError?.message || 'Error desconocido'));
        }
      }
      
      toast.success(`${numQuestions} preguntas generadas correctamente`);
    } catch (e: any) {
      setManualResult("Error: " + (e?.message || "No se pudieron generar preguntas."));
      toast.error("Error al generar preguntas");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyResult = async () => {
    await navigator.clipboard.writeText(manualResult);
    toast.success('¡Preguntas copiadas! Ahora puedes pegarlas donde quieras.');
  };

  const selectedModelDetails = models.find(m => m.id === selectedModel);
  const maxTokens = selectedModelDetails?.config?.maxTokens || 4096;
  const estimatedTokens = estimateTokensSimple(manualText);
  const tokenUsagePercentage = (estimatedTokens / maxTokens) * 100;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-6xl">
        {/* Header */}
        <div className="space-y-2 mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Generador Manual de Preguntas</h1>
          <p className="text-muted-foreground">
            Introduce tu texto y genera preguntas personalizadas con inteligencia artificial
          </p>
        </div>

        {/* Loading and Error States */}
        {!isReady && !initError && (
          <Alert variant="info" className="mb-6">
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertTitle>Inicializando</AlertTitle>
            <AlertDescription>Cargando servicio de IA...</AlertDescription>
          </Alert>
        )}

        {initError && (
          <Alert variant="error" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error de inicialización</AlertTitle>
            <AlertDescription>{initError}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Model Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bot className="w-5 h-5 text-primary" />
                  <span>Configuración del Modelo</span>
                </CardTitle>
                <CardDescription>
                  Selecciona el proveedor y modelo de IA
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Proveedor
                    </label>
                    <select 
                      value={selectedProvider} 
                      onChange={e => setSelectedProvider(e.target.value as any)} 
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      disabled={isSyncing || !isReady}
                    >
                      {Array.from(new Set(availableModels.map(m => m.provider))).map(p => (
                        <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Modelo
                    </label>
                    <select 
                      value={selectedModel} 
                      onChange={e => setSelectedModel(e.target.value)} 
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      disabled={isSyncing || !isReady}
                    >
                      {models.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>

                  {selectedModelDetails && (
                    <div className="p-3 bg-muted/50 rounded-lg text-sm">
                      <p className="text-muted-foreground mb-1">Descripción:</p>
                      <p className="text-foreground">{selectedModelDetails.description}</p>
                    </div>
                  )}

                  {isSyncing && (
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sincronizando...</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Generation Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5 text-primary" />
                  <span>Configuración de Generación</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Cantidad de preguntas
                    </label>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        min={1}
                        max={20}
                        value={numQuestions}
                        onChange={e => handleNumQuestionsChange(Math.max(1, Math.min(20, Number(e.target.value))))}
                        className="w-20"
                        disabled={!isReady}
                      />
                      {manualText.trim().length > 0 && (
                        <div className="space-y-3">
                          {/* Toggle entre métodos */}
                          <div className="flex flex-wrap items-center gap-2 p-2 bg-muted rounded-lg border border-border">
                            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                              Método:
                            </span>
                            
                            <div className="flex flex-wrap gap-1">
                              <Button
                                variant={!useIntelligentSuggestions ? "primary" : "outline"}
                                size="sm"
                                onClick={toggleSuggestionMethod}
                                disabled={loadingSuggestion}
                                className="h-7 px-2 text-xs whitespace-nowrap"
                              >
                                <Calculator className="w-3 h-3 mr-1 flex-shrink-0" />
                                Tradicional
                              </Button>
                              
                              <Button
                                variant={useIntelligentSuggestions ? "primary" : "outline"}
                                size="sm"
                                onClick={toggleSuggestionMethod}
                                disabled={loadingSuggestion}
                                className="h-7 px-2 text-xs whitespace-nowrap"
                              >
                                <Brain className="w-3 h-3 mr-1 flex-shrink-0" />
                                Inteligente
                              </Button>
                            </div>
                            
                            {useIntelligentSuggestions && (
                              <Badge variant="secondary" className="text-xs whitespace-nowrap">
                                🧠 Análisis IA
                              </Badge>
                            )}
                          </div>

                          {/* Sugerencias tradicionales */}
                          {!useIntelligentSuggestions && (
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                Sugerido: {suggestedQuestions}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleUseSuggested}
                                disabled={numQuestions === suggestedQuestions}
                                className="h-6 px-2 text-xs whitespace-nowrap"
                              >
                                Usar
                              </Button>
                            </div>
                          )}

                          {/* Sugerencias inteligentes */}
                          {useIntelligentSuggestions && (
                            <div className="space-y-2">
                              {loadingSuggestion ? (
                                <div className="flex flex-wrap items-center gap-2">
                                  <Loader2 className="w-3 h-3 animate-spin text-primary flex-shrink-0" />
                                  <span className="text-xs text-muted-foreground">
                                    Analizando contenido...
                                  </span>
                                </div>
                              ) : suggestionAnalysis ? (
                                <div className="space-y-2">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                      Sugerido: {suggestionAnalysis.suggestedQuestions}
                                    </span>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={handleUseIntelligentSuggested}
                                      disabled={numQuestions === suggestionAnalysis.suggestedQuestions}
                                      className="h-6 px-2 text-xs whitespace-nowrap"
                                    >
                                      Usar
                                    </Button>
                                    <Badge 
                                      variant={
                                        suggestionAnalysis.importance === 'high' ? 'destructive' :
                                        suggestionAnalysis.importance === 'medium' ? 'default' : 'secondary'
                                      }
                                      className="text-xs whitespace-nowrap"
                                    >
                                      {suggestionAnalysis.contentType}
                                    </Badge>
                                  </div>
                                  
                                  <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg border border-border">
                                    <div className="font-medium mb-2 text-foreground">📊 Análisis del contenido:</div>
                                    <div className="space-y-1">
                                      <div className="break-words">• <span className="font-medium">Tipo:</span> {suggestionAnalysis.contentType}</div>
                                      <div className="break-words">• <span className="font-medium">Densidad:</span> {suggestionAnalysis.conceptDensity}</div>
                                      <div className="break-words">• <span className="font-medium">Importancia:</span> {suggestionAnalysis.importance}</div>
                                    </div>
                                    {suggestionAnalysis.reasoning && (
                                      <div className="mt-2 pt-2 border-t border-border text-xs">
                                        <span className="font-medium">Razonamiento:</span> 
                                        <span className="break-words ml-1">{suggestionAnalysis.reasoning}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-xs text-muted-foreground">
                                  Escriba texto para ver el análisis inteligente
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      <p className="mt-2 text-xs text-muted-foreground">
                        {useIntelligentSuggestions 
                          ? "🧠 Análisis basado en contenido y densidad conceptual"
                          : "📏 Recomendación: ~1 pregunta por cada 100 palabras"
                        }
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Longitud de opciones
                    </label>
                    <select
                      value={optionLength}
                      onChange={e => setOptionLength(e.target.value as any)}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      disabled={!isReady}
                    >
                      <option value="muy_corta">Muy corta (máx 3 palabras)</option>
                      <option value="media">Media (3-15 palabras)</option>
                      <option value="larga">Larga (mín 10 palabras)</option>
                      <option value="telegram">Telegram (límites estrictos)</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Question Table Selector */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="w-5 h-5 text-primary" />
                  <span>Tabla Destino</span>
                </CardTitle>
                <CardDescription>
                  Selecciona dónde guardar las preguntas generadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <QuestionTableSelector
                  selectedTable={selectedQuestionTable}
                  onTableChange={setSelectedQuestionTable}
                  disabled={!isReady}
                  className="w-full"
                />
                {selectedQuestionTable !== 'SectionQuestion' && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium">Guardado automático activado</p>
                        <p className="text-xs mt-1">
                          Las preguntas válidas se guardarán automáticamente en la tabla seleccionada después de la generación.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart className="w-5 h-5 text-primary" />
                  <span>Estadísticas</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Palabras:</span>
                    <span className="font-medium text-foreground">
                      {manualText.trim().split(/\s+/).filter(Boolean).length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tokens estimados:</span>
                    <span className="font-medium text-foreground">
                      {estimatedTokens} / {maxTokens}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className={cn(
                        "h-2 rounded-full transition-all duration-300",
                        tokenUsagePercentage > 90 ? "bg-destructive" : 
                        tokenUsagePercentage > 70 ? "bg-yellow-500" : "bg-primary"
                      )}
                      style={{ width: `${Math.min(100, tokenUsagePercentage)}%` }}
                    />
                  </div>
                  {tokenUsagePercentage > 90 && (
                    <p className="text-xs text-destructive">
                      ⚠️ El texto puede ser demasiado largo para el modelo seleccionado
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Input Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <span>Contenido para Generar Preguntas</span>
                </CardTitle>
                <CardDescription>
                  Introduce la normativa y el texto base para generar preguntas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Normativa o Artículo (opcional)
                    </label>
                    <Input
                      type="text"
                      placeholder="Ejemplo: Orden DEF/710/2020, de 27 de julio..."
                      value={normativa}
                      onChange={e => setNormativa(e.target.value)}
                      disabled={!isReady}
                      className="w-full"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Especifica la fuente legal para un contexto más preciso
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Texto Base
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-vertical min-h-[200px]"
                      rows={8}
                      placeholder="Pega aquí el texto del que quieras generar preguntas..."
                      value={manualText}
                      onChange={e => setManualText(e.target.value)}
                      disabled={!isReady}
                    />
                  </div>

                  <Button
                    onClick={handleGenerate}
                    disabled={!isReady || isGenerating || !manualText.trim() || tokenUsagePercentage > 100}
                    size="lg"
                    className="w-full"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generando preguntas...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Generar preguntas
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Results Section */}
            {manualResult && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <Check className="w-5 h-5 text-success" />
                      <span>Preguntas Generadas</span>
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyResult}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar
                    </Button>
                  </div>
                  <CardDescription>
                    Revisa y copia las preguntas generadas en formato GIFT
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="w-full p-4 bg-muted/50 text-foreground rounded-lg text-sm overflow-x-auto whitespace-pre-wrap border border-border min-h-[200px] font-mono">
                    {manualResult}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Validation Results */}
        {validationErrors.length > 0 && (
          <div className="mt-8">
            <QuestionValidationResults
              validCount={numQuestions - validationErrors.length}
              totalCount={numQuestions}
              score={Math.max(0, 100 - validationErrors.length * 10)}
              commonIssues={Object.fromEntries(validationErrors.map(e => [e.motivo, 1]))}
              recommendations={validationErrors.map(e => e.sugerencia)}
            />
          </div>
        )}
      </div>
    </div>
  );
}