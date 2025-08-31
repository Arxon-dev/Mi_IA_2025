'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Search,
  Filter,
  Edit,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
  Database,
  AlertCircle,
  CheckCircle,
  Send
} from 'lucide-react';

interface Question {
  id: string;
  questionnumber: number;
  question: string;
  options: string[] | string;
  correctanswerindex: number;
  category?: string;
  difficulty?: string;
  type?: string;
  bloomlevel?: string;
  title?: string;
  feedback?: string;
  tableName: string;
  updatedat: string;
  createdat: string;
}

interface SearchFilters {
  query: string;
  table: string;
  category: string;
  difficulty: string;
}

interface EditingQuestion extends Question {
  isEditing: boolean;
}

const QUESTION_TABLES = [
    'aire', 'armada', 'carrera', 'constitucion', 'defensanacional',
    'derechosydeberes', 'emad', 'et', 'examenoficial2018', 'examenoficial2024', 'igualdad',
    'iniciativasquejas', 'minsdef', 'omi', 'onu',
    'organizacionfas', 'osce', 'otan', 'pac', 'pdc',
    'regimendisciplinario', 'rio', 'rroo', 'seguridadnacional',
    'tropa', 'ue'
  ];

const DIFFICULTIES = ['Fácil', 'Medio', 'Difícil'];

export default function QuestionsAdminPage() {
  const [questions, setQuestions] = useState<EditingQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    table: '',
    category: '',
    difficulty: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [showFilters, setShowFilters] = useState(false);

  // Cargar preguntas
  const loadQuestions = async (page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.query && { query: filters.query }),
        ...(filters.table && { table: filters.table }),
        ...(filters.category && { category: filters.category }),
        ...(filters.difficulty && { difficulty: filters.difficulty })
      });

      const response = await fetch(`/api/admin/questions/search?${params}`);
      const data = await response.json();

      if (data.success) {
        setQuestions(data.data.questions.map((q: Question) => ({ ...q, isEditing: false })));
        setPagination({
          ...pagination,
          page: data.data.pagination.page,
          total: data.data.pagination.total,
          totalPages: data.data.pagination.totalPages
        });
      } else {
        setError(data.error || 'Error al cargar preguntas');
      }
    } catch (err) {
      setError('Error de conexión al cargar preguntas');
      console.error('Error loading questions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Buscar preguntas
  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    loadQuestions(1);
  };

  // Limpiar filtros
  const clearFilters = () => {
    setFilters({
      query: '',
      table: '',
      category: '',
      difficulty: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Activar edición
  const startEditing = (questionId: string) => {
    setQuestions(prev => prev.map(q => 
      q.id === questionId ? { ...q, isEditing: true } : { ...q, isEditing: false }
    ));
  };

  // Cancelar edición
  const cancelEditing = (questionId: string) => {
    setQuestions(prev => prev.map(q => 
      q.id === questionId ? { ...q, isEditing: false } : q
    ));
  };

  // Actualizar pregunta
  const updateQuestion = async (questionId: string, updatedData: Partial<Question>) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const question = questions.find(q => q.id === questionId);
      if (!question) return;

      const response = await fetch('/api/admin/questions/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          table: question.tableName,
          id: questionId,
          ...updatedData
        })
      });

      const data = await response.json();

      if (data.success) {
        setQuestions(prev => prev.map(q => 
          q.id === questionId ? { ...data.data.question, isEditing: false } : q
        ));
        setSuccess('Pregunta actualizada exitosamente');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Error al actualizar pregunta');
      }
    } catch (err) {
      setError('Error de conexión al actualizar pregunta');
      console.error('Error updating question:', err);
    } finally {
      setLoading(false);
    }
  };

  // Enviar pregunta por Telegram
  const sendToTelegram = async (questionId: string, table: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/admin/questions/send-telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId,
          table
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al enviar la pregunta por Telegram');
      }

      const result = await response.json();
      setSuccess('Pregunta enviada por Telegram correctamente');
    } catch (error) {
      console.error('Error sending question to Telegram:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Cargar preguntas al montar el componente
  useEffect(() => {
    loadQuestions();
  }, []);

  // Limpiar mensajes después de un tiempo
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Administración de Preguntas</h1>
          <p className="text-gray-600 mt-2">
            Busca y edita preguntas de todas las tablas del sistema
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Database className="h-6 w-6 text-blue-600" />
          <span className="text-sm text-gray-500">
            {pagination.total} preguntas encontradas
          </span>
        </div>
      </div>

      {/* Información del sistema de búsqueda */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <Search className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900 mb-1">
              Sistema de Búsqueda Avanzada
            </h3>
            <p className="text-sm text-blue-700">
              La búsqueda funciona en <strong>3 campos</strong>: <strong>enunciado de la pregunta</strong>, <strong>título</strong> y <strong>opciones de respuesta</strong>. 
              Puedes buscar palabras clave que aparezcan en cualquiera de estos campos. La búsqueda no distingue entre mayúsculas y minúsculas.
            </p>
          </div>
        </div>
      </div>

      {/* Mensajes de estado */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="text-green-700">{success}</span>
        </div>
      )}

      {/* Filtros de búsqueda */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Search className="h-5 w-5" />
              <span>Búsqueda y Filtros</span>
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Búsqueda principal */}
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Buscar en el texto de las preguntas..."
                value={filters.query}
                onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={loading}>
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
            </div>

            {/* Filtros avanzados */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">
                    Tabla
                  </label>
                  <select
                    value={filters.table}
                    onChange={(e) => setFilters(prev => ({ ...prev, table: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todas las tablas</option>
                    {QUESTION_TABLES.map(table => (
                      <option key={table} value={table}>
                        {table.charAt(0).toUpperCase() + table.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">
                    Categoría
                  </label>
                  <input
                    type="text"
                    placeholder="Filtrar por categoría..."
                    value={filters.category}
                    onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">
                    Dificultad
                  </label>
                  <select
                    value={filters.difficulty}
                    onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todas las dificultades</option>
                    {DIFFICULTIES.map(diff => (
                      <option key={diff} value={diff}>{diff}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex justify-between items-center pt-2">
              <Button
                variant="outline"
                onClick={clearFilters}
                disabled={loading}
              >
                Limpiar Filtros
              </Button>
              <span className="text-sm text-gray-500">
                Página {pagination.page} de {pagination.totalPages}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de preguntas */}
      <div className="space-y-4">
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Cargando preguntas...</p>
          </div>
        )}

        {!loading && questions.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No se encontraron preguntas con los filtros aplicados</p>
            </CardContent>
          </Card>
        )}

        {questions.map((question) => (
          <QuestionCard
            key={question.id}
            question={question}
            onEdit={startEditing}
            onCancel={cancelEditing}
            onSave={updateQuestion}
            onSendTelegram={sendToTelegram}
            loading={loading}
          />
        ))}
      </div>

      {/* Paginación */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => loadQuestions(pagination.page - 1)}
            disabled={pagination.page <= 1 || loading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <span className="px-4 py-2 text-sm text-gray-700">
            Página {pagination.page} de {pagination.totalPages}
          </span>
          
          <Button
            variant="outline"
            onClick={() => loadQuestions(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages || loading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

// Componente para cada pregunta
function QuestionCard({ 
  question, 
  onEdit, 
  onCancel, 
  onSave, 
  onSendTelegram,
  loading 
}: {
  question: EditingQuestion;
  onEdit: (id: string) => void;
  onCancel: (id: string) => void;
  onSave: (id: string, data: Partial<Question>) => void;
  onSendTelegram: (id: string, table: string) => void;
  loading: boolean;
}) {
  const [editData, setEditData] = useState<Partial<Question>>({});

  const handleSave = () => {
    onSave(question.id, editData);
    setEditData({});
  };

  const handleCancel = () => {
    onCancel(question.id);
    setEditData({});
  };

  let options: string[] = [];
  
  if (Array.isArray(question.options)) {
    options = question.options;
  } else if (typeof question.options === 'string') {
    try {
      // Intentar parsear como JSON array
      if (question.options.startsWith('[')) {
        options = JSON.parse(question.options);
      }
      // Intentar parsear formato {"opción1","opción2"}
      else if (question.options.startsWith('{') && question.options.endsWith('}')) {
        const content = question.options.slice(1, -1);
        const regex = /"([^"]+)"/g;
        const matches: string[] = [];
        let match;
        while ((match = regex.exec(content)) !== null) {
          matches.push(match[1]);
        }
        options = matches.length > 0 ? matches : [question.options];
      }
      // Fallback: usar como string único
      else {
        options = [question.options];
      }
    } catch (error) {
      console.error('Error parsing options:', error);
      options = [question.options];
    }
  } else {
    options = ['Opción A', 'Opción B', 'Opción C', 'Opción D'];
  }



  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Badge variant="outline">
                {question.tableName.toUpperCase()}
              </Badge>
              <Badge variant="secondary">
                #{question.questionnumber}
              </Badge>
              {question.difficulty && (
                <Badge 
                  variant={question.difficulty === 'Fácil' ? 'default' : 
                          question.difficulty === 'Medio' ? 'secondary' : 'destructive'}
                >
                  {question.difficulty}
                </Badge>
              )}
            </div>
            {question.title && (
              <h3 className="text-lg font-semibold text-gray-100 mb-1">
                {question.title}
              </h3>
            )}
          </div>
          <div className="flex space-x-2">
            {!question.isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(question.id)}
                  disabled={loading}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSendTelegram(question.id, question.tableName)}
                  disabled={loading}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Send className="h-4 w-4 mr-1" />
                  Enviar
                </Button>
              </>
            ) : (
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={loading}
                >
                  <Save className="h-4 w-4 mr-1" />
                  Guardar
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Pregunta */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Pregunta
            </label>
            {question.isEditing ? (
              <textarea
                value={editData.question ?? question.question}
                onChange={(e) => setEditData(prev => ({ ...prev, question: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            ) : (
              <p className="text-gray-100 font-medium">{question.question}</p>
            )}
          </div>

          {/* Opciones */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Opciones de Respuesta
            </label>
            <div className="space-y-2">
              {options.map((option: string, index: number) => (
                <div key={index} className="flex items-center space-x-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                    index === question.correctanswerindex ? 
                    'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </span>
                  {question.isEditing ? (
                    <input
                      type="text"
                      value={editData.options ? 
                        (Array.isArray(editData.options) ? editData.options[index] : option) : 
                        option
                      }
                      onChange={(e) => {
                        const newOptions = Array.isArray(editData.options) ? 
                          [...editData.options] : [...options];
                        newOptions[index] = e.target.value;
                        setEditData(prev => ({ ...prev, options: newOptions }));
                      }}
                      className="flex-1 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <span className="flex-1 text-gray-100 font-medium">{option}</span>
                  )}
                  {index === question.correctanswerindex && (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Metadatos adicionales */}
          {question.isEditing && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                  Categoría
                </label>
                <input
                  type="text"
                  value={editData.category ?? question.category ?? ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                  Dificultad
                </label>
                <select
                  value={editData.difficulty ?? question.difficulty ?? ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, difficulty: e.target.value }))}
                  className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar...</option>
                  {DIFFICULTIES.map(diff => (
                    <option key={diff} value={diff}>{diff}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                  Respuesta Correcta
                </label>
                <select
                  value={editData.correctanswerindex ?? question.correctanswerindex}
                  onChange={(e) => setEditData(prev => ({ ...prev, correctanswerindex: parseInt(e.target.value) }))}
                  className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {options.map((_, index) => (
                    <option key={index} value={index}>
                      Opción {String.fromCharCode(65 + index)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Información adicional */}
          {!question.isEditing && (
            <div className="flex flex-wrap gap-4 text-sm text-gray-300 pt-2 border-t">
              {question.category && (
                <span>Categoría: {question.category}</span>
              )}
              {question.type && (
                <span>Tipo: {question.type}</span>
              )}
              {question.bloomlevel && (
                <span>Bloom: {question.bloomlevel}</span>
              )}
              <span>Actualizada: {new Date(question.updatedat).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}