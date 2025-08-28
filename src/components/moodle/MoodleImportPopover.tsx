import React, { useState, useEffect, useRef } from 'react';
import CourseCategorySelector from './CourseCategorySelector';
import { toast } from 'react-hot-toast';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import CircularProgress from '@mui/material/CircularProgress';
import SchoolIcon from '@mui/icons-material/School';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import SettingsIcon from '@mui/icons-material/Settings';
import CloseIcon from '@mui/icons-material/Close';
import Popover from '@mui/material/Popover';

interface MoodleCategory {
  id: number;
  name: string;
  parent?: number;
  contextid: number;
  questioncount?: number;
}

interface MoodleImportPopoverProps {
  giftContent: string;
  onClose: () => void;
  onSuccess?: (msg: string) => void;
  onError?: (msg: string) => void;
  anchorEl?: HTMLElement | null;
  position?: { top: number; left: number };
}

const MoodleImportPopover: React.FC<MoodleImportPopoverProps> = ({
  giftContent,
  onClose,
  onSuccess,
  onError,
  anchorEl,
  position,
}) => {
  const [selectedContextId, setSelectedContextId] = useState<number | null>(18);
  const [availableCategories, setAvailableCategories] = useState<MoodleCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [importing, setImporting] = useState<boolean>(false);
  const [step, setStep] = useState<number>(1);

  // 🔧 Control del scroll del body al abrir/cerrar el modal (SIN scroll automático)
  useEffect(() => {
    // Deshabilitar scroll del body al abrir el modal
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    
    // ❌ ELIMINAMOS esta línea que causa el problema:
    // window.scrollTo({ top: 0, behavior: 'smooth' });
    
    return () => {
      // Restaurar scroll del body al cerrar
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Calcular progreso basado en los datos completados
  const calculateProgress = () => {
    let progress = 0;
    if (selectedContextId) progress += 33;
    if (selectedCategoryId) progress += 33;
    if (giftContent.trim()) progress += 34;
    return Math.min(progress, 100);
  };

  // Actualizar paso automáticamente
  useEffect(() => {
    if (selectedContextId && selectedCategoryId) {
      setStep(3);
    } else if (selectedContextId) {
      setStep(2);
    } else {
      setStep(1);
    }
  }, [selectedContextId, selectedCategoryId]);

  // Cargar categorías cuando cambia el contexto
  useEffect(() => {
    if (selectedContextId) {
      fetchCategories(selectedContextId);
    } else {
      setAvailableCategories([]);
      setSelectedCategoryId(null);
    }
    // eslint-disable-next-line
  }, [selectedContextId]);

  const fetchCategories = async (contextId: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/moodle/moodle_question_categories?contextId=${contextId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al obtener categorías');
      }
      const data: MoodleCategory[] = await response.json();
      setAvailableCategories(data);
      setSelectedCategoryId(null);
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar categorías');
      setAvailableCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCategory = async (name: string, contextId: number, parentId?: number) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/moodle/moodle_question_categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contextid: contextId,
          name: name,
          parentid: parentId || 0,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear categoría');
      }
      const newCategory: MoodleCategory = await response.json();
      setAvailableCategories(prev => [...prev, newCategory]);
      setSelectedCategoryId(newCategory.id);
      setNewCategoryName('');
      toast.success('Categoría creada exitosamente');
    } catch (error: any) {
      toast.error(error.message || 'Error al crear categoría');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!selectedContextId || !selectedCategoryId || !giftContent.trim()) {
      toast.error('Selecciona contexto, categoría y asegúrate de que hay contenido.');
      return;
    }
    setImporting(true);
    try {
      // Codificar GIFT a base64
      let fileContentBase64 = '';
      try {
        fileContentBase64 = btoa(unescape(encodeURIComponent(giftContent)));
      } catch (e) {
        throw new Error('Error al codificar el contenido para Moodle.');
      }
      const filename = `import_${Date.now()}.gift`;
      const response = await fetch('/api/moodle/import-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contextid: selectedContextId,
          categoryid: selectedCategoryId,
          filename: filename,
          filecontent: fileContentBase64,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error en la importación');
      }
      const result = await response.json();
      const successMsg = `Importación exitosa: ${result.questionsImported || 'N/A'} preguntas importadas`;
      toast.success(successMsg);
      if (onSuccess) onSuccess(successMsg);
    } catch (error: any) {
      const errorMsg = error.message || 'Error durante la importación';
      toast.error(errorMsg);
      if (onError) onError(errorMsg);
    } finally {
      setImporting(false);
    }
  };

  const canImport = selectedContextId && selectedCategoryId && giftContent.trim();

  // 🎯 Renderizado SIEMPRE centrado en el viewport actual
  return (
    <Popover
      open={true}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center',  // Cambiado a center para centrar horizontalmente
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'center',  // Cambiado a center para centrar horizontalmente
      }}
      PaperProps={{
        style: {
          width: 'clamp(24rem, 90vw, 60rem)',  // Aumentado para más ancho
          maxHeight: 'calc(80vh - 2rem)',  // Aumentado de 100vh a 80vh para más espacio sin scroll inmediato
          overflowY: 'auto',  // Habilitar scroll vertical
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: '1rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(99, 102, 241, 0.1)',
          backdropFilter: 'blur(16px)',
          padding: '0.5rem',  // Añadido padding interno para mejor espaciado
        },
        sx: {
          '&::-webkit-scrollbar': {
            width: '6px',  // Barra más delgada
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(31, 41, 55, 0.3)',
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.7), rgba(139, 92, 246, 0.7))',
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.9), rgba(139, 92, 246, 0.9))',
          },
        },
      }}
    >
      <ClickAwayListener onClickAway={onClose}>
        <div 
          id="moodle-import-modal"
          style={{ position: 'relative' }} 
          className="transform transition-all duration-300 scale-100 animate-in" 
          onClick={e => e.stopPropagation()}
        >
          {/* Botón de cerrar */}
          <div className="absolute top-3 right-3 z-10">
            <button
              onClick={onClose}
              className="p-1 rounded-full bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 hover:text-white transition-all duration-200"
            >
              <CloseIcon fontSize="small" />
            </button>
          </div>

          {/* Botón de importar adicional en la parte superior */}
          <div className="p-3">
            <button
              onClick={handleImport}
              disabled={!canImport || importing || isLoading}
              className={`w-full py-2 rounded-lg font-bold text-white transition-all duration-300 transform hover:scale-105 hover:shadow-xl disabled:hover:scale-100 disabled:hover:shadow-none flex items-center justify-center space-x-2 text-sm ${
                canImport && !importing && !isLoading
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg shadow-green-500/25 hover:from-green-400 hover:to-emerald-500'
                  : 'bg-gray-700/50 cursor-not-allowed opacity-50'
              }`}
            >
              {importing ? (
                <>
                  <CircularProgress size={16} color="inherit" />
                  <span>Importando...</span>
                </>
              ) : canImport ? (
                <>
                  <CloudUploadIcon fontSize="small" />
                  <span>Importar a Moodle</span>
                  <CheckCircleIcon fontSize="small" />
                </>
              ) : (
                <>
                  <ErrorIcon fontSize="small" />
                  <span>Completa los campos</span>
                </>
              )}
            </button>
          </div>

          {/* Gradiente de fondo animado */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              background: 'linear-gradient(45deg, #6366f1, #8b5cf6, #06b6d4, #10b981)',
              backgroundSize: '400% 400%',
              animation: 'gradientShift 8s ease infinite',
              pointerEvents: 'none'  // Añadido para permitir clics a través del gradiente
            }}
          />
          
          {/* Header compacto */}
          <div className="relative bg-gradient-to-r from-indigo-600/20 to-purple-600/20 backdrop-blur-sm border-b border-white/10">
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center space-x-2">
                <div className={`p-1.5 rounded-lg transition-all duration-300 ${selectedContextId ? 'bg-green-500 shadow-lg shadow-green-500/25' : 'bg-indigo-500'}`}>
                  <SettingsIcon className="text-white" fontSize="small" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white">Contexto (ID)</label>
                  <p className="text-xs text-gray-400">ID del curso</p>
                </div>
              </div>
              <input
                type="number"
                value={selectedContextId || ''}
                onChange={e => {
                  const val = parseInt(e.target.value, 10);
                  setSelectedContextId(isNaN(val) ? null : val);
                }}
                placeholder="18"
                className="w-20 px-2 py-1 bg-gray-800/50 border border-gray-600/50 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                disabled={isLoading || importing}
              />
            </div>
            
            {/* Separador animado */}
            {selectedContextId && (
              <div className="flex items-center justify-center">
                <div className="h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent w-full animate-pulse"></div>
              </div>
            )}
            
            {/* CourseCategorySelector compacto */}
            {selectedContextId && (
              <div className="transform transition-all duration-500 ease-out animate-in custom-scrollbar p-3">
                <CourseCategorySelector
                  selectedContextId={selectedContextId}
                  availableCategories={availableCategories}
                  selectedCategoryId={selectedCategoryId}
                  onCategoryChange={setSelectedCategoryId}
                  newCategoryName={newCategoryName}
                  onNewCategoryNameChange={setNewCategoryName}
                  onCreateCategory={handleCreateCategory}
                  isLoading={isLoading}
                  onReloadCategories={() => selectedContextId && fetchCategories(selectedContextId)}
                />
              </div>
            )}
            
            {/* Separador para botón */}
            {canImport && (
              <div className="flex items-center justify-center">
                <div className="h-px bg-gradient-to-r from-transparent via-green-500 to-transparent w-full animate-pulse"></div>
              </div>
            )}
            
            {/* Botón de importar compacto (original en la parte inferior) */}
            <div className="p-3">
              <button
                onClick={handleImport}
                disabled={!canImport || importing || isLoading}
                className={`w-full py-2 rounded-lg font-bold text-white transition-all duration-300 transform hover:scale-105 hover:shadow-xl disabled:hover:scale-100 disabled:hover:shadow-none flex items-center justify-center space-x-2 text-sm ${
                  canImport && !importing && !isLoading
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg shadow-green-500/25 hover:from-green-400 hover:to-emerald-500'
                    : 'bg-gray-700/50 cursor-not-allowed opacity-50'
                }`}
              >
                {importing ? (
                  <>
                    <CircularProgress size={16} color="inherit" />
                    <span>Importando...</span>
                  </>
                ) : canImport ? (
                  <>
                    <CloudUploadIcon fontSize="small" />
                    <span>Importar a Moodle</span>
                    <CheckCircleIcon fontSize="small" />
                  </>
                ) : (
                  <>
                    <ErrorIcon fontSize="small" />
                    <span>Completa los campos</span>
                  </>
                )}
              </button>
            </div>
            
            {/* Información compacta */}
            <div className="text-center pb-2">
              <p className="text-xs text-gray-400">
                {giftContent ? `${giftContent.split('\n').length} líneas GIFT` : 'Contenido GIFT detectado'}
              </p>
            </div>
          </div>
          
          {/* Indicadores de estado compactos */}
          <div className="border-t border-white/10 p-2 bg-black/20">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-3">
                <div className={`flex items-center space-x-1 ${selectedContextId ? 'text-green-400' : 'text-gray-500'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${selectedContextId ? 'bg-green-400' : 'bg-gray-500'}`}></div>
                  <span>Contexto</span>
                </div>
                <div className={`flex items-center space-x-1 ${selectedCategoryId ? 'text-green-400' : 'text-gray-500'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${selectedCategoryId ? 'bg-green-400' : 'bg-gray-500'}`}></div>
                  <span>Categoría</span>
                </div>
                <div className={`flex items-center space-x-1 ${giftContent.trim() ? 'text-green-400' : 'text-gray-500'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${giftContent.trim() ? 'bg-green-400' : 'bg-gray-500'}`}></div>
                  <span>Contenido</span>
                </div>
              </div>
              {isLoading && (
                <div className="flex items-center space-x-1 text-indigo-400">
                  <CircularProgress size={10} color="inherit" />
                  <span>Cargando...</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Estilos de animación */}
          <style jsx>{`
            @keyframes gradientShift {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
            @keyframes animate-in {
              from {
                opacity: 0;
                transform: scale(0.95) translateY(-10px);
              }
              to {
                opacity: 1;
                transform: scale(1) translateY(0);
              }
            }
            .animate-in {
              animation: animate-in 0.3s ease-out;
            }
            .custom-scrollbar {
              scrollbar-width: thin;
              scrollbar-color: rgba(99, 102, 241, 0.5) rgba(31, 41, 55, 0.3);
            }
            .custom-scrollbar::-webkit-scrollbar {
              width: 6px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: rgba(31, 41, 55, 0.3);
              border-radius: 3px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: linear-gradient(135deg, rgba(99, 102, 241, 0.7), rgba(139, 92, 246, 0.7));
              border-radius: 3px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: linear-gradient(135deg, rgba(99, 102, 241, 0.9), rgba(139, 92, 246, 0.9));
            }
          `}</style>
        </div>
      </ClickAwayListener>
    </Popover>
  );
};

export default MoodleImportPopover;