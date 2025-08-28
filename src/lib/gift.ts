// Contenido inicial para lib/gift.ts
// Implementa tu clase GiftEncoder aquí o déjala vacía por ahora si solo quieres resolver el error de importación.

class GiftEncoder {
    private questions: any[] = [];

    addQuestion(question: any) {
        this.questions.push(question);
    }

    toString() {
        // Lógica simple para convertir preguntas a formato GIFT
        // Esto es un placeholder, necesitarás implementar la lógica real.
        return this.questions.map(q => {
            let giftString = `::${q.title}::${q.text}{\n`;
            if (q.type === 'MC') {
                q.options.forEach(opt => {
                    giftString += `    ${opt.iscorrect ? '=' : '~'}${opt.text}\n`;
                });
            }
            giftString += `}\n`;
            return giftString;
        }).join('\n');
    }
}

export default GiftEncoder; 