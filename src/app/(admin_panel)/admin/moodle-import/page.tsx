'use client'; 

import React from 'react';
import MoodleImportOrchestrator from '@/components/moodle/MoodleImportOrchestrator';

// El layout específico para esta sección (AdminPanelLayout) se aplica automáticamente
// desde src/app/(admin_panel)/layout.tsx.
// Ese layout ya incluye AdminNavbar y un <main> con padding.

const MoodleImportPage: React.FC = () => {
    return (
        // El div con style={{ padding: '20px' }} que tenías antes
        // podría ya no ser necesario aquí, o podrías querer un padding diferente.
        // El <main> en (admin_panel)/layout.tsx ya tiene p-6 (que son 24px).
        // Si quieres mantener los 20px exactos aquí, puedes dejar el div.
        // Si p-6 (24px) del layout es suficiente, puedes quitar este div.
        // Por simplicidad y para usar el padding del layout, lo quitaré por ahora.
        // Si ves que falta padding, podemos reajustar el layout o esta página.
        <MoodleImportOrchestrator />
    );
};

export default MoodleImportPage; 