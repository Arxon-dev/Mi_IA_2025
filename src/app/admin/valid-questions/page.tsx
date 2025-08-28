'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';
import {
  Search,
  Edit,
  Trash2,
  Plus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle,
  Database,
  FileText,
  Layers
} from 'lucide-react';
import Link from 'next/link';

// Interface unificada para todas las preguntas
interface UnifiedQuestion {
  id: string;
  originalQuestionId: string;
  questionText: string; // Campo unificado para el texto de la pregunta
  questionTitle?: string; // 🔥 NUEVO: Campo para el título HTML parseado del GIFT
  questionPreview: string;
  parsedOptions: string[];
  correctanswerindex: number | null;
  parsedExplanation: string | null;
  parseMethod: string;
  type: string;
  difficulty: string;
  bloomLevel: string | null;
  sendCount: number;
  lastsuccessfulsendat: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  source: QuestionSource; // Nueva propiedad
  status: string;
  // Campos opcionales específicos por fuente
  documentTitle?: string;
  sectionTitle?: string;
}

interface ApiResponse {
  questions: UnifiedQuestion[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasMore: boolean;
  };
  stats: {
    total: number;
    active: number;
    inactive: number;
    neverSent: number;
    sentOnce: number;
    sentMultiple: number;
  };
  source: string; // Nueva propiedad
}

type QuestionSource = 'ValidQuestion' | 'Question' | 'SectionQuestion' | 'All' | 
  'Constitucion' | 'DefensaNacional' | 'Rio' | 'Minsdef' | 'OrganizacionFas' | 'Emad' | 'Et' | 
  'Armada' | 'Aire' | 'Carrera' | 'Tropa' | 'Rroo' | 'DerechosYDeberes' | 'RegimenDisciplinario' | 
  'IniciativasQuejas' | 'Igualdad' | 'Omi' | 'Pac' | 'SeguridadNacional' | 'Pdc' | 'Onu' | 'Otan' | 
  'Osce' | 'Ue' | 'MisionesInternacionales';

export default function ValidQuestionsPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedQuestion, setSelectedQuestion] = useState<UnifiedQuestion | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<UnifiedQuestion | null>(null);
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedSource, setSelectedSource] = useState<QuestionSource>('ValidQuestion'); // Nuevo estado
  
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      // Asegurarse de que la búsqueda no sea undefined o null
      const searchTerm = debouncedSearch || '';
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        search: searchTerm.trim(), // Eliminar espacios en blanco
        sortBy,
        sortOrder,
        showInactive: showInactive.toString(),
        source: selectedSource // Nuevo parámetro
      });
      
      // Si el término de búsqueda está vacío después de eliminar espacios, no incluirlo en los parámetros
      if (!searchTerm.trim()) {
        params.delete('search');
      }

      // Mostrar los parámetros de búsqueda para depuración
      console.log('Parámetros de búsqueda:', {
        search: searchTerm.trim(),
        source: selectedSource
      });

      const response = await fetch(`/api/admin/valid-questions?${params.toString()}`);
      if (response.ok) {
        const result = await response.json();
        console.log('Resultados recibidos:', result.questions.length);
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Efecto para debounce de la búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300); // 300ms de debounce

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchQuestions();
  }, [currentPage, debouncedSearch, showInactive, sortBy, sortOrder, selectedSource]); // Usar debouncedSearch en lugar de search

  const handleEdit = async (updatedQuestion: Partial<UnifiedQuestion>) => {
    if (!editingQuestion) return;

    try {
      // Mapear los campos del frontend a los campos esperados por el backend
      const backendData = {
        parsedQuestion: updatedQuestion.questionText, // 🔥 CONTIENE CONTENIDO GIFT COMPLETO (con retroalimentación)
        parsedOptions: updatedQuestion.parsedOptions,
        correctanswerindex: updatedQuestion.correctanswerindex,
        parsedExplanation: updatedQuestion.parsedExplanation,
        type: updatedQuestion.type,
        difficulty: updatedQuestion.difficulty,
        bloomLevel: updatedQuestion.bloomLevel,
        isActive: updatedQuestion.isActive,
        title: updatedQuestion.questionTitle // 🔥 TÍTULO PARSEADO DESDE EL GIFT
      };

      const response = await fetch(`/api/admin/valid-questions/${editingQuestion.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backendData) // ✅ ENVIAR DATOS MAPEADOS
      });

      if (response.ok) {
        setEditingQuestion(null);
        await fetchQuestions(); // ✅ ASEGURAR QUE SE COMPLETA ANTES DE CONTINUAR
      } else {
        const error = await response.json();
        alert(error.error || 'Error al actualizar pregunta');
      }
    } catch (error) {
      console.error('Error updating question:', error);
      alert('Error al actualizar pregunta');
    }
  };

  const handleDelete = async () => {
    if (!deletingQuestionId) return;

    try {
      const response = await fetch(`/api/admin/valid-questions/${deletingQuestionId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setDeletingQuestionId(null);
        fetchQuestions();
      } else {
        const error = await response.json();
        alert(error.error || 'Error al eliminar pregunta');
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      alert('Error al eliminar pregunta');
    }
  };

  const getStatusBadge = (question: UnifiedQuestion) => {
    if (!question.isActive || question.status === 'archived') {
      return <Badge variant="secondary">Inactiva</Badge>;
    }
    if (question.sendCount === 0) {
      return <Badge variant="outline">Nunca enviada</Badge>;
    }
    if (question.sendCount === 1) {
      return <Badge variant="default">Enviada 1 vez</Badge>;
    }
    return <Badge variant="destructive">Enviada {question.sendCount} veces</Badge>;
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'ValidQuestion':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Válida</Badge>;
      case 'Question':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><FileText className="w-3 h-3 mr-1" />Original</Badge>;
      case 'SectionQuestion':
        return <Badge variant="outline" className="bg-purple-100 text-purple-800"><Layers className="w-3 h-3 mr-1" />Sección</Badge>;
      // 🔥 NUEVAS TABLAS CATEGORIZADAS
      case 'Constitucion':
        return <Badge variant="default" className="bg-red-100 text-red-800"><Database className="w-3 h-3 mr-1" />Constitución</Badge>;
      case 'DefensaNacional':
        return <Badge variant="default" className="bg-indigo-100 text-indigo-800"><Database className="w-3 h-3 mr-1" />Defensa</Badge>;
      case 'Rio':
        return <Badge variant="default" className="bg-orange-100 text-orange-800"><Database className="w-3 h-3 mr-1" />RIO</Badge>;
      case 'Minsdef':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800"><Database className="w-3 h-3 mr-1" />MINSDEF</Badge>;
      case 'OrganizacionFas':
        return <Badge variant="default" className="bg-pink-100 text-pink-800"><Database className="w-3 h-3 mr-1" />Org.FAS</Badge>;
      case 'Emad':
        return <Badge variant="default" className="bg-teal-100 text-teal-800"><Database className="w-3 h-3 mr-1" />EMAD</Badge>;
      case 'Et':
        return <Badge variant="default" className="bg-green-100 text-green-800"><Database className="w-3 h-3 mr-1" />ET</Badge>;
      case 'Armada':
        return <Badge variant="default" className="bg-blue-100 text-blue-800"><Database className="w-3 h-3 mr-1" />Armada</Badge>;
      case 'Aire':
        return <Badge variant="default" className="bg-cyan-100 text-cyan-800"><Database className="w-3 h-3 mr-1" />Aire</Badge>;
      case 'Carrera':
        return <Badge variant="default" className="bg-purple-100 text-purple-800"><Database className="w-3 h-3 mr-1" />Carrera</Badge>;
      case 'Tropa':
        return <Badge variant="default" className="bg-gray-100 text-gray-800"><Database className="w-3 h-3 mr-1" />Tropa</Badge>;
      case 'Rroo':
        return <Badge variant="default" className="bg-emerald-100 text-emerald-800"><Database className="w-3 h-3 mr-1" />RROO</Badge>;
      case 'DerechosYDeberes':
        return <Badge variant="default" className="bg-lime-100 text-lime-800"><Database className="w-3 h-3 mr-1" />Derechos</Badge>;
      case 'RegimenDisciplinario':
        return <Badge variant="default" className="bg-amber-100 text-amber-800"><Database className="w-3 h-3 mr-1" />Disciplina</Badge>;
      case 'IniciativasQuejas':
        return <Badge variant="default" className="bg-rose-100 text-rose-800"><Database className="w-3 h-3 mr-1" />Iniciativas</Badge>;
      case 'Igualdad':
        return <Badge variant="default" className="bg-violet-100 text-violet-800"><Database className="w-3 h-3 mr-1" />Igualdad</Badge>;
      case 'Omi':
        return <Badge variant="default" className="bg-sky-100 text-sky-800"><Database className="w-3 h-3 mr-1" />OMI</Badge>;
      case 'Pac':
        return <Badge variant="default" className="bg-stone-100 text-stone-800"><Database className="w-3 h-3 mr-1" />PAC</Badge>;
      case 'SeguridadNacional':
        return <Badge variant="default" className="bg-slate-100 text-slate-800"><Database className="w-3 h-3 mr-1" />Seguridad</Badge>;
      case 'Pdc':
        return <Badge variant="default" className="bg-zinc-100 text-zinc-800"><Database className="w-3 h-3 mr-1" />PDC</Badge>;
      case 'Onu':
        return <Badge variant="default" className="bg-neutral-100 text-neutral-800"><Database className="w-3 h-3 mr-1" />ONU</Badge>;
      case 'Otan':
        return <Badge variant="default" className="bg-red-100 text-red-800"><Database className="w-3 h-3 mr-1" />OTAN</Badge>;
      case 'Osce':
        return <Badge variant="default" className="bg-orange-100 text-orange-800"><Database className="w-3 h-3 mr-1" />OSCE</Badge>;
      case 'Ue':
        return <Badge variant="default" className="bg-blue-100 text-blue-800"><Database className="w-3 h-3 mr-1" />UE</Badge>;
      case 'MisionesInternacionales':
        return <Badge variant="default" className="bg-green-100 text-green-800"><Database className="w-3 h-3 mr-1" />Misiones</Badge>;
      default:
        return <Badge variant="outline">{source}</Badge>;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'hard': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getSourceIcon = (source: QuestionSource) => {
    switch (source) {
      case 'ValidQuestion':
        return <CheckCircle className="w-4 h-4" />;
      case 'Question':
        return <FileText className="w-4 h-4" />;
      case 'SectionQuestion':
        return <Layers className="w-4 h-4" />;
      case 'All':
        return <Database className="w-4 h-4" />;
      // 🔥 NUEVAS TABLAS CATEGORIZADAS
      case 'Constitucion':
      case 'DefensaNacional':
      case 'Rio':
      case 'Minsdef':
      case 'OrganizacionFas':
      case 'Emad':
      case 'Et':
      case 'Armada':
      case 'Aire':
      case 'Carrera':
      case 'Tropa':
      case 'Rroo':
      case 'DerechosYDeberes':
      case 'RegimenDisciplinario':
      case 'IniciativasQuejas':
      case 'Igualdad':
      case 'Omi':
      case 'Pac':
      case 'SeguridadNacional':
      case 'Pdc':
      case 'Onu':
      case 'Otan':
      case 'Osce':
      case 'Ue':
      case 'MisionesInternacionales':
        return <Database className="w-4 h-4" />;
      default:
        return <Database className="w-4 h-4" />;
    }
  };

  const getSourceDescription = (source: QuestionSource) => {
    switch (source) {
      case 'ValidQuestion':
        return 'Preguntas validadas y optimizadas para Telegram';
      case 'Question':
        return 'Preguntas originales generadas de documentos';
      case 'SectionQuestion':
        return 'Preguntas generadas por secciones específicas';
      case 'All':
        return 'Todas las preguntas de todas las fuentes';
      // 🔥 NUEVAS TABLAS CATEGORIZADAS
      case 'Constitucion':
        return 'Preguntas de la Constitución Española';
      case 'DefensaNacional':
        return 'Preguntas de Defensa Nacional';
      case 'Rio':
        return 'Preguntas del RIO (Reglamento de Instrucción y Organización)';
      case 'Minsdef':
        return 'Preguntas del Ministerio de Defensa';
      case 'OrganizacionFas':
        return 'Preguntas de Organización de las FAS';
      case 'Emad':
        return 'Preguntas del Estado Mayor de la Defensa';
      case 'Et':
        return 'Preguntas del Ejército de Tierra';
      case 'Armada':
        return 'Preguntas de la Armada Española';
      case 'Aire':
        return 'Preguntas del Ejército del Aire';
      case 'Carrera':
        return 'Preguntas de Carrera Militar';
      case 'Tropa':
        return 'Preguntas de Tropa y Marinería';
      case 'Rroo':
        return 'Preguntas de Reales Ordenanzas';
      case 'DerechosYDeberes':
        return 'Preguntas de Derechos y Deberes';
      case 'RegimenDisciplinario':
        return 'Preguntas de Régimen Disciplinario';
      case 'IniciativasQuejas':
        return 'Preguntas de Iniciativas y Quejas';
      case 'Igualdad':
        return 'Preguntas de Igualdad';
      case 'Omi':
        return 'Preguntas de OMI (Organización Marítima Internacional)';
      case 'Pac':
        return 'Preguntas de PAC (Política Agraria Común)';
      case 'SeguridadNacional':
        return 'Preguntas de Seguridad Nacional';
      case 'Pdc':
        return 'Preguntas de PDC (Política de Defensa Común)';
      case 'Onu':
        return 'Preguntas de la ONU';
      case 'Otan':
        return 'Preguntas de la OTAN';
      case 'Osce':
        return 'Preguntas de la OSCE';
      case 'Ue':
        return 'Preguntas de la Unión Europea';
      case 'MisionesInternacionales':
        return 'Preguntas de Misiones Internacionales';
      default:
        return 'Preguntas del sistema';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="w-4 h-4 mr-1" />
                Volver
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold">Gestión de Preguntas del Sistema</h1>
          <p className="text-muted-foreground">
            {getSourceDescription(selectedSource)}
          </p>
        </div>
        <Button onClick={fetchQuestions} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Source Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Fuente de Preguntas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Fuentes Principales */}
          <div>
            <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">Fuentes Principales</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(['ValidQuestion', 'Question', 'SectionQuestion', 'All'] as QuestionSource[]).map((source) => (
                <Button
                  key={source}
                  variant={selectedSource === source ? "primary" : "outline"}
                  onClick={() => {
                    setSelectedSource(source);
                    setCurrentPage(1);
                  }}
                  className="h-auto p-3 flex flex-col items-center gap-2"
                >
                  {getSourceIcon(source)}
                  <div className="text-center">
                    <div className="font-medium text-sm">
                      {source === 'ValidQuestion' ? 'Válidas' : 
                       source === 'Question' ? 'Originales' : 
                       source === 'SectionQuestion' ? 'Secciones' : 'Todas'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {source === 'ValidQuestion' ? 'Optimizadas' : 
                       source === 'Question' ? 'Generadas' : 
                       source === 'SectionQuestion' ? 'Por sección' : 'Combinadas'}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Fuentes Categorizadas - Normativa y Reglamentos */}
          <div>
            <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">Normativa y Reglamentos</h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {(['Constitucion', 'DefensaNacional', 'Rio', 'Rroo', 'DerechosYDeberes', 'RegimenDisciplinario'] as QuestionSource[]).map((source) => (
                                 <Button
                   key={source}
                   variant={selectedSource === source ? "primary" : "outline"}
                   onClick={() => {
                     setSelectedSource(source);
                     setCurrentPage(1);
                   }}
                   size="sm"
                   className="h-auto p-2 flex flex-col items-center gap-1"
                 >
                   <Database className="w-3 h-3" />
                   <div className="text-xs font-medium text-center">
                     {source === 'Constitucion' ? 'Constitución' :
                      source === 'DefensaNacional' ? 'Defensa' :
                      source === 'Rio' ? 'RIO' :
                      source === 'Rroo' ? 'RROO' :
                      source === 'DerechosYDeberes' ? 'Derechos' :
                      'Disciplina'}
                   </div>
                 </Button>
              ))}
            </div>
          </div>

          {/* Fuentes Categorizadas - Organización Militar */}
          <div>
            <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">Organización Militar</h3>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                             {(['Minsdef', 'OrganizacionFas', 'Emad', 'Et', 'Armada', 'Aire', 'Carrera', 'Tropa'] as QuestionSource[]).map((source) => (
                 <Button
                   key={source}
                   variant={selectedSource === source ? "primary" : "outline"}
                  onClick={() => {
                    setSelectedSource(source);
                    setCurrentPage(1);
                  }}
                  size="sm"
                  className="h-auto p-2 flex flex-col items-center gap-1"
                >
                  <Database className="w-3 h-3" />
                  <div className="text-xs font-medium text-center">
                    {source === 'Minsdef' ? 'MINSDEF' :
                     source === 'OrganizacionFas' ? 'Org.FAS' :
                     source === 'Emad' ? 'EMAD' :
                     source === 'Et' ? 'ET' :
                     source === 'Armada' ? 'Armada' :
                     source === 'Aire' ? 'Aire' :
                     source === 'Carrera' ? 'Carrera' :
                     'Tropa'}
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Fuentes Categorizadas - Organizaciones Internacionales */}
          <div>
            <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">Organizaciones Internacionales</h3>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                             {(['Igualdad', 'Omi', 'Pac', 'SeguridadNacional', 'Pdc', 'Onu', 'Otan', 'Osce', 'Ue', 'MisionesInternacionales', 'IniciativasQuejas'] as QuestionSource[]).map((source) => (
                 <Button
                   key={source}
                   variant={selectedSource === source ? "primary" : "outline"}
                  onClick={() => {
                    setSelectedSource(source);
                    setCurrentPage(1);
                  }}
                  size="sm"
                  className="h-auto p-2 flex flex-col items-center gap-1"
                >
                  <Database className="w-3 h-3" />
                  <div className="text-xs font-medium text-center">
                    {source === 'Igualdad' ? 'Igualdad' :
                     source === 'Omi' ? 'OMI' :
                     source === 'Pac' ? 'PAC' :
                     source === 'SeguridadNacional' ? 'Seguridad' :
                     source === 'Pdc' ? 'PDC' :
                     source === 'Onu' ? 'ONU' :
                     source === 'Otan' ? 'OTAN' :
                     source === 'Osce' ? 'OSCE' :
                     source === 'Ue' ? 'UE' :
                     source === 'MisionesInternacionales' ? 'Misiones' :
                     'Iniciativas'}
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{data.stats.total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{data.stats.active}</div>
              <div className="text-sm text-muted-foreground">Activas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-600">{data.stats.inactive}</div>
              <div className="text-sm text-muted-foreground">Inactivas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{data.stats.neverSent}</div>
              <div className="text-sm text-muted-foreground">Nunca enviadas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{data.stats.sentOnce}</div>
              <div className="text-sm text-muted-foreground">Enviadas 1 vez</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{data.stats.sentMultiple}</div>
              <div className="text-sm text-muted-foreground">Múltiples envíos</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  placeholder="Buscar por enunciado, opciones, ID, tipo o dificultad..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      // Forzar la búsqueda inmediata al presionar Enter
                      setDebouncedSearch(search.trim());
                    }
                  }}
                />
              </div>
            </div>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="select w-[180px]"
            >
              <option value="createdAt">Fecha creación</option>
              <option value="sendCount">Veces enviada</option>
              <option value="lastSent">Último envío</option>
              <option value="difficulty">Dificultad</option>
            </select>
            <select 
              value={sortOrder} 
              onChange={(e) => setSortOrder(e.target.value)}
              className="select w-[120px]"
            >
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
            <Button
              variant={showInactive ? "secondary" : "outline"}
              onClick={() => setShowInactive(!showInactive)}
            >
              {showInactive ? "Mostrar todas" : "Incluir inactivas"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Questions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Preguntas</span>
            {data && (
              <span className="text-sm font-normal text-muted-foreground">
                {data.pagination.totalCount} resultados
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {data?.questions.map((question) => (
                <div 
                  key={question.id} 
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getSourceBadge(question.source)}
                        {getStatusBadge(question)}
                        <Badge variant="outline">{question.parseMethod}</Badge>
                        <Badge variant="outline" className={getDifficultyColor(question.difficulty)}>
                          {question.difficulty}
                        </Badge>
                        <Badge variant="secondary">{question.type}</Badge>
                        {question.bloomLevel && (
                          <Badge variant="secondary">{question.bloomLevel}</Badge>
                        )}
                      </div>
                      
                      <div className="text-sm font-medium whitespace-pre-wrap">
                        <div dangerouslySetInnerHTML={{ __html: question.questionText }} />
                      </div>

                      {/* Información adicional según la fuente */}
                      {(question.documentTitle || question.sectionTitle) && (
                        <div className="text-xs text-muted-foreground">
                          {question.documentTitle && (
                            <span>📄 {question.documentTitle}</span>
                          )}
                          {question.sectionTitle && (
                            <span>{question.documentTitle ? ' → ' : ''}📝 {question.sectionTitle}</span>
                          )}
                        </div>
                      )}
                      
                      <div className="text-xs text-muted-foreground flex gap-4">
                        <span>ID: {question.id.substring(0, 8)}...</span>
                        <span>Opciones: {question.parsedOptions.length}</span>
                        <span>Correcta: {question.correctanswerindex !== null ? (question.correctanswerindex + 1) : 'N/A'}</span>
                        {question.lastsuccessfulsendat && (
                          <span>
                            Último envío: {new Date(question.lastsuccessfulsendat).toLocaleDateString()}
                          </span>
                        )}
                        <span>Fuente: {question.source}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedQuestion(question)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>

                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setEditingQuestion(question)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>

                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setDeletingQuestionId(question.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {data && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Página {data.pagination.page} de {data.pagination.totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={!data.pagination.hasMore}
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Modal */}
      {selectedQuestion && (
        <QuestionViewModal 
          question={selectedQuestion} 
          onClose={() => setSelectedQuestion(null)}
        />
      )}

      {/* Edit Modal */}
      {editingQuestion && (
        <QuestionEditModal 
          question={editingQuestion} 
          onSave={handleEdit}
          onCancel={() => setEditingQuestion(null)}
        />
      )}

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        isOpen={!!deletingQuestionId}
        onClose={() => setDeletingQuestionId(null)}
        onConfirm={handleDelete}
        title="pregunta"
        description="Esta acción no se puede deshacer. La pregunta será eliminada permanentemente."
      />
    </div>
  );
}

// Modal para ver pregunta
function QuestionViewModal({ 
  question, 
  onClose 
}: { 
  question: UnifiedQuestion; 
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-background border border-border rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Vista previa de pregunta</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="font-semibold">Pregunta (formato GIFT completo):</label>
              <pre className="mt-1 bg-muted/50 p-3 rounded-md text-sm whitespace-pre-wrap border">{question.questionText}</pre>
            </div>
            
            <div>
              <label className="font-semibold">Opciones:</label>
              <div className="mt-1 space-y-1">
                {question.parsedOptions.map((option, index) => (
                  <div 
                    key={index} 
                    className={`p-3 rounded-lg border ${
                      index === question.correctanswerindex 
                        ? 'bg-green-50 border-green-200 text-green-900 dark:bg-green-900/20 dark:border-green-700 dark:text-green-100' 
                        : 'bg-muted/50 border-border text-foreground hover:bg-muted/70'
                    }`}
                  >
                    <span className="font-medium">{index + 1}.</span> {option}
                    {index === question.correctanswerindex && (
                      <CheckCircle className="w-4 h-4 inline ml-2 text-green-600 dark:text-green-400" />
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {question.parsedExplanation && (
              <div>
                <label className="font-semibold">Explicación:</label>
                <p className="mt-1 text-sm text-muted-foreground">
                  {question.parsedExplanation}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Modal para editar pregunta - VERSIÓN GIFT SIMPLE
// 🔥 FUNCIÓN AUXILIAR MOVIDA FUERA DEL COMPONENTE PARA EVITAR RE-CREACIONES
const generateInitialGift = (q: UnifiedQuestion): string => {
  const questionText = q.questionText || '';
  const options = q.parsedOptions || [];
  const correctIndex = q.correctanswerindex ?? 0;
  const explanation = q.parsedExplanation;
  
  // ✅ DEBUG eliminado para evitar logs repetitivos
  
  // 🔥 USAR DIRECTAMENTE EL CONTENIDO GIFT ORIGINAL COMPLETO
  if (questionText.includes('{') && questionText.includes('}')) {
    // El contenido ya está en formato GIFT completo, devolverlo tal como está
    // ✅ NO REGENERAR EL TÍTULO - PRESERVAR EL ORIGINAL
    return questionText;
  }
  
  // ✅ GENERAR FORMATO GIFT COMPLETO CON TÍTULO SEMÁNTICO desde campos separados
  const generateSmartTitle = (text: string): string => {
    // Limpiar la pregunta de caracteres especiales
    const cleanQuestion = text.replace(/[¿?]/g, '').trim();
    
    // Detectar temas comunes y generar títulos descriptivos
    const topicPatterns = [
      { pattern: /(constitución|constitutional)/i, title: 'Constitución Española' },
      { pattern: /(otan|nato)/i, title: 'OTAN - Organización del Tratado del Atlántico Norte' },
      { pattern: /(onu|naciones unidas)/i, title: 'ONU - Organización de las Naciones Unidas' },
      { pattern: /(ue|unión europea|europea)/i, title: 'UE - Unión Europea' },
      { pattern: /(osce)/i, title: 'OSCE - Organización para la Seguridad y Cooperación en Europa' },
      { pattern: /(defensa nacional|planeamiento.*defensa)/i, title: 'Planeamiento de la Defensa' },
      { pattern: /(seguridad nacional)/i, title: 'Estrategia de Seguridad Nacional' },
      { pattern: /(tropa.*marinería|ley.*8\/2006)/i, title: 'Ley de Tropa y Marinería' },
      { pattern: /(carrera militar|ley.*39\/2007)/i, title: 'Ley de la Carrera Militar' },
      { pattern: /(régimen disciplinario)/i, title: 'Régimen Disciplinario Militar' },
      { pattern: /(derechos.*deberes)/i, title: 'Derechos y Deberes del Personal Militar' },
      { pattern: /(igualdad|ley.*3\/2007)/i, title: 'Ley Orgánica de Igualdad' },
      { pattern: /(emad|estado mayor)/i, title: 'EMAD - Estado Mayor de la Defensa' },
      { pattern: /(ejercito.*tierra|et)/i, title: 'Ejército de Tierra' },
      { pattern: /(armada)/i, title: 'Armada Española' },
      { pattern: /(ejercito.*aire|aire)/i, title: 'Ejército del Aire' },
      { pattern: /(minsdef|ministerio.*defensa)/i, title: 'Ministerio de Defensa' },
      { pattern: /(rio|reglamento.*interno)/i, title: 'RIO - Reglamento Interno y de Organización' },
      { pattern: /(rroo|reglamento.*régimen)/i, title: 'RROO - Reglamento del Régimen y Organización' },
      { pattern: /(misiones.*internacionales)/i, title: 'Misiones Internacionales' },
      { pattern: /(omi)/i, title: 'OMI - Organización Marítima Internacional' },
      { pattern: /(pac|política.*común)/i, title: 'PAC - Política Agrícola Común' },
      { pattern: /(pdc|países.*desarrollo)/i, title: 'PDC - Países en Desarrollo' }
    ];

    // Buscar coincidencias con patrones conocidos
    for (const {pattern, title} of topicPatterns) {
      if (pattern.test(cleanQuestion)) {
        return `${title} (Texto Provisto)`;
      }
    }

    // Si no encuentra patrón específico, generar título genérico basado en palabras clave
    const words = cleanQuestion.split(' ');
    const titleWords = words.slice(0, 4); // Máximo 4 palabras principales
    let title = titleWords.join(' ');
    
    // Capitalizar primera letra
    title = title.charAt(0).toUpperCase() + title.slice(1);
    
    // Limitar longitud
    if (title.length > 40) {
      title = title.substring(0, 37) + '...';
    }
    
    return `${title} (Texto Provisto)`;
  };
  
  const title = generateSmartTitle(questionText);
  let gift = `<b>${title}</b><br><br>\n${questionText} {\n`;
  
  // Agregar opciones con prefijos = y ~ incluyendo porcentajes específicos
  options.forEach((option, index) => {
    const prefix = index === correctIndex ? '=' : '~%-33.33333%';
    gift += `${prefix}${option}\n`;
  });
  
  // ✅ AGREGAR EXPLICACIÓN DENTRO DE LAS LLAVES si existe
  if (explanation) {
    // Limpiar la explicación de caracteres extra
    const cleanExplanation = explanation
      .replace(/^n+/g, '') // Remover 'n' al inicio
      .replace(/\n/g, '\n// ') // Formatear líneas múltiples
      .trim();
    
    gift += `#### Explicación:\n// ${cleanExplanation}\n`;
  }
  
  gift += '}';
  
  return gift;
};

function QuestionEditModal({ 
  question, 
  onSave, 
  onCancel 
}: { 
  question: UnifiedQuestion; 
  onSave: (data: Partial<UnifiedQuestion>) => void;
  onCancel: () => void;
}) {
  // 🔥 GENERAR CONTENIDO GIFT INICIAL (solo una vez)
  const [formData, setFormData] = useState(() => ({
    giftContent: generateInitialGift(question),
    type: question.type,
    difficulty: question.difficulty,
    bloomLevel: question.bloomLevel || '',
    isActive: question.isActive
  }));

  // 🔥 NUEVO: Estado para los campos parseados del GIFT (inicialización diferida)
  const [parsedData, setParsedData] = useState({
    questionText: question.questionText,
    questionTitle: question.questionTitle || '',
    parsedOptions: question.parsedOptions,
    correctanswerindex: question.correctanswerindex,
    parsedExplanation: question.parsedExplanation
  });

  // Parsear contenido GIFT para extraer campos
  const parseGiftContent = (giftText: string) => {
    try {
      // ✅ LIMPIEZA INICIAL: Remover llaves vacías extras al final
      const cleanedText = giftText.replace(/\}\s*\{\s*\}/g, '').trim();
      
      // ✅ REMOVER COMENTARIOS INICIALES: Ignorar líneas que empiecen con //
      const lines = cleanedText.split('\n');
      let startIndex = 0;
      
      // Buscar la primera línea que NO sea un comentario para empezar desde ahí
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line && !line.startsWith('//')) {
          startIndex = i;
          break;
        }
      }
      
      // Reconstruir el texto sin comentarios iniciales
      const textWithoutInitialComments = lines.slice(startIndex).join('\n').trim();
      
      // ✅ EXTRAER TÍTULO Y PREGUNTA REAL
      let questionText = '';
      let questionTitle = '';
      
      // Detectar si tiene título en formato HTML (<b>título</b><br><br>)
      const htmlTitleMatch = textWithoutInitialComments.match(/^<b>(.*?)<\/b><br><br>\s*([\s\S]+?)\s*\{/);
      if (htmlTitleMatch) {
        questionTitle = htmlTitleMatch[1].trim();
        questionText = htmlTitleMatch[2].trim();
      } 
      // Detectar si tiene título en formato GIFT (::título::) - para retrocompatibilidad
      else {
        const giftTitleMatch = textWithoutInitialComments.match(/^::(.*?)::([\s\S]+?)\s*\{/);
        if (giftTitleMatch) {
          questionTitle = giftTitleMatch[1].trim();
          questionText = giftTitleMatch[2].trim();
        } else {
          // Sin título, extraer solo la pregunta
          const questionMatch = textWithoutInitialComments.match(/^([\s\S]+?)\s*\{/);
          questionText = questionMatch ? questionMatch[1].trim() : '';
        }
      }
      
      // ✅ EXTRACCIÓN MEJORADA DE OPCIONES
      // Buscar el primer bloque de opciones (entre las primeras llaves { })
      const optionsMatch = cleanedText.match(/\{([\s\S]*?)\}/);
      const optionsText = optionsMatch ? optionsMatch[1] : '';
      
      const options: string[] = [];
      let correctanswerindex = 0;
      
      // Procesar líneas de opciones, ignorando contenido que no sea opciones
      const optionLines = optionsText.split('\n');
      let optionIndex = 0;
      
      for (const line of optionLines) {
        const trimmed = line.trim();
        // Reconocer formato con porcentajes: =%100% y ~%-33.33333%
        if (trimmed.startsWith('=')) {
          correctanswerindex = optionIndex;
          // Extraer el texto después del prefijo, manejando porcentajes
          let optionText = trimmed.substring(1);
          if (optionText.startsWith('%') && optionText.includes('%', 1)) {
            // Formato con porcentajes: =%100%texto
            const secondPercentIndex = optionText.indexOf('%', 1);
            optionText = optionText.substring(secondPercentIndex + 1);
          }
          options.push(optionText.trim());
          optionIndex++;
        } else if (trimmed.startsWith('~')) {
          // Extraer el texto después del prefijo, manejando porcentajes
          let optionText = trimmed.substring(1);
          if (optionText.startsWith('%') && optionText.includes('%', 1)) {
            // Formato con porcentajes: ~%-33.33333%texto
            const secondPercentIndex = optionText.indexOf('%', 1);
            optionText = optionText.substring(secondPercentIndex + 1);
          }
          options.push(optionText.trim());
          optionIndex++;
        }
        // Ignorar otras líneas (como #### RETROALIMENTACIÓN, etc.)
      }

      // ✅ EXTRACCIÓN MEJORADA DE EXPLICACIÓN
      // Buscar explicación en diferentes formatos
      let explanation: string | null = null;
      
      // Formato 1: #### Explicación: (DENTRO de las llaves - FORMATO CORRECTO)
      const explanationMatch1 = cleanedText.match(/#### Explicación:\s*\n\/\/ ([\s\S]*?)(?:\n\}|$)/);
      if (explanationMatch1) {
        explanation = explanationMatch1[1].replace(/\n\/\/ /g, '\n').trim();
      } 
      
      // Formato 2: // Explicación: (FUERA de las llaves - FORMATO ANTERIOR)
      else {
        const explanationMatch2 = cleanedText.match(/\/\/ Explicación:\s*\n\/\/ ([\s\S]*?)(?:\n\n|$)/);
        if (explanationMatch2) {
          explanation = explanationMatch2[1].replace(/\n\/\/ /g, '\n').trim();
        } 
        
        // Formato 3: #### RETROALIMENTACIÓN (tomar solo una parte resumida)
        else {
          const explanationMatch3 = cleanedText.match(/#### RETROALIMENTACIÓN:[\s\S]*?<b>Referencia:<\/b>\s*(.*?)(?:<br>|$)/);
          if (explanationMatch3) {
            // Extraer solo la referencia como explicación simplificada
            explanation = explanationMatch3[1].replace(/<[^>]*>/g, '').trim();
            // Limitar a 200 caracteres
            if (explanation && explanation.length > 200) {
              explanation = explanation.substring(0, 197) + '...';
            }
          }
        }
      }

      return {
        questionText,
        questionTitle, // 🔥 NUEVO: Incluir el título extraído
        parsedOptions: options,
        correctanswerindex,
        parsedExplanation: explanation
      };
    } catch (error) {
      console.error('Error parsing GIFT:', error);
      return null;
    }
  };

  // 🔥 RE-PARSE automático cuando cambia el contenido GIFT
  useEffect(() => {
    const parsed = parseGiftContent(formData.giftContent);
    if (parsed) {
      setParsedData(parsed);
    }
  }, [formData.giftContent]);

  const handleSave = () => {
    // 🔥 USAR LOS DATOS PARSEADOS REACTIVOS (actualizados automáticamente)
    if (!parsedData.questionText || parsedData.parsedOptions.length < 2) {
      alert('Error: La pregunta debe tener texto y al menos 2 opciones.');
      return;
    }

    // ✅ VALIDACIÓN ESPECÍFICA: Solo la pregunta, no todo el contenido GIFT
    if (parsedData.questionText.length > 300) {
      alert(`Error: La pregunta no puede superar 300 caracteres (actual: ${parsedData.questionText.length}). Reduce el texto de la pregunta.`);
      return;
    }

    // ✅ VALIDACIÓN DE OPCIONES: Cada opción máximo 150 caracteres (límite Telegram)
    for (let i = 0; i < parsedData.parsedOptions.length; i++) {
      if (parsedData.parsedOptions[i].length > 150) {
        alert(`Error: La opción ${i + 1} no puede superar 150 caracteres (actual: ${parsedData.parsedOptions[i].length}). Reduce el texto de esta opción.`);
        return;
      }
    }

    // ✅ VALIDACIÓN DE EXPLICACIÓN: Máximo 200 caracteres si existe
    if (parsedData.parsedExplanation && parsedData.parsedExplanation.length > 200) {
      alert(`Error: La explicación no puede superar 200 caracteres (actual: ${parsedData.parsedExplanation.length}). Reduce el texto de la explicación.`);
      return;
    }

    // 🔥 ENVIAR LOS DATOS PARSEADOS REACTIVOS QUE INCLUYEN EL TÍTULO ACTUALIZADO
    onSave({
      ...parsedData, // 🔥 INCLUYE questionTitle actualizado automáticamente
      type: formData.type,
      difficulty: formData.difficulty,
      bloomLevel: formData.bloomLevel,
      isActive: formData.isActive
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-background border border-border rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Editor GIFT - Edición Directa</h2>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              ✕
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Edita directamente en formato GIFT. Usa = para respuesta correcta, ~ para incorrectas.
          </p>
          {/* 🔥 MENSAJE INFORMATIVO PARA PREGUNTAS CATEGORIZADAS */}
          {question.source && ['Pdc', 'Onu', 'Otan', 'Osce', 'Ue', 'Constitucion', 'DefensaNacional', 'Rio', 'Minsdef', 'OrganizacionFas', 'Emad', 'Et', 'Armada', 'Aire', 'Carrera', 'Tropa', 'Rroo', 'DerechosYDeberes', 'RegimenDisciplinario', 'IniciativasQuejas', 'Igualdad', 'Omi', 'Pac', 'SeguridadNacional', 'MisionesInternacionales'].includes(question.source) && (
            <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-start gap-2">
                <span className="text-amber-600 dark:text-amber-400">ℹ️</span>
                <div className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Nota:</strong> Esta pregunta proviene de una tabla categorizada ({question.source}) que <strong>no incluye retroalimentación original</strong>. 
                  <br />
                  <strong>Puedes agregar retroalimentación manualmente</strong> usando la sintaxis: 
                  <code className="bg-amber-100 dark:bg-amber-800 px-1 rounded text-xs">#### RETROALIMENTACIÓN: <br />Texto explicativo aquí...</code>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex-1 p-6 space-y-4 overflow-y-auto">
          <div className="space-y-2">
            <label className="block text-sm font-medium">Contenido GIFT:</label>
            <textarea
              value={formData.giftContent}
              onChange={(e) => setFormData(prev => ({ ...prev, giftContent: e.target.value }))}
              rows={15}
              className="w-full p-3 border rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              placeholder={`Ejemplo:
¿Cuál es la capital de España? {
=Madrid
~Barcelona
~Valencia
~Sevilla
}

// Explicación:
// Madrid es la capital de España desde 1561...`}
            />
            
            {/* ✅ CONTADOR DE CARACTERES EN TIEMPO REAL */}
            {(() => {
              const parsed = parseGiftContent(formData.giftContent);
              if (!parsed) return null;
              
              const questionLength = parsed.questionText?.length || 0;
              const maxOptionLength = Math.max(...(parsed.parsedOptions?.map(opt => opt.length) || [0]));
              const explanationLength = parsed.parsedExplanation?.length || 0;
              
              return (
                <div className="grid grid-cols-3 gap-4 p-3 bg-muted/50 rounded-lg text-xs">
                  <div className={`flex flex-col ${questionLength > 300 ? 'text-red-600' : questionLength > 250 ? 'text-orange-600' : 'text-green-600'}`}>
                    <span className="font-medium">📝 Pregunta</span>
                    <span>{questionLength}/300 caracteres</span>
                    {questionLength > 300 && <span className="text-red-600">⚠️ Excede límite</span>}
                  </div>
                  
                  <div className={`flex flex-col ${maxOptionLength > 150 ? 'text-red-600' : maxOptionLength > 120 ? 'text-orange-600' : 'text-green-600'}`}>
                    <span className="font-medium">✅ Opción más larga</span>
                    <span>{maxOptionLength}/150 caracteres</span>
                    {maxOptionLength > 150 && <span className="text-red-600">⚠️ Excede límite</span>}
                  </div>
                  
                  <div className={`flex flex-col ${explanationLength > 200 ? 'text-red-600' : explanationLength > 160 ? 'text-orange-600' : 'text-green-600'}`}>
                    <span className="font-medium">💡 Explicación</span>
                    <span>{explanationLength}/200 caracteres</span>
                    {explanationLength > 200 && <span className="text-red-600">⚠️ Excede límite</span>}
                  </div>
                </div>
              );
            })()}
            
            <div className="text-xs text-muted-foreground">
              <strong>Sintaxis:</strong> = respuesta correcta | ~ respuestas incorrectas | // comentarios
              <br />
              <strong>Límites Telegram:</strong> Pregunta (300), Opciones (150), Explicación (200)
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tipo</label>
              <Input
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Dificultad</label>
              <select 
                value={formData.difficulty} 
                onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value }))}
                className="select w-full"
              >
                <option value="easy">Fácil</option>
                <option value="medium">Medio</option>
                <option value="hard">Difícil</option>
                <option value="unknown">Desconocido</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
            />
            <label htmlFor="isActive" className="text-sm font-medium">Pregunta activa</label>
          </div>
        </div>

        <div className="p-6 border-t bg-muted/20">
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              💡 <strong>Tip:</strong> El formato se valida automáticamente al guardar
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                💾 Guardar GIFT
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}