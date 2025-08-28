import React, { useState, useEffect } from 'react';
import GiftContentInput from './GiftContentInput';
import CourseCategorySelector from './CourseCategorySelector';
import ImportProcessView from './ImportProcessView';

const MOODLE_ORCHESTRATOR_LOG_PREFIX = '[MoodleImportOrchestrator]';

export interface MoodleCategory { // Exportar para que otros componentes puedan usarla si es necesario
    id: number;
    name: string;
    parent?: number;
    contextid: number;
    questioncount?: number;
}

const MoodleImportOrchestrator: React.FC = () => {
    const [giftContent, setGiftContent] = useState<string>('');
    const [selectedContextId, setSelectedContextId] = useState<number | null>(null); 
    const [availableCategories, setAvailableCategories] = useState<MoodleCategory[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [newCategoryName, setNewCategoryName] = useState<string>('');
    
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [importStatus, setImportStatus] = useState<'idle' | 'importing' | 'success' | 'error'>('idle');
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

    useEffect(() => {
        if (selectedContextId) {
            console.log(`${MOODLE_ORCHESTRATOR_LOG_PREFIX} Context ID seleccionado: ${selectedContextId}. Cargando categorías.`);
            fetchCategories(selectedContextId.toString());
        } else {
            setAvailableCategories([]); // Limpiar categorías si no hay contexto
            setSelectedCategoryId(null); // Limpiar categoría seleccionada
        }
    }, [selectedContextId]);

    const fetchCategories = async (contextId: string) => {
        if (!contextId) return;
        setIsLoading(true);
        setFeedbackMessage('Cargando categorías...');
        try {
            const response = await fetch(`/api/moodle/moodle_question_categories?contextId=${contextId}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al obtener categorías');
            }
            const data: MoodleCategory[] = await response.json();
            setAvailableCategories(data);
            setFeedbackMessage(data.length > 0 ? 'Categorías cargadas.' : 'No se encontraron categorías para este contexto.');
            setSelectedCategoryId(null); // Resetear categoría seleccionada al cargar nuevas
        } catch (error) {
            console.error(`${MOODLE_ORCHESTRATOR_LOG_PREFIX} Error fetching categories:`, error);
            setFeedbackMessage(`Error al cargar categorías: ${error instanceof Error ? error.message : 'Error desconocido'}`);
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
                    parentid: parentId || 0 // Podríamos añadir UI para seleccionar padre si es necesario
                }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al crear la categoría');
            }
            const createdCategory: MoodleCategory = await response.json();
            setFeedbackMessage(`Categoría "${createdCategory.name}" creada con éxito (ID: ${createdCategory.id}).`);
            setNewCategoryName('');
            if (contextId) fetchCategories(contextId.toString()); // Recargar categorías
        } catch (error) {
            console.error(`${MOODLE_ORCHESTRATOR_LOG_PREFIX} Error creating category:`, error);
            setFeedbackMessage(`Error al crear categoría: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleImportQuestions = async () => {
        if (!selectedContextId || !selectedCategoryId || !giftContent.trim()) {
            setFeedbackMessage('Se necesita contexto, categoría y contenido GIFT para importar.');
            return;
        }
        setIsLoading(true);
        setImportStatus('importing');
        setFeedbackMessage('Importando preguntas...');
        const filename = `import_${Date.now()}.gift`;

        // Codificar el contenido GIFT a Base64 asegurando compatibilidad UTF-8
        let fileContentBase64 = '';
        try {
            // Método seguro para UTF-8 a Base64
            fileContentBase64 = btoa(unescape(encodeURIComponent(giftContent)));
        } catch (e) {
            console.error("Error al codificar giftContent a Base64:", e);
            setFeedbackMessage('Error interno al preparar el contenido del archivo para la importación.');
            setImportStatus('error');
            setIsLoading(false);
            return;
        }

        console.log(`${MOODLE_ORCHESTRATOR_LOG_PREFIX} Contenido GIFT original para ${filename}:`, giftContent.substring(0,100) + "...");
        console.log(`${MOODLE_ORCHESTRATOR_LOG_PREFIX} Contenido Base64 para ${filename}:`, fileContentBase64.substring(0,100) + "...");

        try {
            const response = await fetch('/api/moodle/import-questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contextid: selectedContextId,
                    categoryid: selectedCategoryId,
                    filename: filename,
                    filecontent: fileContentBase64 // Usar el contenido codificado
                }),
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Error desconocido durante la importación');
            }
            setImportStatus('success');
            setFeedbackMessage(result.message || 'Preguntas importadas con éxito.');
            // setGiftContent(''); // Opcional: limpiar después del éxito
            
            // Recargar las categorías para actualizar el conteo de preguntas
            if (selectedContextId) {
                console.log(`${MOODLE_ORCHESTRATOR_LOG_PREFIX} Recargando categorías después de importación exitosa`);
                // Intentar hasta 3 veces con retrasos incrementales
                const reloadWithRetry = async (attempts = 1, delay = 500) => {
                    try {
                        await fetchCategories(selectedContextId.toString());
                        console.log(`${MOODLE_ORCHESTRATOR_LOG_PREFIX} Categorías recargadas exitosamente después de importación (intento ${attempts})`);
                    } catch (err) {
                        if (attempts < 3) {
                            console.log(`${MOODLE_ORCHESTRATOR_LOG_PREFIX} Reintentando recarga de categorías en ${delay}ms (intento ${attempts + 1})`);
                            setTimeout(() => reloadWithRetry(attempts + 1, delay * 2), delay);
                        } else {
                            console.error(`${MOODLE_ORCHESTRATOR_LOG_PREFIX} Falló recarga de categorías después de ${attempts} intentos`);
                        }
                    }
                };
                
                setTimeout(() => reloadWithRetry(), 1000); // Iniciar después de 1 segundo para dar tiempo a que la BD se actualice
            }
        } catch (error) {
            console.error(`${MOODLE_ORCHESTRATOR_LOG_PREFIX} Error importing questions:`, error);
            setImportStatus('error');
            setFeedbackMessage(`Error al importar preguntas: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Función para forzar la recarga de categorías
    const handleForceReloadCategories = () => {
        if (selectedContextId) {
            console.log(`${MOODLE_ORCHESTRATOR_LOG_PREFIX} Forzando recarga de categorías por solicitud del usuario`);
            setFeedbackMessage('Recargando categorías...');
            fetchCategories(selectedContextId.toString());
        } else {
            setFeedbackMessage('Selecciona un contexto para cargar categorías');
        }
    };

    const canImport = !!selectedContextId && !!selectedCategoryId && giftContent.trim().length > 0;

    return (
        <div className="p-4 md:p-6 space-y-8">
            <h2 className="text-2xl font-semibold text-foreground">Importar Preguntas a Moodle</h2>

            {/* Sección para seleccionar Contexto/Curso */}
            <div className="bg-card p-4 sm:p-6 rounded-lg shadow-md space-y-4">
                <h3 className="text-lg font-medium text-foreground">1. Seleccionar Contexto de Moodle</h3>
                <div className="space-y-2">
                    <label htmlFor="contextIdInput" className="block text-sm font-medium text-muted-foreground">Context ID (Curso):</label>
                    <input 
                        type="number" 
                        id="contextIdInput"
                        value={selectedContextId || ''} 
                        onChange={(e) => {
                            const newContextId = parseInt(e.target.value, 10);
                            setSelectedContextId(isNaN(newContextId) ? null : newContextId);
                        }} 
                        placeholder="Ej: 18"
                        className="block w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-foreground disabled:opacity-50"
                        disabled={isLoading}
                    />
                </div>
                {/* Botón para forzar recarga de categorías */}
                {selectedContextId && (
                    <button
                        onClick={handleForceReloadCategories}
                        disabled={isLoading}
                        className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                    >
                        {isLoading ? 'Cargando...' : 'Forzar recarga de categorías'}
                    </button>
                )}
            </div>

            <GiftContentInput 
                giftContent={giftContent} 
                onGiftContentChange={setGiftContent} 
                disabled={isLoading}
            />

            <CourseCategorySelector 
                selectedContextId={selectedContextId}
                availableCategories={availableCategories}
                selectedCategoryId={selectedCategoryId}
                onCategoryChange={setSelectedCategoryId}
                newCategoryName={newCategoryName}
                onNewCategoryNameChange={setNewCategoryName}
                onCreateCategory={handleCreateCategory}
                isLoading={isLoading}
                onReloadCategories={() => selectedContextId && fetchCategories(selectedContextId.toString())}
            />

            <ImportProcessView 
                isLoading={isLoading}
                importStatus={importStatus}
                feedbackMessage={feedbackMessage}
                onImport={handleImportQuestions}
                canImport={canImport}
            />
        </div>
    );
};

export default MoodleImportOrchestrator; 