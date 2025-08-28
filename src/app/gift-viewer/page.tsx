'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import QuestionValidator from '@/components/QuestionValidator';
import QuestionValidationResults from '@/components/QuestionValidationResults';

interface Answer {
  text: string;
  iscorrect: boolean;
}

interface Question {
  title: string;
  reference: string;
  questionText: string;
  answers: Answer[];
  feedback: string;
}

function GiftViewer() {
  const searchParams = useSearchParams();
  const [content, setContent] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sourceContent, setSourceContent] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'view' | 'validate'>('view');
  const [validationStats, setValidationStats] = useState<any>(null);

  useEffect(() => {
    // Intentar obtener datos primero de los parámetros de la URL (para compatibilidad)
    const encodedContent = searchParams?.get('content') ?? null;
    const encodedSourceContent = searchParams?.get('source') ?? null;
    
    // Comprobar si hay datos en localStorage (prioridad)
    const localContent = typeof window !== 'undefined' ? localStorage.getItem('gift_viewer_content') : null;
    const localSourceContent = typeof window !== 'undefined' ? localStorage.getItem('gift_viewer_source') : null;
    
    let finalContent = '';
    
    if (localContent) {
      // Usar datos de localStorage
      finalContent = localContent;
      setContent(localContent);
      
      if (localSourceContent) {
        setSourceContent(localSourceContent);
      }
      
      // Limpiar localStorage después de usarlo
      localStorage.removeItem('gift_viewer_content');
      localStorage.removeItem('gift_viewer_source');
    } else if (encodedContent) {
      // Usar datos de URL como fallback
      finalContent = decodeURIComponent(encodedContent);
      setContent(finalContent);
      
      // Obtener el contenido fuente para validación si está disponible
      if (encodedSourceContent) {
        const decodedSourceContent = decodeURIComponent(encodedSourceContent);
        setSourceContent(decodedSourceContent);
      }
    }
    
    if (finalContent) {
      // Modificar el regex para capturar y omitir los comentarios de dificultad
      const questionBlocks = finalContent.split(/\/\/\s*Pregunta\s+\d+(?:\s*-\s*[a-zA-Z]+)?\./g).filter(Boolean);
      const parsedQuestions = questionBlocks.map((block: string, index: number) => {
        // Extraer título y contenido
        const titleMatch = block.match(/^([^:]+)::([^:]+)::/);
        const title = titleMatch ? titleMatch[1].trim() : `Pregunta ${index + 1}`;
        const reference = titleMatch ? titleMatch[2].trim() : '';
        
        // Extraer pregunta y respuestas
        const questionMatch = block.match(/{([^}]+)}/);
        const questionText = block.substring(0, questionMatch?.index).trim();
        
        // Extraer retroalimentación
        const feedbackMatch = block.match(/####\s*RETROALIMENTACIÓN:([\s\S]+)$/);
        const feedback = feedbackMatch ? feedbackMatch[1].trim() : '';
        
        // Extraer respuestas
        const answersText = questionMatch ? questionMatch[1] : '';
        const answers = answersText.split(/[~=]/).filter(Boolean).map((answer: string) => ({
          text: answer.trim(),
          iscorrect: answersText.includes(`=${answer.trim()}`)
        }));
        
        return {
          title,
          reference,
          questionText,
          answers,
          feedback
        };
      });
      
      setQuestions(parsedQuestions);
    }
  }, [searchParams]);

  // Manejar cambio entre pestañas
  const handleTabChange = (tab: 'view' | 'validate') => {
    setActiveTab(tab);
  };
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('gift_viewer_content');
      localStorage.removeItem('gift_viewer_source');
    }
  }, []);

  return (
    <div className="container max-w-4xl mx-auto p-4">
      <div className="mb-6">
        <Link href="/upload" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Volver a Cargar Documento
        </Link>
        <h1 className="text-2xl font-bold">Visor GIFT</h1>
      </div>
      
      {/* Pestañas */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'view'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => handleTabChange('view')}
        >
          Ver Preguntas
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'validate'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => handleTabChange('validate')}
        >
          Validar Preguntas
        </button>
      </div>
      
      {/* Contenido de la pestaña activa */}
      {activeTab === 'validate' && (
        <>
          {sourceContent ? (
            <>
              <QuestionValidator
                sourceContent={sourceContent}
                generatedQuestions={content}
                onValidationStats={setValidationStats}
              />
              {/* Panel de resultados debajo del panel derecho */}
              {validationStats && (
                (Object.keys(validationStats.commonIssues || {}).length > 0 ||
                 (validationStats.distractorLengthWarnings && validationStats.distractorLengthWarnings.length > 0) ||
                 (validationStats.issuesByType && Object.keys(validationStats.issuesByType).length > 0) ||
                 (validationStats.recommendations && validationStats.recommendations.length > 0)
                ) && (
                  <div className="mt-8">
                    <QuestionValidationResults
                      validCount={validationStats.validCount}
                      totalCount={validationStats.totalCount || 0}
                      score={validationStats.totalScore}
                      commonIssues={validationStats.commonIssues}
                      recommendations={validationStats.recommendations}
                      distractorLengthWarnings={validationStats.distractorLengthWarnings}
                      issuesByType={validationStats.issuesByType}
                    />
                  </div>
                )
              )}
            </>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md text-yellow-800">
              <p className="font-medium">No se encontró contenido fuente para validación</p>
              <p className="text-sm mt-1">
                Para validar preguntas, es necesario disponer del contenido original del documento.
              </p>
            </div>
          )}
        </>
      )}
      
      {activeTab === 'view' && (
        <div className="space-y-8">
          {questions.map((question, index) => (
            <div key={index} className="bg-card rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b">
                <h3 className="font-medium">Pregunta {index + 1}. {question.title}</h3>
                {question.reference && (
                  <p className="text-sm text-gray-600">Referencia: {question.reference}</p>
                )}
              </div>
              
              <div className="p-4">
                {/* Texto de la pregunta */}
                <div className="mb-4" dangerouslySetInnerHTML={{ __html: question.questionText }} />
                
                {/* Respuestas */}
                <div className="space-y-2 mb-6">
                  {question.answers.map((answer: Answer, answerIndex: number) => (
                    <div 
                      key={answerIndex}
                      className={`p-3 rounded-md ${
                        answer.iscorrect 
                          ? 'bg-green-50 border border-green-200' 
                          : 'bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <div className="flex items-start">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mr-3 mt-0.5 ${
                          answer.iscorrect 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gray-300 text-gray-600'
                        }`}>
                          {answer.iscorrect ? '✓' : '×'}
                        </div>
                        <div dangerouslySetInnerHTML={{ __html: answer.text }} />
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Retroalimentación */}
                {question.feedback && (
                  <div className="bg-blue-50 p-4 rounded-md">
                    <h4 className="font-medium text-blue-900 mb-2">Retroalimentación</h4>
                    <div 
                      className="text-blue-800"
                      dangerouslySetInnerHTML={{ __html: question.feedback }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function GiftViewerPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <GiftViewer />
    </Suspense>
  );
}
