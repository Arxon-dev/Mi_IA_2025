import React from 'react';

interface ImportProcessViewProps {
    isLoading: boolean;
    importStatus: 'idle' | 'importing' | 'success' | 'error';
    feedbackMessage: string | null;
    onImport: () => void; // El botón de importar ahora estará aquí
    canImport: boolean; // Para habilitar/deshabilitar el botón basado en la lógica del orquestador
}

const ImportProcessView: React.FC<ImportProcessViewProps> = ({
    isLoading,
    importStatus,
    feedbackMessage,
    onImport,
    canImport
}) => {
    return (
        <div className="space-y-6"> {/* Contenedor para espaciar el botón y el feedback */}
            {/* Botón de Importación Principal */}
            <div className="text-center"> {/* Centrar el botón */}
                <button 
                    onClick={onImport} 
                    disabled={isLoading || !canImport}
                    className="px-6 py-3 bg-primary text-primary-foreground border border-transparent rounded-md shadow-sm text-base font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading && importStatus === 'importing' ? 'Importando...' : 'Importar Preguntas a Moodle'}
                </button>
            </div>

            {/* Feedback de la operación */}
            {feedbackMessage && (
                <div className={[
                    "p-4 rounded-md border",
                    importStatus === 'error' ? "bg-destructive/10 border-destructive text-destructive" :
                    importStatus === 'success' ? "bg-constructive/10 border-constructive text-constructive" :
                    "bg-muted/50 border-border text-muted-foreground"
                ].join(' ')}>
                    <h4 className="text-sm font-semibold mb-1">
                        {importStatus === 'error' ? "Error en la Operación:" :
                         importStatus === 'success' ? "Operación Exitosa:" :
                         "Estado de la Operación:"}
                    </h4>
                    <p className="text-sm">{feedbackMessage}</p>
                </div>
            )}
        </div>
    );
};

export default ImportProcessView; 