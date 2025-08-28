'use client';

import { useEffect, useState } from 'react';
import { MarkdownService } from '@/services/markdownService';
import parse, { domToReact, HTMLReactParserOptions, Element, Text } from 'html-react-parser';

interface MarkdownViewerProps {
  content: string;
  isHtml?: boolean; // Nueva prop para renderizar HTML directamente
  searchTerm?: string; // Nueva prop para resaltar
}

// Función para resaltar matches en HTML final
function highlightHtml(html: string, query: string) {
  if (!query) return parse(html);
  const normalize = (str: string) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const words = query.trim().split(/\s+/).filter(Boolean).map(normalize);
  if (words.length === 0) return parse(html);
  const options: HTMLReactParserOptions = {
    replace: (node) => {
      if (node.type === 'text') {
        let value = node.data as string;
        let replaced = value;
        for (const word of words) {
          if (!word) continue;
          replaced = replaced.replace(new RegExp(word, 'gi'), (match) => `<span class='bg-red-400 text-white font-semibold rounded px-0.5 border-none'>${match}</span>`);
        }
        if (replaced !== value) {
          return <span dangerouslySetInnerHTML={{ __html: replaced }} />;
        }
      }
    }
  };
  return parse(html, options);
}

// Helper para envolver HTML en un <div> si no lo está
function wrapHtml(html: string) {
  const trimmed = html.trim();
  if (trimmed.startsWith('<div') && trimmed.endsWith('</div>')) return html;
  return `<div>${html}</div>`;
}

export function MarkdownViewer({ content, isHtml = false, searchTerm }: MarkdownViewerProps) {
  const [htmlContent, setHtmlContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const maxPreviewLength = 300; // Longitud máxima para la vista previa

  useEffect(() => {
    if (isHtml) {
      setHtmlContent(content);
      setError(null);
      return;
    }
    const renderMarkdown = async () => {
      try {
        let rendered = await MarkdownService.parseMarkdown(content);
        // Asegurarse de que las imágenes rotas no generen errores
        rendered = rendered.replace(/<img[^>]*>/g, '');
        setHtmlContent(rendered);
        setError(null);
      } catch (error) {
        console.error('Error al renderizar Markdown:', error);
        setError(error instanceof Error ? error.message : 'Error al renderizar el contenido');
      }
    };
    renderMarkdown();
  }, [content, isHtml, searchTerm]);

  // Función para obtener el contenido truncado
  const getTruncatedContent = (): React.ReactNode => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    if (textContent.length <= maxPreviewLength) return highlightHtml(htmlContent ?? '', searchTerm ?? '');
    const truncated = textContent.substring(0, maxPreviewLength);
    return <p>{highlightHtml(truncated + '...', searchTerm ?? '')}</p>;
  };

  const handleCopy = async () => {
    try {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      const textContent = tempDiv.textContent || tempDiv.innerText;
      await navigator.clipboard.writeText(textContent);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  return (
    <div className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl mx-auto py-4">
      {error && (
        <div className="text-red-600 mb-4 p-2 bg-red-50 rounded">
          {error}
        </div>
      )}
      <div className="bg-card rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center" style={{ backgroundColor: '#252B37' }}>
          <h2 className="text-xl font-bold" style={{ color: '#fff' }}>Contenido del artículo</h2>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className={`h-10 px-5 rounded-lg font-semibold text-base flex items-center gap-2 border border-orange-400 text-orange-400 bg-transparent transition-colors
                hover:bg-orange-400 hover:text-white active:bg-orange-500 active:text-white
                ${!htmlContent ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Copiar contenido"
              disabled={!htmlContent}
            >
              {copySuccess ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copiado
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  Copiar
                </>
              )}
            </button>
            {htmlContent.length > 0 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`h-10 px-5 rounded-lg font-semibold text-base flex items-center gap-2 border border-orange-400 text-orange-400 bg-transparent transition-colors
                  hover:bg-orange-400 hover:text-white active:bg-orange-500 active:text-white`}
              >
                {isExpanded ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                    Contraer
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    Expandir
                  </>
                )}
              </button>
            )}
          </div>
        </div>
        <div className="p-4">
          <style jsx>{`
            .gift-code-block {
              background-color: #f3f4f6;
              border-radius: 0.375rem;
              padding: 1rem;
              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
              font-size: 0.875rem;
              white-space: pre-wrap;
              overflow-x: auto;
              margin-bottom: 1rem;
              line-height: 1.5;
            }
            
            .gift-code-block b {
              font-weight: bold;
              color: #1f2937;
            }
            
            .gift-code-block br {
              display: block;
              content: "";
              margin-top: 0.5rem;
            }
            
            /* Estilos para las secciones específicas */
            .gift-code-block .retroalimentacion {
              margin-top: 1rem;
              font-weight: bold;
            }
            
            /* Estilos para los emojis */
            .gift-code-block .emoji {
              display: inline-block;
              margin-right: 0.25rem;
            }
            
            /* Estilos para el modo código fuente */
            .source-code {
              background-color: #1e293b;
              color: #e2e8f0;
              border-radius: 0.375rem;
              padding: 1rem;
              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
              font-size: 0.875rem;
              white-space: pre-wrap;
              overflow-x: auto;
              line-height: 1.5;
            }
            
            .source-code .tag {
              color: #93c5fd;
              font-weight: bold;
            }
            
            .source-code .attr {
              color: #fbbf24;
              font-style: italic;
            }
            
            .source-code .string {
              color: #a7f3d0;
            }
            
            .source-code .emoji {
              color: #f472b6;
              font-size: 1.1em;
            }
            
            /* Añadir un borde para que se vea mejor */
            .source-code {
              border: 1px solid #334155;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            }
          `}</style>
          <div
            className={`markdown-content transition-all duration-300 ${!isExpanded ? 'max-h-[200px] overflow-hidden' : ''}`}
          >
            {highlightHtml(htmlContent ?? '', searchTerm ?? '')}
          </div>
        </div>
      </div>
    </div>
  );
} 