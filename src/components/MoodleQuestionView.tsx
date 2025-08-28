import React from 'react';
import { GiftParsedQuestion } from '../utils/giftParser';
import { CheckCircle, Info, BookOpen, Brain, Search, FileText } from 'lucide-react';

interface MoodleQuestionViewProps {
  question: GiftParsedQuestion;
  index?: number;
  condensed?: boolean;
}

export const MoodleQuestionView: React.FC<MoodleQuestionViewProps> = ({ question, index, condensed = false }) => {
  // Versión condensada solo muestra lo esencial (para el futuro)
  if (condensed) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 animate-fade-in">
        <div className="flex items-center gap-3">
          {typeof index === 'number' && (
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-md shadow-sm border border-blue-200">
              {index + 1}
            </span>
          )}
          <span className="text-lg font-medium text-gray-900" dangerouslySetInnerHTML={{ __html: question.enunciado }} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 mb-8 overflow-hidden animate-fade-in">
      {/* Cabecera y enunciado */}
      <div className="flex items-center gap-3 px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
        {typeof index === 'number' && (
          <span className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold text-lg shadow-sm border border-blue-200">
            {index + 1}
          </span>
        )}
        <span className="text-xl font-semibold text-gray-900" dangerouslySetInnerHTML={{ __html: question.enunciado }} />
      </div>
      {/* Opciones */}
      <div className="px-8 py-6">
        <ul className="space-y-3">
          {question.opciones.map((opt, i) => (
            <li
              key={i}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all shadow-sm
                ${opt.iscorrect
                  ? 'border-green-400 bg-green-50 ring-2 ring-green-200'
                  : 'border-gray-200 bg-gray-50 hover:bg-gray-100'}
              `}
            >
              <span
                className={`inline-flex items-center justify-center w-6 h-6 rounded-full border-2 text-lg
                  ${opt.iscorrect
                    ? 'border-green-500 bg-green-100 text-green-600'
                    : 'border-gray-300 bg-white text-gray-400'}
                `}
              >
                {opt.iscorrect ? <CheckCircle className="w-5 h-5" /> : <span className="block w-3 h-3 rounded-full bg-gray-300" />}
              </span>
              <span className="text-base text-gray-900" dangerouslySetInnerHTML={{ __html: opt.text }} />
            </li>
          ))}
        </ul>
      </div>
      {/* Bloques informativos */}
      <div className="space-y-3 px-8 pb-6">
        {question.retroalimentacion && (
          <div className="flex items-start gap-2 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4 shadow-sm">
            <Info className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <div className="font-semibold text-yellow-800 mb-1">Retroalimentación:</div>
              <div className="text-gray-800 text-sm" dangerouslySetInnerHTML={{ __html: question.retroalimentacion }} />
            </div>
          </div>
        )}
        {question.desgloseEstructurado && (
          <div className="flex items-start gap-2 bg-blue-50 border-l-4 border-blue-400 rounded-lg p-4 shadow-sm">
            <Search className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <div className="font-semibold text-blue-800 mb-1">🔍 Desglose estructurado:</div>
              <div className="text-gray-800 text-sm" dangerouslySetInnerHTML={{ __html: question.desgloseEstructurado }} />
            </div>
          </div>
        )}
        {question.aplicacionPractica && (
          <div className="flex items-start gap-2 bg-green-50 border-l-4 border-green-400 rounded-lg p-4 shadow-sm">
            <BookOpen className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <div className="font-semibold text-green-800 mb-1">⚖️ Aplicación práctica:</div>
              <div className="text-gray-800 text-sm" dangerouslySetInnerHTML={{ __html: question.aplicacionPractica }} />
            </div>
          </div>
        )}
        {question.bloqueReglaMnemotecnica && (
          <div className="flex items-start gap-2 bg-purple-50 border-l-4 border-purple-400 rounded-lg p-4 shadow-sm">
            <Brain className="w-5 h-5 text-purple-600 mt-0.5" />
            <div>
              <div className="font-semibold text-purple-800 mb-1">🧠 Regla mnemotécnica:</div>
              <div className="text-gray-800 text-sm" dangerouslySetInnerHTML={{ __html: question.bloqueReglaMnemotecnica }} />
            </div>
          </div>
        )}
        {question.bloqueReferencia && (
          <div className="flex items-start gap-2 bg-gray-50 border-l-4 border-gray-400 rounded-lg p-4 shadow-sm">
            <FileText className="w-5 h-5 text-gray-600 mt-0.5" />
            <div>
              <div className="font-semibold text-gray-700 mb-1">Referencia:</div>
              <div className="text-gray-800 text-sm font-mono" dangerouslySetInnerHTML={{ __html: question.bloqueReferencia }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 