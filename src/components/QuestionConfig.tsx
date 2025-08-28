'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  QuestionTypeConfig, 
  DifficultyLevelConfig, 
  questionTypes as defaultQuestionTypes, 
  difficultyLevels as defaultDifficultyLevels 
} from '../services/questionGeneratorService';
import { BloomLevelConfig } from './BloomLevelConfig';
import { BloomLevel, bloomLevels as bloomLevelConfigs } from '../services/bloomTaxonomyService';
import type { OptionLengthType } from '@/services/aiService';
import { 
  ChevronDown, 
  ChevronUp, 
  BarChart, 
  Settings, 
  Target, 
  Brain, 
  Type,
  Percent,
  CheckCircle,
  AlertCircle,
  Info,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { StorageService } from '@/services/storageService';
import { toast } from 'react-hot-toast';
import {  bloomlevel as BloomLevelPrisma  } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

// NUEVO: Opciones de longitud
const optionLengthOptions = [
  { 
    value: 'muy_corta', 
    label: 'Muy corta', 
    description: 'Respuestas de 1-3 palabras',
    example: 'Sí, No, Nunca'
  },
  { 
    value: 'media', 
    label: 'Media', 
    description: 'Respuestas de 4-8 palabras',
    example: 'La respuesta correcta es...'
  },
  { 
    value: 'larga', 
    label: 'Larga', 
    description: 'Respuestas de 9+ palabras',
    example: 'Una explicación detallada que incluye...'
  },
  { 
    value: 'aleatoria', 
    label: 'Aleatoria', 
    description: 'Varía según el contexto',
    example: 'Mezclando longitudes'
  },
  { 
    value: 'telegram', 
    label: 'Telegram', 
    description: 'Límites estrictos para Telegram (sin truncamiento)',
    example: 'P: ≤300 chars, opciones: ≤150 chars, feedback: ≤200 chars'
  }
];

interface QuestionConfigProps {
  onConfigChange: (
    questionTypes: QuestionTypeConfig[],
    difficultyLevels: DifficultyLevelConfig[],
    bloomLevels: string[],
    optionLength: OptionLengthType
  ) => void;
}

// Unir y definir un tipo que represente la estructura en el estado
type CombinedBloomLevel = BloomLevelPrisma & Omit<BloomLevel, 'id' | 'name'> & {
  percentage: number; // Asegurar que percentage siempre sea un número
};

export const QuestionConfig: React.FC<QuestionConfigProps> = ({ onConfigChange }) => {
  const [questionTypes, setQuestionTypes] = useState<QuestionTypeConfig[]>(defaultQuestionTypes);
  const [difficultyLevels, setDifficultyLevels] = useState<DifficultyLevelConfig[]>(defaultDifficultyLevels);
  const [bloomLevels, setBloomLevels] = useState<CombinedBloomLevel[]>([]);
  const [optionLength, setOptionLength] = useState<OptionLengthType>('media');
  const [error, setError] = useState<string>('');
  const initializedRef = useRef<boolean>(false);
  const [expandedSection, setExpandedSection] = useState<'types' | 'length' | 'difficulty' | 'bloom' | null>('types');

  // Definir staticInfoMap a nivel de componente para que sea accesible en todas las funciones necesarias
  const staticInfoMap = new Map(
    bloomLevelConfigs.map(staticLevel => [staticLevel.id.toLowerCase(), staticLevel])
  );

  // Computados para estadísticas
  const questionTypesTotal = questionTypes.reduce((sum, type) => sum + type.percentage, 0);
  const difficultyTotal = difficultyLevels.reduce((sum, level) => sum + level.weight, 0);
  const enabledBloomLevels = bloomLevels.filter(level => level.enabled);
  const totalPercentage = enabledBloomLevels.reduce((sum, level) => sum + level.percentage, 0);
  const allSelected = bloomLevels.length > 0 && bloomLevels.every(level => level.enabled);
  const noneSelected = bloomLevels.every(level => !level.enabled);

  // Cargar configuración inicial desde el backend
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch('/api/question-config');
        if (!res.ok) throw new Error('Error al cargar la configuración de preguntas');
        const config = await res.json();
        if (config?.questionTypes) {
          setQuestionTypes(defaultQuestionTypes.map(qt => ({
            ...qt,
            percentage: (config.questionTypes && typeof config.questionTypes[qt.id] === 'number') ? config.questionTypes[qt.id] : qt.percentage
          })));
        }
        if (config?.difficultyLevels) {
          setDifficultyLevels(defaultDifficultyLevels.map(dl => ({
            ...dl,
            weight: (config.difficultyLevels && typeof config.difficultyLevels[dl.id] === 'number') ? config.difficultyLevels[dl.id] : dl.weight
          })));
        }
        if (config?.optionLength) {
          setOptionLength(config.optionLength as OptionLengthType);
        }
        if (config?.bloomLevels) {
          setBloomLevels(config.bloomLevels.map((level: any) => ({
            ...level,
            percentage: level.percentage ?? 0,
          })));
        } else {
          // fallback: cargar desde /api/bloom-levels
          const response = await fetch('/api/bloom-levels');
          if (response.ok) {
            const dbBloomLevels = await response.json();
            setBloomLevels(dbBloomLevels.map((level: any) => ({ ...level, percentage: level.percentage ?? 0 })));
          }
        }
      } catch (e) {
        console.error('Error al cargar la configuración de preguntas:', e);
        toast.error('Error al cargar la configuración de preguntas');
        setBloomLevels([]);
      }
    }
    loadConfig();
  }, []);

  // Añadir un efecto para monitorear cambios en bloomLevels
  useEffect(() => {
    console.log('Estado actual de bloomLevels:', bloomLevels);
  }, [bloomLevels]);

  // Guardar configuración en el backend cada vez que cambie
  useEffect(() => {
    async function saveConfig() {
      try {
        const questionTypesObj = Object.fromEntries(questionTypes.map(qt => [qt.id, qt.percentage]));
        const difficultyLevelsObj = Object.fromEntries(difficultyLevels.map(dl => [dl.id, dl.weight]));
        const configToSave: Partial<any> = {
          questionTypes: questionTypesObj,
          difficultyLevels: difficultyLevelsObj,
          optionLength,
          bloomLevels: bloomLevels.map(level => ({
            id: level.id,
            name: level.name,
            description: level.description,
            keywords: level.keywords,
            percentage: level.percentage,
            enabled: level.enabled
          })),
        };
        await fetch('/api/question-config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(configToSave),
        });
      } catch (e) {
        console.error('Error al guardar la configuración de preguntas:', e);
        toast.error('Error al guardar la configuración de preguntas');
      }
    }
    if (initializedRef.current) {
      saveConfig();
    } else {
      initializedRef.current = true;
    }
  }, [questionTypes, difficultyLevels, optionLength, bloomLevels]);

  const validateTotalPercentage = (items: Array<QuestionTypeConfig | DifficultyLevelConfig>): boolean => {
    const total = items.reduce((sum, item) => sum + (('percentage' in item) ? item.percentage : item.weight), 0);
    return Math.abs(total - 100) < 0.01;
  };

  const handleQuestionTypeChange = (id: string, percentage: number) => {
    const newTypes = questionTypes.map(type =>
      type.id === id ? { ...type, percentage } : type
    );

    setQuestionTypes(newTypes);
    
    if (validateTotalPercentage(newTypes)) {
      setError('');
      if (validateTotalPercentage(difficultyLevels)) {
        onConfigChange(newTypes, difficultyLevels, bloomLevels.map(level => level.id), optionLength);
      }
    } else {
      setError('Los porcentajes de tipos de preguntas deben sumar 100%');
    }
  };

  const handleDifficultyChange = (id: string, weight: number) => {
    const newLevels = difficultyLevels.map(level =>
      level.id === id ? { ...level, weight } : level
    );

    setDifficultyLevels(newLevels);
    
    if (validateTotalPercentage(newLevels)) {
      setError('');
      if (validateTotalPercentage(questionTypes)) {
        onConfigChange(questionTypes, newLevels, bloomLevels.map(level => level.id), optionLength);
      }
    } else {
      setError('Los porcentajes de niveles de dificultad deben sumar 100%');
    }
  };

  const handleBloomLevelToggle = async (id: string, enabled: boolean) => {
    const previousLevels = bloomLevels.map(level => ({ ...level }));
    try {
      console.log(`Intentando ${enabled ? 'habilitar' : 'deshabilitar'} nivel ${id}`);
      
      // Actualizar el estado optimistamente
      setBloomLevels(prev => 
        prev.map(level => 
          level.id === id ? { ...level, enabled } : level
        )
      );

      const response = await fetch(`/api/bloom-levels/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Revertir al estado anterior en caso de error ANTES de lanzar el error
        setBloomLevels(previousLevels);
        throw new Error(errorData.error || 'Error al actualizar el nivel de Bloom');
      }

      const updatedLevel = await response.json() as BloomLevelPrisma;
      console.log('Nivel de Bloom actualizado:', updatedLevel);
      // Sincronizar el estado local con la respuesta del servidor
      // Es importante que esta actualización también ocurra después de una respuesta exitosa
      // para asegurar que el estado refleje lo que está en la BD, incluyendo updatedAt.
      const staticDataForUpdatedLevel = staticInfoMap.get(updatedLevel.name.toLowerCase());
      setBloomLevels(prev => 
        prev.map(levelInState => { 
          if (levelInState.id === id) {
            return { 
              ...updatedLevel, // Datos de la BD (enabled, name, id, etc., y percentage que podría ser null)
              updatedAt: new Date(updatedLevel.updatedAt),
              percentage: updatedLevel.percentage ?? staticDataForUpdatedLevel?.percentage ?? 0,
            } as CombinedBloomLevel; // Cast al tipo combinado
          }
          return levelInState;
        })
      );
      toast.success(`Nivel ${updatedLevel.name} ${enabled ? 'habilitado' : 'deshabilitado'}`);

    } catch (error: any) {
      console.error('Error al actualizar nivel de Bloom:', error);
      toast.error(error.message || 'Fallo al actualizar el estado del nivel.');
      // Si la reversión no se hizo antes del throw, asegúrate de que se haga aquí.
      // Sin embargo, es mejor revertir antes de que el error se propague si es posible.
      // En este caso, si el fetch falla pero no es un error HTTP (ej. red caída), la reversión no ocurriría arriba.
      // Para cubrir todos los casos, podemos dejar la reversión aquí también, 
      // aunque la actualización optimista ya se habría revertido si el error fue por respuesta no OK.
      // Para ser más precisos, la reversión en el catch es un fallback.
      const currentLevelState = bloomLevels.find(l => l.id === id);
      if (currentLevelState && currentLevelState.enabled !== previousLevels.find(l => l.id ===id)?.enabled) {
        setBloomLevels(previousLevels);
      }
    }
  };

  const handleBloomLevelChange = (levelId: string) => {
    const levelToToggle = bloomLevels.find(level => level.id === levelId);
    if (levelToToggle) {
      console.log(`Cambiando estado de ${levelToToggle.name} a ${!levelToToggle.enabled}`);
      handleBloomLevelToggle(levelToToggle.id, !levelToToggle.enabled);
    }
  };

  const selectAll = async () => {
    const previousLevels = bloomLevels.map(level => ({ ...level }));
    // Actualización optimista
    setBloomLevels(prev => prev.map(level => ({ ...level, enabled: true })));
    try {
      const updates = bloomLevels.map(level => {
        if (!level.enabled || !previousLevels.find(pl => pl.id === level.id)?.enabled) { // Solo si necesita cambiar
          return fetch(`/api/bloom-levels/${level.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled: true }),
          }).then(async response => {
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || `Error al habilitar ${level.name}`);
            }
            return response.json();
          });
        }
        return Promise.resolve(null); // No necesita actualización
      });

      await Promise.all(updates.filter(p => p !== null)); // Esperar todas las actualizaciones
      
      // Sincronizar estado final después de todas las respuestas exitosas
      const finalBloomLevelsFromDB = await (await fetch('/api/bloom-levels')).json() as BloomLevelPrisma[];
      setBloomLevels(
        finalBloomLevelsFromDB.map(dbLevel => {
          const staticData = staticInfoMap.get(dbLevel.name.toLowerCase());
          return {
            ...dbLevel, // Contiene enabled y percentage (que puede ser null) de la BD
            updatedAt: new Date(dbLevel.updatedAt),
            percentage: dbLevel.percentage ?? staticData?.percentage ?? 0,
          } as CombinedBloomLevel; // Cast al tipo combinado
        })
      );

      toast.success('Todos los niveles habilitados');
    } catch (error: any) {
      console.error('Error al habilitar todos los niveles:', error);
      toast.error(error.message || 'Fallo al habilitar todos los niveles.');
      setBloomLevels(previousLevels); // Revertir en caso de error
    }
  };

  const deselectAll = async () => {
    const previousLevels = bloomLevels.map(level => ({ ...level }));
    // Actualización optimista
    setBloomLevels(prev => prev.map(level => ({ ...level, enabled: false })));
    try {
      const updates = bloomLevels.map(level => {
        if (level.enabled || previousLevels.find(pl => pl.id === level.id)?.enabled) { // Solo si necesita cambiar
          return fetch(`/api/bloom-levels/${level.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled: false }),
          }).then(async response => {
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || `Error al deshabilitar ${level.name}`);
            }
            return response.json();
          });
        }
        return Promise.resolve(null); // No necesita actualización
      });

      await Promise.all(updates.filter(p => p !== null)); // Esperar todas las actualizaciones

      // Sincronizar estado final después de todas las respuestas exitosas
      const finalBloomLevelsFromDB = await (await fetch('/api/bloom-levels')).json() as BloomLevelPrisma[];
      setBloomLevels(
        finalBloomLevelsFromDB.map(dbLevel => {
          const staticData = staticInfoMap.get(dbLevel.name.toLowerCase());
          return {
            ...dbLevel, // Contiene enabled y percentage (que puede ser null) de la BD
            updatedAt: new Date(dbLevel.updatedAt),
            percentage: dbLevel.percentage ?? staticData?.percentage ?? 0,
          } as CombinedBloomLevel; // Cast al tipo combinado
        })
      );

      toast.success('Todos los niveles deshabilitados');
    } catch (error: any) {
      console.error('Error al deshabilitar todos los niveles:', error);
      toast.error(error.message || 'Fallo al deshabilitar todos los niveles.');
      setBloomLevels(previousLevels); // Revertir en caso de error
    }
  };

  const handleOptionLengthChange = (value: OptionLengthType) => {
    setOptionLength(value);
    if (validateTotalPercentage(questionTypes) && validateTotalPercentage(difficultyLevels)) {
      onConfigChange(questionTypes, difficultyLevels, bloomLevels.map(level => level.id), value);
    }
  };

  const renderPercentageBar = (percentage: number, color: string = 'primary') => (
    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
      <div
        className={cn(
          "h-2 rounded-full transition-all duration-500 ease-out",
          color === 'primary' && "bg-primary",
          color === 'secondary' && "bg-secondary",
          color === 'success' && "bg-success",
          color === 'warning' && "bg-warning"
        )}
        style={{ width: `${Math.min(percentage, 100)}%` }}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header con estadísticas generales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-xs">
            <Settings className="w-5 h-5 text-primary" />
            <span>Configuración de Preguntas</span>
          </CardTitle>
          <CardDescription className="text-[11px] text-muted-foreground">
            Personaliza los tipos, dificultad y características de las preguntas generadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 md:gap-y-6 md:gap-x-2 w-full mt-4">
            <div className="min-w-0 w-full max-w-md bg-primary/10 border border-primary/20 rounded-xl shadow-md flex flex-col items-center justify-center p-3 hover:shadow-lg hover:-translate-y-1 transition text-center mx-auto">
              <div className="w-6 h-6 flex items-center justify-center rounded-full bg-primary/30 mb-1">
                <Target className="w-4 h-4 text-primary" />
              </div>
              <div className="text-xs text-primary">Tipos de Pregunta</div>
              <div className="text-base font-bold text-success">{questionTypesTotal.toFixed(1)}%</div>
            </div>
            <div className="min-w-0 w-full max-w-md bg-primary/10 border border-primary/60 rounded-xl shadow-md flex flex-col items-center justify-center p-3 hover:shadow-lg hover:-translate-y-1 transition text-center mx-auto">
              <div className="w-6 h-6 flex items-center justify-center rounded-full bg-primary/20 mb-1">
                <BarChart className="w-4 h-4 text-primary" />
              </div>
              <div className="text-xs text-primary">Dificultad</div>
              <div className="text-base font-bold text-primary">{difficultyTotal.toFixed(1)}%</div>
            </div>
            <div className="min-w-0 w-full max-w-md bg-violet-500/10 border border-violet-500/60 rounded-xl shadow-md flex flex-col items-center justify-center p-3 hover:shadow-lg hover:-translate-y-1 transition text-center mx-auto">
              <div className="w-6 h-6 flex items-center justify-center rounded-full bg-violet-500/30 mb-1">
                <Brain className="w-4 h-4 text-violet-500" />
              </div>
              <div className="text-xs text-violet-500">Niveles Cognitivos</div>
              <div className="text-base font-bold text-violet-500">{enabledBloomLevels.length}/{bloomLevels.length}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mensaje de error global */}
      {error && (
        <Alert variant="error">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error de configuración</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tipos de Preguntas */}
      <Card>
        <CardHeader>
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setExpandedSection(expandedSection === 'types' ? null : 'types')}
          >
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-primary" />
              <CardTitle className="text-xs">Tipos de Preguntas</CardTitle>
              <Badge variant={Math.abs(questionTypesTotal - 100) < 0.01 ? "success" : "warning"}>
                {questionTypesTotal.toFixed(1)}%
              </Badge>
            </div>
            <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform duration-200", expandedSection === 'types' && "rotate-180")}/>
          </div>
          <CardDescription className="text-[11px] text-muted-foreground">
            Define qué tipos de preguntas se generarán y en qué proporción
          </CardDescription>
        </CardHeader>
        {expandedSection === 'types' && (
          <CardContent className="space-y-2 p-2">
            {questionTypes.map((type) => (
              <div key={type.id} className="space-y-2 p-2 border border-border rounded-lg hover:border-primary/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground">{type.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={type.percentage}
                      onChange={(e) => handleQuestionTypeChange(type.id, Number(e.target.value))}
                      className="w-16 text-sm text-right font-medium"
                    />
                    <span className="text-xs text-muted-foreground">%</span>
                  </div>
                </div>
                {renderPercentageBar(type.percentage)}
              </div>
            ))}
          </CardContent>
        )}
      </Card>

      {/* Longitud de Opciones */}
      <Card>
        <CardHeader>
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setExpandedSection(expandedSection === 'length' ? null : 'length')}
          >
            <div className="flex items-center space-x-2">
              <Type className="w-5 h-5 text-primary" />
              <CardTitle className="text-xs">Longitud de Opciones</CardTitle>
              <Badge variant="outline">
                {optionLengthOptions.find(opt => opt.value === optionLength)?.label}
              </Badge>
            </div>
            <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform duration-200", expandedSection === 'length' && "rotate-180")}/>
          </div>
          <CardDescription className="text-[11px] text-muted-foreground">
            Controla la extensión de las opciones de respuesta generadas
          </CardDescription>
        </CardHeader>
        {expandedSection === 'length' && (
          <CardContent className="space-y-2 p-2">
            <div className="flex flex-col gap-2 w-full">
              {optionLengthOptions.map((opt) => (
                <div
                  key={opt.value}
                  className={cn(
                    "p-2 border rounded-lg cursor-pointer transition-all card-compact",
                    optionLength === opt.value
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border hover:border-primary/50"
                  )}
                  onClick={() => handleOptionLengthChange(opt.value as OptionLengthType)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">{opt.label}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{opt.description}</p>
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        Ejemplo: {opt.example}
                      </p>
                    </div>
                    <div className={cn(
                      "w-4 h-4 rounded-full border-2 transition-all",
                      optionLength === opt.value
                        ? "border-primary bg-primary"
                        : "border-muted-foreground"
                    )}>
                      {optionLength === opt.value && (
                        <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Niveles de Dificultad */}
      <Card>
        <CardHeader>
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setExpandedSection(expandedSection === 'difficulty' ? null : 'difficulty')}
          >
            <div className="flex items-center space-x-2">
              <BarChart className="w-5 h-5 text-primary" />
              <CardTitle className="text-xs">Niveles de Dificultad</CardTitle>
              <Badge variant={Math.abs(difficultyTotal - 100) < 0.01 ? "success" : "warning"}>
                {difficultyTotal.toFixed(1)}%
              </Badge>
            </div>
            <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform duration-200", expandedSection === 'difficulty' && "rotate-180")}/>
          </div>
          <CardDescription className="text-[11px] text-muted-foreground">
            Ajusta la distribución de dificultad de las preguntas
          </CardDescription>
        </CardHeader>
        {expandedSection === 'difficulty' && (
          <CardContent className="space-y-2 p-2">
            {difficultyLevels.map((level) => (
              <div key={level.id} className="space-y-2 p-2 border border-border rounded-lg hover:border-primary/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground">{level.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{level.description}</p>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={level.weight}
                      onChange={(e) => handleDifficultyChange(level.id, Number(e.target.value))}
                      className="w-16 text-sm text-right font-medium"
                    />
                    <span className="text-xs text-muted-foreground">%</span>
                  </div>
                </div>
                {renderPercentageBar(level.weight, 'primary')}
              </div>
            ))}
          </CardContent>
        )}
      </Card>

      {/* Niveles Cognitivos */}
      <Card>
        <CardHeader>
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setExpandedSection(expandedSection === 'bloom' ? null : 'bloom')}
          >
            <div className="flex items-center space-x-2">
              <Brain className="w-5 h-5 text-violet-500" />
              <CardTitle className="text-xs">Niveles Cognitivos</CardTitle>
              <Badge variant="outline" className="text-violet-500 border-violet-500">
                {enabledBloomLevels.length}/{bloomLevels.length} activos
              </Badge>
            </div>
            <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform duration-200", expandedSection === 'bloom' && "rotate-180")}/>
          </div>
          <CardDescription className="text-[11px] text-muted-foreground">
            Selecciona qué capacidades cognitivas evaluar según la taxonomía de Bloom
          </CardDescription>
        </CardHeader>
        {expandedSection === 'bloom' && (
          <CardContent className="space-y-6">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Taxonomía de Bloom</AlertTitle>
              <AlertDescription className="text-[11px] text-muted-foreground">
                Los niveles cognitivos van desde recordar información básica hasta crear nuevas ideas. 
                Selecciona los niveles apropiados para tu tipo de evaluación.
              </AlertDescription>
            </Alert>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <h4 className="font-medium text-foreground">Control rápido</h4>
                <p className="text-xs text-muted-foreground">Habilitar o deshabilitar todos los niveles</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-end md:justify-start">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={selectAll}
                  disabled={allSelected}
                >
                  Seleccionar todos
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={deselectAll}
                  disabled={noneSelected}
                >
                  Deseleccionar todos
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {bloomLevels.map((level) => (
                <div 
                  key={level.id} 
                  className={cn(
                    "p-4 border rounded-lg transition-all cursor-pointer",
                    level.enabled 
                      ? "border-violet-500 bg-violet-500/5" 
                      : "border-border hover:border-violet-500/50"
                  )}
                  onClick={() => handleBloomLevelChange(level.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-medium text-foreground">{level.name}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {level.percentage}%
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {level.description}
                      </p>
                    </div>
                    <button
                      type="button"
                      className={cn(
                        "flex items-center justify-center w-8 h-4 rounded-full transition-all",
                        level.enabled 
                          ? "bg-violet-500" 
                          : "bg-muted border border-border"
                      )}
                    >
                      {level.enabled ? (
                        <ToggleRight className="w-3 h-3 text-white" />
                      ) : (
                        <ToggleLeft className="w-3 h-3 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between p-4 bg-violet-500/5 rounded-lg">
              <div>
                <h4 className="font-medium text-foreground">Total seleccionado</h4>
                <p className="text-xs text-muted-foreground">Porcentaje de niveles cognitivos activos</p>
              </div>
              <div className="text-right">
                <p className="text-base font-bold text-violet-500">{totalPercentage}%</p>
                <p className="text-xs text-muted-foreground">{enabledBloomLevels.length} de {bloomLevels.length} niveles</p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}; 