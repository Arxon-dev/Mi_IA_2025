import React from 'react';

interface GiftContentInputProps {
    giftContent: string;
    onGiftContentChange: (content: string) => void;
    disabled?: boolean;
}

const GiftContentInput: React.FC<GiftContentInputProps> = ({
    giftContent,
    onGiftContentChange,
    disabled = false,
}) => {
    return (
        <div className="bg-card p-4 sm:p-6 rounded-lg shadow-md space-y-4">
            <h3 className="text-lg font-medium text-foreground">2. Contenido de Preguntas (Formato GIFT)</h3>
            <textarea
                value={giftContent}
                onChange={(e) => onGiftContentChange(e.target.value)}
                rows={10}
                placeholder="Pega aquí tus preguntas en formato GIFT..."
                className="block w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm text-foreground font-mono disabled:opacity-50"
                disabled={disabled}
            />
            {/* Aquí podrían ir validaciones de formato GIFT en el futuro */}
        </div>
    );
};

export default GiftContentInput; 