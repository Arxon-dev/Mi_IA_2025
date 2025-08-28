"use client";
import React, { useState, useEffect, useRef } from "react";
import { AIService, availableModels } from '@/services/aiService';
import { toast } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { ArrowUp } from 'lucide-react';

interface ChatMessage {
  role: "user" | "validator";
  content: string;
}

export default function ValidatorChatPage() {
  const [input, setInput] = useState("");
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'openai' | 'anthropic' | 'google' | 'deepseek' | 'xai' | 'alibaba'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('validator-provider') as any) || 'anthropic';
    }
    return 'anthropic';
  });
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('validator-model') || 'claude-3-5-sonnet-v2';
    }
    return 'claude-3-5-sonnet-v2';
  });
  const [models, setModels] = useState<any[]>([]);
  const [sourceText, setSourceText] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('validator-source-text') || '';
    }
    return '';
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // Estado para mostrar el botón solo cuando se ha hecho scroll
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    // Cargar modelos disponibles según el proveedor seleccionado
    const filtered = availableModels.filter(m => m.provider === selectedProvider);
    setModels(filtered);
    if (filtered.length > 0 && !filtered.find(m => m.id === selectedModel)) {
      setSelectedModel(filtered[0].id);
    }
    // Guardar proveedor en localStorage
    if (typeof window !== 'undefined' && selectedProvider) {
      localStorage.setItem('validator-provider', selectedProvider);
    }
  }, [selectedProvider]);

  useEffect(() => {
    // Guardar modelo en localStorage
    if (typeof window !== 'undefined' && selectedModel) {
      localStorage.setItem('validator-model', selectedModel);
    }
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Validación avanzada real usando el endpoint backend
  async function validateQuestions(text: string): Promise<ChatMessage[]> {
    const questions = text.split(/\n\n/).filter(q => q.includes("{") && q.includes("}"));
    if (questions.length === 0) {
      return [{ role: "validator", content: "No se detectaron preguntas en formato GIFT." }];
    }
    // Llama al endpoint para cada pregunta
    const results: ChatMessage[] = [];
    for (let idx = 0; idx < questions.length; idx++) {
      const q = questions[idx];
      try {
        const res = await fetch("/api/validate-question", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: q, provider: selectedProvider, model: selectedModel, sourceText })
        });
        const data = await res.json();
        if (data.feedback) {
          results.push({
            role: "validator",
            content: `Pregunta ${idx + 1}:\n${q}\n\n${data.feedback}`
          });
        } else {
          results.push({
            role: "validator",
            content: `Pregunta ${idx + 1}:\n${q}\n\n❌ Error: ${data.error || 'No se pudo validar la pregunta.'}`
          });
        }
      } catch (e: any) {
        results.push({
          role: "validator",
          content: `Pregunta ${idx + 1}:\n${q}\n\n❌ Error: ${e.message}`
        });
      }
    }
    return results;
  }

  const handleValidate = async () => {
    if (!input.trim()) return;
    setIsValidating(true);
    setChat(prev => [...prev, { role: "user", content: input }]);
    // Llamar a la validación avanzada (simulada)
    const feedbacks = await validateQuestions(input);
    setChat(prev => [...prev, ...feedbacks]);
    setIsValidating(false);
  };

  // Considerar válida si la IA responde con la frase positiva y no hay corrección/error
  const isValidFeedback = (content: string) => {
    // ✅ VALIDACIÓN NUEVA (FORMATO ESPECTACULAR): Reconocer el nuevo formato con **negrita**
    const newFormatPattern = /✅\s*\*\*VÁLIDA\*\*\s*-\s*Contenido verificado y opciones correctamente clasificadas|✅\s*\*\*VÁLIDA\*\*|🏆.*\[✅.*\*\*VÁLIDA\*\*.*\]/i.test(content);
    
    // ✅ VALIDACIÓN RIGUROSA: Formato anterior
    const rigorousValidPattern = /✅ VÁLIDA - Contenido verificado y opciones correctamente clasificadas|✅ VÁLIDA/i.test(content);
    
    // 🔄 LÓGICA ANTIGUA: Mantener para compatibilidad
    const positive = /cumple con las instrucciones y el texto fuente/i.test(content);
    
    // ❌ ERRORES CRÍTICOS: Detectar problemas serios
    const hasCorrection = /❌.*\*\*RECHAZADA\*\*|❌ ERROR DE CONTENIDO|corrección sugerida|corrección necesaria|no es la respuesta correcta|no cumple con las instrucciones|error principal|la opción correcta debe ser|no es literal|imprecisión|preferible usar la palabra exacta|debería decir|no es exactamente literal|palabra exacta|referencia incorrecta|discrepancia en la palabra clave/i.test(content);
    
    return (newFormatPattern || rigorousValidPattern || positive) && !hasCorrection;
  };
  const hasInvalid = chat.some(msg => msg.role === 'validator' && !isValidFeedback(msg.content));

  // Contar preguntas válidas y no válidas
  const validCount = chat.filter(msg => msg.role === 'validator' && isValidFeedback(msg.content)).length;
  const invalidCount = chat.filter(msg => msg.role === 'validator' && !isValidFeedback(msg.content)).length;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('validator-source-text', sourceText);
    }
  }, [sourceText]);

  return (
    <div className="flex flex-col min-h-screen items-center justify-start bg-background">
      <div className="w-full flex flex-col flex-1">
        <div className="w-full bg-card border border-border rounded-lg shadow-sm p-6 mt-8">
          {/* Avisos flotantes */}
          {invalidCount > 0 && (
            <div className="fixed top-6 right-6 z-50 bg-destructive text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-pulse">
              <span className="text-2xl font-bold">⚠️</span>
              <span className="font-extrabold text-lg uppercase">¡ATENCIÓN! {invalidCount} PREGUNTA{invalidCount > 1 ? 'S' : ''} NO VÁLIDA{invalidCount > 1 ? 'S' : ''} EN EL HISTORIAL</span>
            </div>
          )}
          {validCount > 0 && (
            <div className="fixed top-24 right-6 z-50 bg-success text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-pulse">
              <span className="text-2xl font-bold">✅</span>
              <span className="font-extrabold text-lg uppercase">{validCount} PREGUNTA{validCount > 1 ? 'S' : ''} VÁLIDA{validCount > 1 ? 'S' : ''} EN EL HISTORIAL</span>
            </div>
          )}
          <h1 className="text-2xl font-bold mb-2 text-foreground">Validador avanzado de preguntas</h1>
          <p className="mb-6 text-muted-foreground">Valida tus preguntas en formato GIFT y recibe feedback detallado. Elige el proveedor y modelo de IA, pega el texto fuente y tus preguntas.</p>
          <div className="flex flex-wrap gap-2 mb-4 items-center">
            <label className="text-sm font-medium text-foreground">Proveedor:</label>
            <select value={selectedProvider} onChange={e => setSelectedProvider(e.target.value as any)} className="border border-border rounded bg-background text-foreground px-2 py-1 text-sm focus:ring-primary focus:border-primary" disabled={isSyncing}>
              {Array.from(new Set(availableModels.map(m => m.provider))).map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <label className="text-sm font-medium text-foreground">Modelo:</label>
            <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)} className="border border-border rounded bg-background text-foreground px-2 py-1 text-sm focus:ring-primary focus:border-primary" disabled={isSyncing}>
              {models.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-foreground mb-1">Documento fuente (texto base):</label>
            <textarea
              className="w-full p-2 border border-border rounded min-h-[80px] text-sm mb-2 bg-background text-foreground focus:ring-primary focus:border-primary"
              placeholder="Pega aquí el texto fuente o documento base..."
              value={sourceText}
              onChange={e => setSourceText(e.target.value)}
              disabled={isValidating}
            />
          </div>
          <div className="mb-4">
            <textarea
              className="w-full p-2 border border-border rounded min-h-[120px] text-sm bg-background text-foreground focus:ring-primary focus:border-primary"
              placeholder="Pega aquí tus preguntas en formato GIFT para validarlas..."
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={isValidating}
            />
          </div>
          <div className="flex justify-center gap-4 mt-4">
            <button
              className="btn-primary w-full md:w-auto"
              onClick={handleValidate}
              disabled={isValidating || !input.trim()}
            >
              {isValidating ? "Validando..." : "Validar"}
            </button>
            <button
              className="btn-secondary w-full md:w-auto"
              onClick={() => {
                setChat([]);
                setInput("");
              }}
              disabled={isValidating || chat.length === 0}
            >
              Limpiar historial
            </button>
          </div>
          <div className="mt-6 bg-background border border-border rounded p-4 relative shadow-sm">
            <h2 className="text-lg font-semibold mb-2 text-foreground">Historial de validación</h2>
            {chat.length === 0 && <div className="text-muted-foreground">Aún no has validado ninguna pregunta.</div>}
            {chat.map((msg, i) => (
              <div key={i} className="mb-4">
                <div className="font-bold text-foreground">{msg.role === "user" ? "Tú" : "Validador"}:</div>
                {/* Aviso visual si la IA detecta error o corrección */}
                {msg.role === "validator" && !isValidFeedback(msg.content) && (
                  <div className="flex items-center gap-2 mb-2 p-2 border border-destructive bg-destructive/10 text-destructive rounded">
                    <span className="font-bold text-2xl">⚠️</span>
                    <span className="font-extrabold text-xl uppercase">¡PREGUNTA NO VÁLIDA! REVISA LOS ERRORES DETECTADOS ABAJO.</span>
                  </div>
                )}
                {msg.role === "validator" && isValidFeedback(msg.content) && (
                  <div className="flex items-center gap-2 mb-2 p-2 border border-success bg-success/10 text-success rounded">
                    <span className="font-bold text-2xl">✅</span>
                    <span className="font-extrabold text-xl uppercase">¡PREGUNTA VÁLIDA!</span>
                  </div>
                )}
                <div className="text-sm bg-background border border-border rounded p-2 mt-1 text-foreground">
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
              </div>
            ))}
            {/* Botón flotante scroll to top SOLO dentro del historial */}
            <button
              onClick={scrollToTop}
              className="absolute bottom-4 right-4 z-20 btn-secondary"
              title="Subir al inicio"
            >
              <ArrowUp className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Función para resaltar en negrita solo las opciones de respuesta que la IA haya marcado como incorrectas
function highlightInvalidOptions(content: string): string {
  let highlighted = content;
  const incorrectSection = content.match(/opciones incorrectas[^:]*:([\s\S]*?)(?:\n\d+\.|\n\*\*|\n\-|$)/i);
  if (incorrectSection && incorrectSection[1]) {
    const options = incorrectSection[1]
      .split(/\n|,|\-|•/)
      .map(opt => opt.trim())
      .filter(opt => opt.length > 0 && !/^\d+\./.test(opt));
    options.forEach(opt => {
      const escaped = opt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      highlighted = highlighted.replace(new RegExp(escaped, 'g'), '<b>' + opt + '</b>');
    });
  }
  return highlighted;
} 