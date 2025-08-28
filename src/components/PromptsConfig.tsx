'use client';

import React, { useState, useEffect } from 'react';
import { 
  Loader2, 
  Save, 
  Edit2, 
  Check, 
  AlertCircle, 
  FileText, 
  Code, 
  X,
  RotateCcw,
  Copy,
  Search
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

interface Prompt {
  name: string;
  content: string;
  file: string;
}

const PROMPT_DESCRIPTIONS: Record<string, { description: string; category: string; icon: string; color: string }> = {
  formatPrompt: {
    description: 'Define el formato GIFT y estructura de las preguntas generadas',
    category: 'Formato',
    icon: '📝',
    color: 'text-blue-600'
  },
  difficultyPrompt: {
    description: 'Controla los niveles de dificultad y complejidad de las preguntas',
    category: 'Dificultad',
    icon: '📊',
    color: 'text-purple-600'
  },
  distractorsPrompt: {
    description: 'Genera distractores efectivos y plausibles para las opciones incorrectas',
    category: 'Distractores',
    icon: '🎯',
    color: 'text-orange-600'
  },
  documentationPrompt: {
    description: 'Procesa y analiza documentos normativos y legales',
    category: 'Documentación',
    icon: '📚',
    color: 'text-green-600'
  },
  qualityPrompt: {
    description: 'Asegura la calidad y precisión de las preguntas generadas',
    category: 'Calidad',
    icon: '✨',
    color: 'text-yellow-600'
  },
  expertPrompt: {
    description: 'Aplica conocimiento experto y mejores prácticas pedagógicas',
    category: 'Experto',
    icon: '🎓',
    color: 'text-indigo-600'
  }
};

const PromptsConfig: React.FC = () => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPrompt, setEditingPrompt] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<string>('');
  const [originalContent, setOriginalContent] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/prompts');
      if (!response.ok) {
        throw new Error('Error al cargar los prompts');
      }
      
      const data = await response.json();
      setPrompts(data);
    } catch (error) {
      console.error('Error al cargar los prompts:', error);
      setError('No se pudieron cargar los prompts');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt.file);
    setEditedContent(prompt.content);
    setOriginalContent(prompt.content);
    setError(null);
  };

  const handleCancel = () => {
    setEditingPrompt(null);
    setEditedContent('');
    setOriginalContent('');
    setError(null);
  };

  const handleReset = () => {
    setEditedContent(originalContent);
  };

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success('Prompt copiado al portapapeles');
    } catch (error) {
      toast.error('Error al copiar el prompt');
    }
  };

  const handleSave = async (prompt: Prompt) => {
    try {
      setSaving(true);
      setError(null);
      
      const response = await fetch('/api/prompts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file: prompt.file,
          content: editedContent
        }),
      });

      if (!response.ok) {
        throw new Error('Error al guardar el prompt');
      }

      const updatedPrompt = await response.json();
      
      // Actualizar el estado local
      setPrompts(prompts.map(p => 
        p.file === prompt.file 
          ? updatedPrompt
          : p
      ));
      
      setEditingPrompt(null);
      setEditedContent('');
      setOriginalContent('');
      toast.success('Prompt guardado correctamente');
    } catch (error) {
      console.error('Error al guardar el prompt:', error);
      setError('No se pudo guardar el prompt');
      toast.error('Error al guardar el prompt');
    } finally {
      setSaving(false);
    }
  };

  const getPromptDetails = (file: string) => {
    return PROMPT_DESCRIPTIONS[file] || {
      description: 'Configuración personalizada del sistema',
      category: 'General',
      icon: '⚙️',
      color: 'text-gray-600'
    };
  };

  const filteredPrompts = prompts.filter(prompt =>
    prompt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prompt.file.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getPromptDetails(prompt.file).category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hasChanges = editedContent !== originalContent;

  if (loading) {
    return (
      <div className="min-h-[400px]">
        <Card>
          <CardContent className="flex items-center justify-center p-12">
            <div className="text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground">Cargando configuración de prompts...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Configuración de Prompts</h2>
            <p className="text-muted-foreground">
              Personaliza los prompts del sistema para optimizar la generación de preguntas
            </p>
          </div>
          <Badge variant="outline" className="flex items-center space-x-1">
            <Code className="w-3 h-3" />
            <span>{prompts.length} prompts</span>
          </Badge>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar prompts por nombre, archivo o categoría..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="error">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Prompts Grid */}
      <div className="space-y-6">
        {filteredPrompts.map((prompt) => {
          const details = getPromptDetails(prompt.file);
          const isEditing = editingPrompt === prompt.file;
          
          return (
            <Card key={prompt.file} className={cn(
              "transition-all duration-200",
              isEditing && "ring-2 ring-primary ring-offset-2"
            )}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="flex items-center space-x-3">
                      <span className="text-2xl">{details.icon}</span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={cn("font-semibold", details.color)}>
                            {prompt.name}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {details.category}
                          </Badge>
                        </div>
                      </div>
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {details.description}
                    </CardDescription>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {!isEditing && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(prompt.content)}
                          className="flex items-center space-x-1"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(prompt)}
                          className="flex items-center space-x-2"
                        >
                          <Edit2 className="w-4 h-4" />
                          <span>Editar</span>
                        </Button>
                      </>
                    )}
                    
                    {isEditing && (
                      <div className="flex items-center space-x-2">
                        {hasChanges && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleReset}
                            className="flex items-center space-x-1"
                          >
                            <RotateCcw className="w-4 h-4" />
                            <span>Restablecer</span>
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCancel}
                          className="flex items-center space-x-1"
                        >
                          <X className="w-4 h-4" />
                          <span>Cancelar</span>
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSave(prompt)}
                          disabled={saving || !hasChanges}
                          className="flex items-center space-x-2"
                        >
                          {saving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                          <span>Guardar</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="w-full min-h-[400px] p-4 border border-border rounded-lg font-mono text-sm resize-y bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        spellCheck={false}
                        placeholder="Escribe aquí el contenido del prompt..."
                      />
                      <div className="absolute bottom-4 right-4 flex items-center space-x-4">
                        {hasChanges && (
                          <Badge variant="warning" className="text-xs">
                            Sin guardar
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {editedContent.length} caracteres
                        </Badge>
                      </div>
                    </div>
                    
                    {hasChanges && (
                      <Alert variant="info">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Tienes cambios sin guardar. Asegúrate de guardar antes de salir.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ) : (
                  <div className="relative">
                    <pre className="bg-muted/50 p-4 rounded-lg overflow-x-auto max-h-[400px] text-sm whitespace-pre-wrap border border-border">
                      <code className="block w-full text-foreground">
                        {prompt.content}
                      </code>
                    </pre>
                    <div className="absolute bottom-4 right-4">
                      <Badge variant="outline" className="text-xs bg-background">
                        {prompt.content.length} caracteres
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredPrompts.length === 0 && searchTerm && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No se encontraron prompts
            </h3>
            <p className="text-muted-foreground">
              No hay prompts que coincidan con tu búsqueda: "{searchTerm}"
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PromptsConfig; 