'use client';

import React, { useEffect, useState } from 'react';
import { ProcessingMode, ProcessingConfig, DocumentSectionService } from '@/services/documentSectionService';
import { Settings, ChevronDown, HelpCircle, Shield, AlertTriangle, Info } from 'lucide-react';

interface SectionProcessingConfigProps {
  config: ProcessingConfig;
  onConfigChange: (config: ProcessingConfig) => void;
  className?: string;
  documentId?: string;
  documentContent?: string;
}

export function SectionProcessingConfig({
  config,
  onConfigChange,
  className = '',
  documentId,
  documentContent
}: SectionProcessingConfigProps) {
  const [autoDetectedType, setAutoDetectedType] = useState<'PDC-01' | 'MILITARY' | 'STANDARD' | null>(null);
  const [showOverrideWarning, setShowOverrideWarning] = useState(false);
  const [originalAutoMode, setOriginalAutoMode] = useState<ProcessingMode | null>(null);

  useEffect(() => {
    if (documentContent) {
      const isPDC01 = DocumentSectionService.detectPDC01Document(documentContent);
      const isMilitary = DocumentSectionService.detectMilitaryDoctrine(documentContent);
      
      if (isPDC01) {
        setAutoDetectedType('PDC-01');
        setOriginalAutoMode(ProcessingMode.PDC_01_DOCTRINE);
      } else if (isMilitary) {
        setAutoDetectedType('MILITARY');
        setOriginalAutoMode(ProcessingMode.MILITARY_DOCTRINE);
      } else {
        setAutoDetectedType('STANDARD');
        setOriginalAutoMode(null);
      }
    }
  }, [documentContent]);

  useEffect(() => {
    if (autoDetectedType && originalAutoMode) {
      const isOverriding = config.mode !== originalAutoMode;
      setShowOverrideWarning(isOverriding);
    }
  }, [config.mode, autoDetectedType, originalAutoMode]);

  const handleModeChange = (mode: ProcessingMode) => {
    onConfigChange({
      ...config,
      mode
    });
  };

  const handleRestoreAutomatic = () => {
    if (originalAutoMode) {
      handleModeChange(originalAutoMode);
      setShowOverrideWarning(false);
    }
  };

  const handleOptionsChange = (options: Partial<ProcessingConfig['options']>) => {
    onConfigChange({
      ...config,
      options: {
        ...config.options,
        ...options
      }
    });
  };

  return (
    <div className={`flex flex-col gap-4 p-4 rounded-lg border border-gray-200 ${className}`}>
      <div className="flex items-center gap-2">
        <Settings className="w-4 h-4" />
        <h3 className="text-sm font-medium">Modo de Procesamiento</h3>
        <div className="relative group">
          <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
            Selecciona cómo se dividirá el documento en secciones
          </div>
        </div>
      </div>

      {autoDetectedType && (
        <div className={`p-3 rounded-lg border-l-4 ${
          autoDetectedType === 'PDC-01' 
            ? 'bg-blue-50 border-blue-500 dark:bg-blue-950/30' 
            : autoDetectedType === 'MILITARY'
            ? 'bg-green-50 border-green-500 dark:bg-green-950/30'
            : 'bg-gray-50 border-gray-500 dark:bg-gray-950/30'
        }`}>
          <div className="flex items-start gap-2">
            {autoDetectedType === 'PDC-01' ? (
              <Shield className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            ) : autoDetectedType === 'MILITARY' ? (
              <Shield className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                {autoDetectedType === 'PDC-01' && '🎯 Documento PDC-01 B detectado automáticamente'}
                {autoDetectedType === 'MILITARY' && '🪖 Documento de doctrina militar detectado'}
                {autoDetectedType === 'STANDARD' && '📄 Documento estándar'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {autoDetectedType === 'PDC-01' && 'Se aplicó procesamiento específico para "Doctrina para el empleo de las FAS" con apartados predefinidos.'}
                {autoDetectedType === 'MILITARY' && 'Se aplicó procesamiento especializado para documentos de doctrina militar.'}
                {autoDetectedType === 'STANDARD' && 'Se aplicará procesamiento estándar.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {showOverrideWarning && (
        <div className="p-3 rounded-lg border-l-4 bg-yellow-50 border-yellow-500 dark:bg-yellow-950/30">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                ⚠️ Sobrescribiendo configuración automática
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Estás cambiando manualmente la configuración que fue detectada automáticamente. 
                Esto puede resultar en una extracción de secciones menos precisa.
              </p>
              <button
                onClick={handleRestoreAutomatic}
                className="mt-2 text-xs text-yellow-700 hover:text-yellow-800 underline"
              >
                🔄 Restaurar configuración automática
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <select
          className="input"
          value={config.mode}
          onChange={(e) => handleModeChange(e.target.value as ProcessingMode)}
        >
          <option value={ProcessingMode.NUMBERED}>Numerado (1., 2., etc.)</option>
          <option value={ProcessingMode.HIERARCHICAL}>Jerárquico (Capítulos)</option>
          <option value={ProcessingMode.PARAGRAPHS}>Por Párrafos</option>
          <option value={ProcessingMode.CUSTOM}>Personalizado</option>
          <option value={ProcessingMode.GENERIC}>Genérico</option>
          <option value={ProcessingMode.FULL}>Documento completo (una sola sección)</option>
          
          {/* ✅ OPCIONES SIEMPRE DISPONIBLES - YA NO CONDICIONADAS A DETECCIÓN */}
          <option value={ProcessingMode.PDC_01_DOCTRINE}>
            🎯 PDC-01 B (Doctrina FAS){autoDetectedType === 'PDC-01' ? ' - Detectado' : ' - Manual'}
          </option>
          <option value={ProcessingMode.MILITARY_DOCTRINE}>
            🪖 Doctrina Militar{autoDetectedType === 'MILITARY' ? ' - Detectado' : ' - Manual'}
          </option>
        </select>

        {config.mode === ProcessingMode.NUMBERED && (
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.options.numbered?.includeSubsections}
                onChange={(e) => handleOptionsChange({
                  numbered: {
                    ...config.options.numbered,
                    includeSubsections: e.target.checked
                  }
                })}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Incluir subsecciones</span>
              <div className="relative group">
                <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                  Incluye también las subsecciones numeradas (1.1, 1.2, etc.)
                </div>
              </div>
            </label>
          </div>
        )}

        {config.mode === ProcessingMode.HIERARCHICAL && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <input
                className="input"
                type="number"
                value={config.options.hierarchical?.maxDepth || 3}
                onChange={(e) => handleOptionsChange({
                  hierarchical: {
                    ...config.options.hierarchical,
                    maxDepth: parseInt(e.target.value)
                  }
                })}
                min={1}
                max={5}
                placeholder="Profundidad máxima"
              />
              <div className="relative group">
                <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                  Nivel máximo de profundidad para la jerarquía (ej: Capítulo {'->'} Sección {'->'} Artículo)
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-primary">Niveles Jerárquicos</label>
              <div className="space-y-2">
                {['CAPÍTULO', 'SECCIÓN', 'ARTÍCULO', 'DISPOSICIÓN'].map((level) => {
                  const checked = config.options.hierarchical?.levels?.includes(level) ?? true;
                  return (
                    <div key={level} className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-pressed={checked}
                        onClick={() => {
                          const currentLevels = config.options.hierarchical?.levels || [];
                          const newLevels = checked
                            ? currentLevels.filter(l => l !== level)
                            : [...currentLevels, level];
                          const newConfig = {
                            ...config,
                            options: {
                              ...config.options,
                              hierarchical: {
                                ...config.options.hierarchical,
                                levels: newLevels
                              }
                            }
                          };
                          onConfigChange(newConfig);
                        }}
                        className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-accent focus:ring-offset-1 border border-border
                          ${checked ? 'bg-primary' : 'bg-muted'}`}
                        id={`hierarchical-level-${level}`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200
                            ${checked ? 'translate-x-6' : 'translate-x-1'}`}
                        />
                      </button>
                      <label htmlFor={`hierarchical-level-${level}`} className="text-sm text-foreground font-medium select-none cursor-pointer">
                        {level}
                      </label>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2">
                <div className="text-xs text-muted-foreground italic">
                  Selecciona los niveles que deseas procesar en el documento
                </div>
              </div>
            </div>
          </div>
        )}

        {config.mode === ProcessingMode.PARAGRAPHS && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <input
                className="input"
                type="number"
                value={config.options.paragraphs?.maxParagraphsPerSection || 10}
                onChange={(e) => handleOptionsChange({
                  paragraphs: {
                    ...config.options.paragraphs,
                    maxParagraphsPerSection: parseInt(e.target.value)
                  }
                })}
                min={1}
                max={20}
                placeholder="Párrafos por sección"
              />
              <div className="relative group">
                <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                  Número máximo de párrafos que se agruparán en cada sección
                </div>
              </div>
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.options.paragraphs?.joinShortParagraphs}
                onChange={(e) => handleOptionsChange({
                  paragraphs: {
                    ...config.options.paragraphs,
                    joinShortParagraphs: e.target.checked
                  }
                })}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Unir párrafos cortos</span>
              <div className="relative group">
                <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                  Une automáticamente párrafos cortos relacionados para formar secciones más coherentes
                </div>
              </div>
            </label>
          </div>
        )}

        {config.mode === ProcessingMode.CUSTOM && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <input
                className="input"
                type="text"
                value={config.options.custom?.patterns?.[0] || ''}
                onChange={(e) => handleOptionsChange({
                  custom: {
                    ...config.options.custom,
                    patterns: [e.target.value]
                  }
                })}
                placeholder="Patrón personalizado (regex)"
              />
              <div className="relative group">
                <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                  Expresión regular para identificar el inicio de cada sección
                </div>
              </div>
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.options.custom?.caseSensitive}
                onChange={(e) => handleOptionsChange({
                  custom: {
                    ...config.options.custom,
                    caseSensitive: e.target.checked
                  }
                })}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Distinguir mayúsculas/minúsculas</span>
              <div className="relative group">
                <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                  Hace que el patrón sea sensible a mayúsculas y minúsculas
                </div>
              </div>
            </label>
          </div>
        )}

        {config.mode === ProcessingMode.FULL && (
          <div className="flex flex-col gap-2">
            <div className="text-sm text-gray-600">
              El documento se procesará como una única sección, mostrando todo el contenido junto.
            </div>
          </div>
        )}

        {config.mode === ProcessingMode.PDC_01_DOCTRINE && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Modo PDC-01 B Activo
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                  Procesamiento específico para "Doctrina para el empleo de las FAS" con apartados predefinidos como:
                  ENTORNO GLOBAL DE SEGURIDAD, CONTEXTO DE COMPETICIÓN, EMPLEO Y MISIONES DE LAS FUERZAS ARMADAS, etc.
                </p>
              </div>
            </div>
          </div>
        )}

        {config.mode === ProcessingMode.MILITARY_DOCTRINE && (
          <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Modo Doctrina Militar Activo
                </p>
                <p className="text-xs text-green-600 dark:text-green-300 mt-1">
                  Procesamiento especializado para documentos militares con detección de capítulos, 
                  secciones numeradas y agrupación de párrafos.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="border-t border-gray-200 pt-3 space-y-2">
          <label className="text-sm font-semibold text-primary">Opciones Generales</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600">Longitud mínima de sección</label>
              <input
                className="input text-xs"
                type="number"
                value={config.options.minSectionLength || 100}
                onChange={(e) => handleOptionsChange({
                  minSectionLength: parseInt(e.target.value) || 100
                })}
                min={50}
                max={1000}
                placeholder="100"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600">Longitud máxima de sección</label>
              <input
                className="input text-xs"
                type="number"
                value={config.options.maxSectionLength || 5000}
                onChange={(e) => handleOptionsChange({
                  maxSectionLength: parseInt(e.target.value) || 5000
                })}
                min={1000}
                max={50000}
                placeholder="5000"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 