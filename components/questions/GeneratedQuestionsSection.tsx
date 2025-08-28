import React, { useState, useEffect } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  IconButton,
  TextField,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import SchoolIcon from '@mui/icons-material/School'; // Icono de Moodle
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { a11yDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { GeneratedQuestion } from '@/types/question';
import GiftEncoder from '@/lib/gift';
import toast from 'react-hot-toast';
import { importQuestionsToMoodle } from '@/lib/moodle'; // Asegúrate que la ruta sea correcta
import MoodleImportPopover from '@/components/moodle/MoodleImportPopover';


interface GeneratedQuestionsSectionProps {
  generatedQuestions: GeneratedQuestion[];
  onRemoveQuestion: (id: string) => void;
  onClearQuestions: () => void;
  onUpdateQuestionText: (id: string, newText: string) => void;
  onUpdateQuestionName: (id: string, newName: string) => void;
  viewMode: 'list' | 'gift';
  onChangeViewMode: (mode: 'list' | 'gift') => void;
  expandedAccordion: string | false;
  onAccordionChange: (panel: string | false) => (event: React.SyntheticEvent, isExpanded: boolean) => void;
  selectedContextId: number | null;
  selectedCategoryId: number | null;
  moodleToken: string | null; // <- AÑADIR PROP
}

export const GeneratedQuestionsSection: React.FC<GeneratedQuestionsSectionProps> = ({
  generatedQuestions,
  onRemoveQuestion,
  onClearQuestions,
  onUpdateQuestionText,
  onUpdateQuestionName,
  viewMode,
  onChangeViewMode,
  expandedAccordion,
  onAccordionChange,
  selectedContextId,
  selectedCategoryId,
  moodleToken, // <- AÑADIR PROP
}) => {
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editedText, setEditedText] = useState<string>('');
  const [editedName, setEditedName] = useState<string>('');
  const [giftPreview, setGiftPreview] = useState<string>('');
  const [popoverAnchor, setPopoverAnchor] = useState<null | HTMLElement>(null);
  const [popoverQuestionGift, setPopoverQuestionGift] = useState<string>('');
  const [popoverOpenIndex, setPopoverOpenIndex] = useState<number | null>(null);

  // Estado para el spinner de carga individual
  const [loadingStates, setLoadingStates] = useState<Record<number, boolean>>({});


  useEffect(() => {
    if (viewMode === 'gift' && generatedQuestions.length > 0) {
      const encoder = new GiftEncoder();
      generatedQuestions.forEach(q => {
        // Asumiendo que 'q.text' ya es el formato GIFT completo para esa pregunta
        // o que necesitas construirlo a partir de 'q'
        // Para este ejemplo, se asume que q.name es el nombre/título y q.text el cuerpo GIFT
        // Esto podría necesitar ajustes dependiendo de cómo se estructura 'GeneratedQuestion'
        // y cómo quieres que se represente en GIFT.
        // Ejemplo simple:
        encoder.addQuestion({
            title: q.name, // Usar el nombre de la pregunta
            text: q.text, // Usar el texto de la pregunta (que debe estar en formato GIFT)
            type: q.type, // Si tienes el tipo de pregunta
            options: q.options, // Si tienes opciones
            answer: q.answer, // Si tienes la respuesta
            // ...otros campos necesarios para el formato GIFT de esta pregunta específica
        });
      });
      setGiftPreview(encoder.toString());
    }
  }, [generatedQuestions, viewMode]);

  const handleEdit = (question: GeneratedQuestion) => {
    setEditingQuestionId(question.id);
    setEditedText(question.text); // Asumiendo que 'text' es el contenido editable
    setEditedName(question.name);
  };

  const handleSave = (id: string) => {
    onUpdateQuestionText(id, editedText);
    onUpdateQuestionName(id, editedName);
    setEditingQuestionId(null);
  };

  const handleImportSingleQuestion = async (questionGift: string, index: number) => {
    if (!moodleToken) {
      toast.error("Token de Moodle no disponible. Asegúrate de estar conectado.");
      return;
    }
    if (!selectedContextId) {
      toast.error("Por favor, selecciona un contexto de Moodle primero.");
      return;
    }
    if (!selectedCategoryId) {
      toast.error("Por favor, selecciona una categoría de Moodle primero.");
      return;
    }

    setLoadingStates(prev => ({ ...prev, [index]: true }));

    try {
      // console.log("Importando pregunta a Moodle:", {
      //   giftContent: questionGift,
      //   contextId: selectedContextId,
      //   categoryId: selectedCategoryId,
      //   token: moodleToken,
      // });
      const result = await importQuestionsToMoodle(
        questionGift,
        selectedContextId,
        selectedCategoryId,
        moodleToken
      );
      
      // console.log("Resultado de la importación:", result);

      if (result.success) {
        toast.success(result.message || "Pregunta importada con éxito!");
        if (result.data?.notifications && result.data.notifications.length > 0) {
          result.data.notifications.forEach((notification: any) => {
            if (notification.type === 'error') {
              toast.error(`Moodle: ${notification.message}`);
            } else {
              toast.success(`Moodle: ${notification.message}`);
            }
          });
        }
      } else {
        const errorMessage = result.message || "Error al importar la pregunta.";
        // console.error("Error en importQuestionsToMoodle:", result.error);
        toast.error(errorMessage);
        if (result.data?.notifications && result.data.notifications.length > 0) {
          result.data.notifications.forEach((notification: any) => {
             toast.error(`Moodle: ${notification.message}`);
          });
        } else if (result.error) {
          // Intentar obtener un mensaje más específico del error si está disponible
          const specificError = result.error.message || result.error.exception || (typeof result.error === 'string' ? result.error : "Error desconocido desde Moodle.");
          toast.error(`Error de Moodle: ${specificError}`);
        }
      }
    } catch (error: any) {
      // console.error("Excepción al importar pregunta:", error);
      const message = error.response?.data?.message || error.message || "Error desconocido al conectar con el servidor.";
      toast.error(`Error: ${message}`);
    } finally {
      setLoadingStates(prev => ({ ...prev, [index]: false }));
    }
  };


  if (viewMode === 'gift') {
    return (
      <Box sx={{ mt: 2, p: 2, border: '1px dashed grey' }}>
        <Typography variant="h6" gutterBottom>Vista Previa GIFT</Typography>
        <SyntaxHighlighter language="gift" style={a11yDark} customStyle={{ maxHeight: '400px', overflowY: 'auto' }}>
          {giftPreview || "// No hay preguntas para mostrar en formato GIFT."}
        </SyntaxHighlighter>
      </Box>
    );
  }
  
  if (generatedQuestions.length === 0) {
    return <Typography sx={{ mt: 2 }}>No hay preguntas generadas todavía.</Typography>;
  }

  return (
    <Box sx={{ mt: 2 }}>
      {generatedQuestions.map((question, index) => (
        <Accordion 
          key={question.id} 
          expanded={expandedAccordion === question.id} 
          onChange={onAccordionChange(question.id)}
          sx={{ mb: 1 }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls={`panel${index}a-content`}
            id={`panel${index}a-header`}
          >
            {editingQuestionId === question.id ? (
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onClick={(e) => e.stopPropagation()} // Evita que el clic propague al AccordionSummary
                sx={{ mr: 1 }}
              />
            ) : (
              <Typography sx={{ flexShrink: 0, fontWeight: 'medium', width: '90%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {question.name || `Pregunta ${index + 1}`}
              </Typography>
            )}
          </AccordionSummary>
          <AccordionDetails sx={{ display: 'flex', flexDirection: 'column' }}>
            {editingQuestionId === question.id ? (
              <TextField
                fullWidth
                multiline
                rows={4}
                variant="outlined"
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                sx={{ mb: 1 }}
              />
            ) : (
              <Typography component="div" sx={{ whiteSpace: 'pre-wrap', mb: 2, maxHeight: '200px', overflowY: 'auto' }}>
                 <SyntaxHighlighter language="gift" style={a11yDark} customStyle={{ fontSize: '0.9rem' }}>
                    {question.text}
                </SyntaxHighlighter>
              </Typography>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, alignItems: 'center' }}>
              {editingQuestionId === question.id ? (
                <Tooltip title="Guardar cambios">
                  <IconButton onClick={(e) => { e.stopPropagation(); handleSave(question.id); }} size="small" color="primary">
                    <SaveIcon />
                  </IconButton>
                </Tooltip>
              ) : (
                <Tooltip title="Editar pregunta">
                  <IconButton onClick={(e) => { e.stopPropagation(); handleEdit(question); }} size="small">
                    <EditIcon />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Eliminar pregunta">
                <IconButton onClick={(e) => { e.stopPropagation(); onRemoveQuestion(question.id); }} size="small" color="error">
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
              {/* Botón de importar a Moodle con popover */}
              <Tooltip title="Importar a Moodle">
                <span>
                  <IconButton
                    onClick={e => {
                      e.stopPropagation();
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      const encoder = new GiftEncoder();
                      encoder.addQuestion({
                        title: question.name,
                        text: question.text,
                        type: question.type,
                        options: question.options,
                        answer: question.answer,
                      });
                      setPopoverQuestionGift(encoder.toString());
                      setPopoverAnchor(e.currentTarget);
                      setPopoverOpenIndex(index);
                    }}
                    size="small"
                    color="secondary"
                  >
                    <SchoolIcon />
                  </IconButton>
                  {/* Popover solo para la pregunta activa */}
                  {popoverOpenIndex === index && popoverAnchor && (
                    <MoodleImportPopover
                      giftContent={popoverQuestionGift}
                      onClose={() => {
                        setPopoverAnchor(null);
                        setPopoverOpenIndex(null);
                      }}
                      onSuccess={msg => toast.success(msg)}
                      onError={msg => toast.error(msg)}
                    />
                  )}
                </span>
              </Tooltip>
            </Box>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}; 