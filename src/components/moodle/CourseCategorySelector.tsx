import React from 'react';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HomeIcon from '@mui/icons-material/Home';
import FolderIcon from '@mui/icons-material/Folder';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface MoodleCategory {
    id: number;
    name: string;
    parent?: number;
    contextid: number;
    questioncount?: number;
}

interface CourseCategorySelectorProps {
    selectedContextId: number | null;
    availableCategories: MoodleCategory[];
    selectedCategoryId: number | null;
    onCategoryChange: (categoryId: number | null) => void;
    newCategoryName: string;
    onNewCategoryNameChange: (name: string) => void;
    onCreateCategory: (name: string, contextId: number, parentId?: number) => void;
    isLoading: boolean;
    onReloadCategories: () => void;
}

// Funciones de persistencia (MOVER AQUÍ - ANTES DEL COMPONENTE)
const saveLastSelectedCategory = (contextId: number, categoryId: number, path: MoodleCategory[]) => {
    if (typeof window !== 'undefined') {
        const key = `moodle_last_category_${contextId}`;
        const data = {
            categoryId,
            navigationPath: path,
            timestamp: Date.now()
        };
        localStorage.setItem(key, JSON.stringify(data));
    }
};

const getLastSelectedCategory = (contextId: number) => {
    if (typeof window !== 'undefined') {
        const key = `moodle_last_category_${contextId}`;
        const stored = localStorage.getItem(key);
        if (stored) {
            try {
                const data = JSON.parse(stored);
                // Verificar que no sea muy antiguo (ej: 24 horas)
                if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
                    return data;
                }
            } catch (error) {
                console.warn('Error parsing stored category data:', error);
            }
        }
    }
    return null;
};

const CourseCategorySelector: React.FC<CourseCategorySelectorProps> = ({
    selectedContextId,
    availableCategories,
    selectedCategoryId,
    onCategoryChange,
    newCategoryName,
    onNewCategoryNameChange,
    onCreateCategory,
    isLoading,
    onReloadCategories,
}) => {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [navigationPath, setNavigationPath] = React.useState<MoodleCategory[]>([]);
    const [currentLevelParentId, setCurrentLevelParentId] = React.useState<number | null>(null);

    // Obtener categorías del nivel actual
    const getCurrentLevelCategories = () => {
        const result = availableCategories.filter(cat => {
            const parentId = cat.parent || 0;
            const currentParent = currentLevelParentId || 0;
            
            // Normalizar tipos para comparación (convertir ambos a number)
            const normalizedParentId = typeof parentId === 'string' ? parseInt(parentId, 10) : parentId;
            const normalizedCurrentParent = typeof currentParent === 'string' ? parseInt(currentParent, 10) : currentParent;
            
            return normalizedParentId === normalizedCurrentParent;
        });
        
        // Debug logging (solo en desarrollo)
        if (process.env.NODE_ENV === 'development') {
            console.log('getCurrentLevelCategories Debug:', {
                currentLevelParentId,
                availableCategories: availableCategories.length,
                filteredCategories: result.length,
                sampleCategories: availableCategories.slice(0, 3).map(cat => ({
                    id: cat.id,
                    name: cat.name,
                    parent: cat.parent,
                    parentType: typeof cat.parent
                }))
            });
        }
        
        return result;
    };

    // Obtener subcategorías de una categoría específica
    const getSubcategories = (parentId: number) => {
        const result = availableCategories.filter(cat => {
            // Normalizar tipos para comparación
            const catParent = cat.parent || 0;
            const normalizedCatParent = typeof catParent === 'string' ? parseInt(catParent, 10) : catParent;
            const normalizedParentId = typeof parentId === 'string' ? parseInt(parentId, 10) : parentId;
            
            return normalizedCatParent === normalizedParentId;
        });
        
        // Debug logging (solo en desarrollo)
        if (process.env.NODE_ENV === 'development') {
            console.log('getSubcategories Debug:', {
                parentId,
                parentIdType: typeof parentId,
                subcategoriesFound: result.length,
                subcategoriesSample: result.slice(0, 2).map(cat => ({
                    id: cat.id,
                    name: cat.name,
                    parent: cat.parent
                }))
            });
        }
        
        return result;
    };

    // Función para limpiar el historial de navegación
    const clearNavigationHistory = () => {
        if (selectedContextId && typeof window !== 'undefined') {
            const key = `moodle_last_category_${selectedContextId}`;
            localStorage.removeItem(key);
            setNavigationPath([]);
            setCurrentLevelParentId(null);
            onCategoryChange(null);
        }
    };

    // Resetear navegación cuando cambian las categorías o el contexto
    React.useEffect(() => {
        // Remover la definición de clearNavigationHistory de aquí
        // ya que ahora está definida arriba
    }, [selectedContextId, availableCategories]);

    // AGREGAR ESTE NUEVO useEffect PARA CARGAR LA ÚLTIMA CATEGORÍA
    React.useEffect(() => {
        if (selectedContextId && availableCategories.length > 0) {
            const lastCategory = getLastSelectedCategory(selectedContextId);
            if (lastCategory && lastCategory.navigationPath) {
                // Verificar que las categorías del path aún existen
                const validPath = lastCategory.navigationPath.filter(pathCategory => 
                    availableCategories.some(cat => cat.id === pathCategory.id)
                );
                
                if (validPath.length > 0) {
                    setNavigationPath(validPath);
                    const lastPathCategory = validPath[validPath.length - 1];
                    setCurrentLevelParentId(lastPathCategory.id);
                    
                    // Opcional: seleccionar automáticamente la última categoría
                    if (lastCategory.categoryId) {
                        onCategoryChange(lastCategory.categoryId);
                    }
                }
            }
        }
    }, [selectedContextId, availableCategories]);

    // Navegar hacia adelante a una subcategoría
    const navigateToCategory = (category: MoodleCategory) => {
        const newPath = [...navigationPath, category];
        setNavigationPath(newPath);
        
        // Asegurar que el ID se trate como number
        const categoryId = typeof category.id === 'string' ? parseInt(category.id, 10) : category.id;
        setCurrentLevelParentId(categoryId);
        
        // Debug logging
        if (process.env.NODE_ENV === 'development') {
            console.log('navigateToCategory Debug:', {
                categoryName: category.name,
                categoryId: category.id,
                categoryIdType: typeof category.id,
                normalizedCategoryId: categoryId,
                newPath: newPath.map(cat => ({ id: cat.id, name: cat.name }))
            });
        }
        
        // Verificar subcategorías después de navegar
        const subcategories = getSubcategories(categoryId);
        
        if (process.env.NODE_ENV === 'development') {
            console.log('Subcategorías encontradas después de navegar:', {
                count: subcategories.length,
                subcategories: subcategories.map(sub => ({ id: sub.id, name: sub.name, parent: sub.parent }))
            });
        }
        
        // Si no tiene subcategorías, seleccionarla automáticamente
        if (subcategories.length === 0) {
            onCategoryChange(categoryId);
        }
    };

    // Navegar hacia atrás en la jerarquía
    const navigateBack = (targetIndex?: number) => {
        if (typeof targetIndex === 'number') {
            // Navegar a un nivel específico en los breadcrumbs
            const newPath = navigationPath.slice(0, targetIndex + 1);
            setNavigationPath(newPath);
            setCurrentLevelParentId(newPath.length > 0 ? newPath[newPath.length - 1].id : null);
        } else {
            // Navegar un nivel atrás
            const newPath = navigationPath.slice(0, -1);
            setNavigationPath(newPath);
            setCurrentLevelParentId(newPath.length > 0 ? newPath[newPath.length - 1].id : null);
        }
        onCategoryChange(null);
    };

    // Función para manejar la selección de categoría y guardar en localStorage
    const handleCategorySelection = (categoryId: number) => {
        if (selectedContextId) {
            saveLastSelectedCategory(selectedContextId, categoryId, navigationPath);
            onCategoryChange(categoryId);
        }
    };

    // Seleccionar la categoría actual
    // Modificar selectCurrentCategory
    const selectCurrentCategory = () => {
        if (navigationPath.length > 0) {
            const currentCategory = navigationPath[navigationPath.length - 1];
            handleCategorySelection(currentCategory.id);
        }
    };

    // Ir al inicio (categorías principales)
    const goToRoot = () => {
        setNavigationPath([]);
        setCurrentLevelParentId(null);
        onCategoryChange(null);
    };

    if (!selectedContextId) {
        return null;
    }

    const currentLevelCategories = getCurrentLevelCategories().filter(cat => 
        cat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="bg-card p-4 sm:p-6 rounded-lg shadow-md space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-foreground">3. Navegación de Categorías</h3>
                {availableCategories.length > 0 && (
                    <button
                        onClick={onReloadCategories}
                        disabled={isLoading}
                        className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md transition-colors"
                    >
                        🔄 Recargar
                    </button>
                )}
            </div>

            {/* Breadcrumbs de Navegación */}
            {(navigationPath.length > 0 || currentLevelCategories.length > 0) && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center space-x-2 mb-3">
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Ubicación actual:</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 flex-wrap">
                        {/* Botón Home */}
                        <button
                            onClick={goToRoot}
                            className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm transition-colors ${
                                navigationPath.length === 0 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-white dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300'
                            }`}
                        >
                            <HomeIcon fontSize="small" />
                            <span>Inicio</span>
                        </button>

                        {/* Breadcrumbs */}
                        {navigationPath.map((category, index) => (
                            <React.Fragment key={category.id}>
                                <ArrowForwardIcon className="text-blue-400" fontSize="small" />
                                <button
                                    onClick={() => navigateBack(index)}
                                    className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm transition-colors ${
                                        index === navigationPath.length - 1
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300'
                                    }`}
                                >
                                    <FolderIcon fontSize="small" />
                                    <span className="max-w-32 truncate">{category.name}</span>
                                </button>
                            </React.Fragment>
                        ))}
                    </div>

                    {/* Botón para seleccionar categoría actual */}
                    {navigationPath.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                            <button
                                onClick={selectCurrentCategory}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105 ${
                                    selectedCategoryId === navigationPath[navigationPath.length - 1].id
                                        ? 'bg-green-600 text-white shadow-lg shadow-green-500/25'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25'
                                }`}
                            >
                                <CheckCircleIcon fontSize="small" />
                                <span>
                                    {selectedCategoryId === navigationPath[navigationPath.length - 1].id 
                                        ? 'Categoría Seleccionada' 
                                        : `Seleccionar "${navigationPath[navigationPath.length - 1].name}"`
                                    }
                                </span>
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Filtro de Búsqueda */}
            {currentLevelCategories.length > 0 && (
                <div>
                    <label htmlFor="categorySearchInput" className="block text-sm font-medium text-muted-foreground mb-2">
                        Filtrar categorías en este nivel:
                    </label>
                    <input
                        type="text"
                        id="categorySearchInput"
                        placeholder="Escribe para filtrar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-foreground disabled:opacity-50"
                        disabled={isLoading}
                    />
                </div>
            )}

            {/* Lista de Categorías del Nivel Actual */}
            {currentLevelCategories.length > 0 ? (
                <div className="space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">
                        {navigationPath.length === 0 
                            ? 'Categorías principales:' 
                            : `Subcategorías de "${navigationPath[navigationPath.length - 1].name}":`
                        }
                    </h4>
                    
                    <div className="grid gap-2">
                        {currentLevelCategories.map(category => {
                            // Normalizar ID para el conteo de subcategorías
                            const categoryId = typeof category.id === 'string' ? parseInt(category.id, 10) : category.id;
                            const subcategoriesCount = getSubcategories(categoryId).length;
                            const isSelected = selectedCategoryId === categoryId;
                            
                            return (
                                <div 
                                    key={category.id}
                                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                                        isSelected 
                                            ? 'border-green-500 bg-green-50 dark:bg-green-950/20' 
                                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20'
                                    }`}
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                            <FolderIcon 
                                                className={isSelected ? 'text-green-600' : 'text-blue-600'} 
                                                fontSize="small" 
                                            />
                                            <span className={`font-medium ${isSelected ? 'text-green-700 dark:text-green-300' : 'text-foreground'}`}>
                                                {category.name}
                                            </span>
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                            ID: {category.id} • Preguntas: {category.questioncount ?? 'N/A'}
                                            {subcategoriesCount > 0 && ` • ${subcategoriesCount} subcategoría(s)`}
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-2">
                                        {/* Botón seleccionar */}
                                        <button
                                            onClick={() => handleCategorySelection(categoryId)}
                                            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                                                isSelected
                                                    ? 'bg-green-600 text-white'
                                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                            }`}
                                        >
                                            {isSelected ? 'Seleccionada' : 'Seleccionar'}
                                        </button>
                                        
                                        {/* Botón navegar si tiene subcategorías */}
                                        {subcategoriesCount > 0 && (
                                            <button
                                                onClick={() => navigateToCategory(category)}
                                                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-medium transition-colors flex items-center space-x-1"
                                            >
                                                <span>Explorar</span>
                                                <ArrowForwardIcon fontSize="small" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="text-center py-8">
                    <FolderIcon className="mx-auto text-gray-400 mb-2" fontSize="large" />
                    <p className="text-sm text-muted-foreground">
                        {isLoading 
                            ? 'Cargando categorías...' 
                            : navigationPath.length > 0 
                                ? 'No hay subcategorías en este nivel'
                                : 'No hay categorías disponibles para este contexto'
                        }
                    </p>
                    {navigationPath.length > 0 && (
                        <div className="text-xs text-blue-600 mb-2">
                            📍 Ubicación restaurada de la última sesión
                            <button 
                                onClick={clearNavigationHistory}
                                className="ml-2 text-red-600 hover:text-red-700"
                            >
                                Limpiar historial
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Crear Nueva Categoría */}
            <div className="space-y-2 pt-4 border-t border-border">
                <label htmlFor="newCategoryNameInput" className="block text-sm font-medium text-muted-foreground">
                    Crear nueva categoría{navigationPath.length > 0 ? ` en "${navigationPath[navigationPath.length - 1].name}"` : ' principal'}:
                </label>
                <div className="flex space-x-2 items-center">
                    <input
                        type="text"
                        id="newCategoryNameInput"
                        value={newCategoryName}
                        onChange={(e) => onNewCategoryNameChange(e.target.value)}
                        placeholder="Nombre para nueva categoría"
                        className="block w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-foreground disabled:opacity-50"
                        disabled={isLoading}
                    />
                    <button 
                        onClick={() => {
                            if (selectedContextId && newCategoryName.trim()) {
                                const parentId = navigationPath.length > 0 ? navigationPath[navigationPath.length - 1].id : undefined;
                                onCreateCategory(newCategoryName, selectedContextId, parentId);
                            }
                        }} 
                        disabled={isLoading || !newCategoryName.trim() || !selectedContextId}
                        className="px-4 py-2 bg-primary text-primary-foreground border border-transparent rounded-md shadow-sm text-sm font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Crear
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CourseCategorySelector;