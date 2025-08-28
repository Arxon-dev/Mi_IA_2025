'use client';

import React, { useState, useEffect } from 'react';
import { ConfidenceLevel, ValidationResult, ValidationIssue } from '@/services/questionValidationService';
import { QuestionValidationService } from '@/services/questionValidationService';
import QuestionValidationResults from './QuestionValidationResults';

interface QuestionValidatorProps {
  sourceContent: string;
  generatedQuestions: string;
  onValidated?: (results: ValidationResult[]) => void;
  onValidationStats?: (stats: any) => void;
}

const QuestionValidator: React.FC<QuestionValidatorProps> = ({
  sourceContent,
  generatedQuestions,
  onValidated,
  onValidationStats
}) => {
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [showAllQuestions, setShowAllQuestions] = useState<boolean>(false);
  const [expandedIssue, setExpandedIssue] = useState<number | null>(null);
  const [editedQuestion, setEditedQuestion] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [validationStats, setValidationStats] = useState<any>(null);

  // Función para validar preguntas
  const validateQuestions = async () => {
    if (!sourceContent || !generatedQuestions) return;
    
    setLoading(true);
    try {
      const validationResults = await QuestionValidationService.validateQuestionsWithPrompts(
        sourceContent,
        generatedQuestions
      );
      
      setResults(validationResults);
      setCurrentQuestionIndex(0);
      
      // Obtener estadísticas de validación (incluye distractorLengthWarnings)
      const parsedQuestions = generatedQuestions.split(/\n\s*\n/).filter(block => block.includes('{'));
      const stats = await import('@/services/promptValidationService').then(mod => mod.PromptValidationService.validateQuestionSet(parsedQuestions));
      setValidationStats(stats);
      
      // Notificar al padre
      if (onValidationStats) {
        onValidationStats(stats);
      }
      
      // Notificar al componente padre si es necesario
      if (onValidated) {
        onValidated(validationResults);
      }
    } catch (error) {
      console.error('Error al validar preguntas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Comenzar validación automáticamente cuando se reciben los props
  useEffect(() => {
    if (sourceContent && generatedQuestions) {
      validateQuestions();
    }
  }, [sourceContent, generatedQuestions]);

  // Función para obtener el color según el nivel de confianza
  const getConfidenceColor = (level: ConfidenceLevel): string => {
    switch (level) {
      case ConfidenceLevel.HIGH:
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case ConfidenceLevel.MEDIUM:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case ConfidenceLevel.LOW:
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Función para obtener el color según la severidad del problema
  const getIssueSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'error':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Función para editar una pregunta
  const startEditing = (questionText: string) => {
    setEditedQuestion(questionText);
    setIsEditing(true);
  };

  // Función para guardar una pregunta editada
  const saveEditedQuestion = () => {
    if (!editedQuestion.trim()) return;
    
    // Crear una copia de los resultados para modificarla
    const updatedResults = [...results];
    updatedResults[currentQuestionIndex] = {
      ...updatedResults[currentQuestionIndex],
      originalQuestion: editedQuestion
    };
    
    setResults(updatedResults);
    setIsEditing(false);
    
    // Notificar al componente padre si es necesario
    if (onValidated) {
      onValidated(updatedResults);
    }
  };

  // Función para ir a la siguiente pregunta
  const nextQuestion = () => {
    if (currentQuestionIndex < results.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setExpandedIssue(null);
    }
  };

  // Función para ir a la pregunta anterior
  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setExpandedIssue(null);
    }
  };

  // Agrupar resultados por nivel de confianza
  const groupedResults = results.reduce((acc, result, index) => {
    if (!acc[result.confidenceLevel]) {
      acc[result.confidenceLevel] = [];
    }
    acc[result.confidenceLevel].push({ result, index });
    return acc;
  }, {} as Record<ConfidenceLevel, { result: ValidationResult, index: number }[]>);

  // Renderizar indicadores de confianza
  const renderConfidenceStats = () => {
    const total = results.length;
    if (total === 0) return null;
    
    const highCount = groupedResults[ConfidenceLevel.HIGH]?.length || 0;
    const mediumCount = groupedResults[ConfidenceLevel.MEDIUM]?.length || 0;
    const lowCount = groupedResults[ConfidenceLevel.LOW]?.length || 0;
    
    const highPercent = Math.round((highCount / total) * 100);
    const mediumPercent = Math.round((mediumCount / total) * 100);
    const lowPercent = Math.round((lowCount / total) * 100);
    
    return (
      <div className="flex items-center space-x-4 mb-4">
        <div className="text-sm font-medium">Resumen de validación:</div>
        <div className="flex items-center space-x-2">
          <div className="h-3 rounded-full bg-blue-500" style={{ width: `${highPercent}px` }}></div>
          <span className="text-sm text-blue-800">{highCount} ({highPercent}%)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-3 rounded-full bg-yellow-500" style={{ width: `${mediumPercent}px` }}></div>
          <span className="text-sm text-yellow-800">{mediumCount} ({mediumPercent}%)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-3 rounded-full bg-red-500" style={{ width: `${lowPercent}px` }}></div>
          <span className="text-sm text-red-800">{lowCount} ({lowPercent}%)</span>
        </div>
      </div>
    );
  };

  // Renderizar una pregunta individual
  const renderQuestion = (result: ValidationResult, index: number) => {
    const isCurrentQuestion = currentQuestionIndex === index;
    const confidenceColor = getConfidenceColor(result.confidenceLevel);
    
    return (
      <div 
        key={`question-${index}`} 
        className={`border ${confidenceColor} rounded-lg p-4 mb-4 ${isCurrentQuestion ? 'ring-2 ring-blue-500' : ''} ${showAllQuestions || isCurrentQuestion ? 'block' : 'hidden'}`}
      >
        <div className="flex justify-between items-start mb-2">
          <div className="font-medium">Pregunta {index + 1}</div>
          <div className="text-sm">
            Confianza: <span className="font-medium">{result.confidenceScore}%</span>
          </div>
        </div>
        
        {isEditing && isCurrentQuestion ? (
          <div className="mb-4">
            <textarea
              className="w-full h-40 p-2 border border-gray-300 rounded"
              value={editedQuestion}
              onChange={(e) => setEditedQuestion(e.target.value)}
            />
            <div className="flex justify-end space-x-2 mt-2">
              <button
                className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                onClick={() => setIsEditing(false)}
              >
                Cancelar
              </button>
              <button
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={saveEditedQuestion}
              >
                Guardar
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-2 rounded">
              {result.originalQuestion}
            </pre>
            {isCurrentQuestion && (
              <div className="flex justify-end mt-2">
                <button
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  onClick={() => startEditing(result.originalQuestion)}
                >
                  Editar
                </button>
              </div>
            )}
          </div>
        )}
        
        {result.issues.length > 0 && (
          <div className="mb-4">
            <div className="font-medium mb-2">Problemas detectados:</div>
            <ul className="space-y-2">
              {result.issues.map((issue, issueIndex) => (
                <li 
                  key={`issue-${index}-${issueIndex}`}
                  className={`border ${getIssueSeverityColor(issue.severity)} p-2 rounded cursor-pointer`}
                  onClick={() => setExpandedIssue(expandedIssue === issueIndex ? null : issueIndex)}
                >
                  <div className="flex justify-between items-center">
                    <div className="font-medium">{issue.type.charAt(0).toUpperCase() + issue.type.slice(1)}</div>
                    <div className="text-xs uppercase font-semibold">{issue.severity}</div>
                  </div>
                  {expandedIssue === issueIndex && (
                    <div className="mt-2 text-sm">{issue.description}</div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {result.suggestedFix && isCurrentQuestion && (
          <div className="mb-4">
            <div className="font-medium mb-1">Sugerencia de mejora:</div>
            <div className="text-sm bg-blue-50 p-2 rounded">{result.suggestedFix}</div>
            <div className="flex justify-end mt-2">
              <button
                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                onClick={() => result.suggestedFix && startEditing(result.suggestedFix)}
              >
                Aplicar sugerencia
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-700">Validando preguntas...</span>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No hay preguntas para validar.
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Validación de Preguntas</h2>
      
      {renderConfidenceStats()}
      
      <div className="mb-4 flex justify-between items-center">
        <div>
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={showAllQuestions}
              onChange={() => setShowAllQuestions(!showAllQuestions)}
              className="rounded text-blue-500"
            />
            <span>Mostrar todas las preguntas</span>
          </label>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={prevQuestion}
            disabled={currentQuestionIndex === 0}
            className={`px-3 py-1 rounded ${currentQuestionIndex === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
          >
            Anterior
          </button>
          <span className="text-sm">
            {currentQuestionIndex + 1} de {results.length}
          </span>
          <button
            onClick={nextQuestion}
            disabled={currentQuestionIndex === results.length - 1}
            className={`px-3 py-1 rounded ${currentQuestionIndex === results.length - 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
          >
            Siguiente
          </button>
        </div>
      </div>
      
      <div className="space-y-4">
        {results.map((result, index) => renderQuestion(result, index))}
      </div>
    </div>
  );
};

export default QuestionValidator;
