'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import {
  Activity,
  Trophy,
  Users,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Calendar,
  Plus,
  Settings,
  BarChart3,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  FileText,
  AlertCircle,
  CheckCircle,
  Timer
} from 'lucide-react';

interface Tournament {
  id: string;
  name: string;
  description?: string;
  totalQuestions: number;
  duration: number;
  startTime: string;
  endTime?: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  participants: number;
  questions: TournamentQuestion[];
  createdAt: string;
}

interface TournamentQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctOption: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  points: number;
}

interface CreateTournamentData {
  name: string;
  description: string;
  totalQuestions: number;
  duration: number; // en minutos
  startTime: string;
  questionCategory: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  examSource: 'both' | '2018' | '2024';
}

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [createData, setCreateData] = useState<CreateTournamentData>({
    name: '',
    description: '',
    totalQuestions: 5,
    duration: 10,
    startTime: '',
    questionCategory: 'mixed',
    difficulty: 'mixed',
    examSource: 'both'
  });
  const [stats, setStats] = useState({
    totalTournaments: 0,
    activeTournaments: 0,
    totalParticipants: 0,
    averageScore: 0
  });
  const [deletingTournament, setDeletingTournament] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [startingTournament, setStartingTournament] = useState<string | null>(null);
  const [stoppingTournament, setStoppingTournament] = useState<string | null>(null);

  useEffect(() => {
    fetchTournaments();
    fetchStats();
  }, []);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/tournaments');
      if (response.ok) {
        const data = await response.json();
        setTournaments(data);
      }
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/tournaments/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching tournament stats:', error);
    }
  };

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🎯 INICIANDO CREACIÓN DE TORNEO');
    console.log('📤 Datos a enviar:', createData);
    
    try {
      const response = await fetch('/api/admin/tournaments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createData),
      });

      console.log('📨 Respuesta recibida:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (response.ok) {
        const newTournament = await response.json();
        console.log('✅ Torneo creado exitosamente:', newTournament);
        
        setTournaments([...tournaments, newTournament]);
        setShowCreateForm(false);
        setCreateData({
          name: '',
          description: '',
          totalQuestions: 5,
          duration: 10,
          startTime: '',
          questionCategory: 'mixed',
          difficulty: 'mixed',
          examSource: 'both'
        });
        await fetchStats();
        
        alert(`✅ Torneo "${newTournament.name}" creado exitosamente!`);
      } else {
        const errorData = await response.text();
        console.error('❌ Error del servidor:', {
          status: response.status,
          statusText: response.statusText,
          body: errorData
        });
        
        try {
          const errorJson = JSON.parse(errorData);
          alert(`❌ Error: ${errorJson.error || errorJson.message || 'Error desconocido'}`);
        } catch {
          alert(`❌ Error del servidor (${response.status}): ${response.statusText}`);
        }
      }
    } catch (error) {
      console.error('💥 Error de red/conexión:', error);
      alert(`💥 Error de conexión: ${error.message}`);
    }
  };

  const handleStartTournament = async (tournamentId: string) => {
    try {
      setStartingTournament(tournamentId);
      console.log('🚀 Iniciando torneo...');
      
      const response = await fetch(`/api/admin/tournaments/${tournamentId}/start`, {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Torneo iniciado:', result.message);
        
        // Actualizar inmediatamente el estado local
        setTournaments(prev => prev.map(t => 
          t.id === tournamentId 
            ? { ...t, status: 'active' as const }
            : t
        ));
        
        // Luego actualizar con datos frescos del servidor
        await fetchTournaments();
        await fetchStats();
      } else {
        const error = await response.json();
        console.error('❌ Error iniciando torneo:', error.error);
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error starting tournament:', error);
      alert('Error inesperado al iniciar el torneo');
    } finally {
      setStartingTournament(null);
    }
  };

  const handleStopTournament = async (tournamentId: string) => {
    try {
      setStoppingTournament(tournamentId);
      console.log('🛑 Deteniendo torneo...');
      
      const response = await fetch(`/api/admin/tournaments/${tournamentId}/stop`, {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Torneo detenido:', result.message);
        
        // Actualizar inmediatamente el estado local
        setTournaments(prev => prev.map(t => 
          t.id === tournamentId 
            ? { ...t, status: 'completed' as const }
            : t
        ));
        
        // Luego actualizar con datos frescos del servidor
        await fetchTournaments();
        await fetchStats();
      } else {
        const error = await response.json();
        console.error('❌ Error deteniendo torneo:', error.error);
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error stopping tournament:', error);
      alert('Error inesperado al detener el torneo');
    } finally {
      setStoppingTournament(null);
    }
  };

  const handleDeleteTournament = async (tournamentId: string) => {
    try {
      setDeletingTournament(tournamentId);
      const response = await fetch(`/api/admin/tournaments/${tournamentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Torneo eliminado:', result.message);
        
        // Actualizar la lista local eliminando el torneo
        setTournaments(prev => prev.filter(t => t.id !== tournamentId));
        
        // Actualizar estadísticas
        await fetchStats();
        
        // Cerrar modal de confirmación
        setShowDeleteConfirm(null);
      } else {
        const error = await response.json();
        console.error('❌ Error eliminando torneo:', error.error);
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting tournament:', error);
      alert('Error inesperado al eliminar el torneo');
    } finally {
      setDeletingTournament(null);
    }
  };

  const getStatusBadge = (status: Tournament['status']) => {
    const variants = {
      draft: { variant: 'secondary' as const, icon: FileText, text: 'Borrador' },
      active: { variant: 'default' as const, icon: Play, text: 'Activo' },
      completed: { variant: 'outline' as const, icon: CheckCircle, text: 'Completado' },
      cancelled: { variant: 'destructive' as const, icon: AlertCircle, text: 'Cancelado' }
    };
    
    const config = variants[status];
    const IconComponent = config.icon;
    
    return (
      <Badge variant={config.variant}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (selectedTournament) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            onClick={() => setSelectedTournament(null)}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{selectedTournament.name}</h1>
            <p className="text-muted-foreground">Detalles del torneo</p>
          </div>
          {getStatusBadge(selectedTournament.status)}
        </div>

        {/* Tournament Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información General</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Descripción</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedTournament.description || 'Sin descripción'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Duración</Label>
                    <p className="text-sm">{selectedTournament.duration} minutos</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Total de Preguntas</Label>
                    <p className="text-sm">{selectedTournament.totalQuestions}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Participantes</Label>
                    <p className="text-sm">{selectedTournament.participants}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Fecha de Inicio</Label>
                    <p className="text-sm">{formatDateTime(selectedTournament.startTime)}</p>
                  </div>
                  {selectedTournament.endTime && (
                    <div>
                      <Label className="text-sm font-medium">Fecha de Fin</Label>
                      <p className="text-sm">{formatDateTime(selectedTournament.endTime)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Questions */}
            <Card>
              <CardHeader>
                <CardTitle>Preguntas del Torneo</CardTitle>
                <CardDescription>
                  {selectedTournament.questions?.length || 0} preguntas configuradas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedTournament.questions?.length > 0 ? (
                  <div className="space-y-4">
                    {selectedTournament.questions.map((question, index) => (
                      <div key={question.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium">Pregunta {index + 1}</h4>
                          <div className="flex gap-2">
                            <Badge variant="outline" className="text-xs">
                              {question.difficulty}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {question.points} pts
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {question.questionText}
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {question.options.map((option, optIndex) => (
                            <div 
                              key={optIndex}
                              className={`p-2 rounded border ${
                                optIndex === question.correctOption 
                                  ? 'bg-green-50 border-green-200 text-green-800' 
                                  : 'bg-gray-50 border-gray-200'
                              }`}
                            >
                              {String.fromCharCode(65 + optIndex)}) {option}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No hay preguntas configuradas para este torneo
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Actions Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Acciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedTournament.status === 'draft' && (
                  <Button 
                    onClick={() => handleStartTournament(selectedTournament.id)}
                    className="w-full"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Iniciar Torneo
                  </Button>
                )}
                
                {selectedTournament.status === 'active' && (
                  <Button 
                    onClick={() => handleStopTournament(selectedTournament.id)}
                    variant="destructive"
                    className="w-full"
                  >
                    <Pause className="w-4 h-4 mr-2" />
                    Detener Torneo
                  </Button>
                )}

                <Button variant="outline" className="w-full">
                  <Edit className="w-4 h-4 mr-2" />
                  Editar Torneo
                </Button>

                <Button variant="outline" className="w-full">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Ver Estadísticas
                </Button>

                <Button variant="outline" className="w-full">
                  <Users className="w-4 h-4 mr-2" />
                  Ver Participantes
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estado del Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Monitor:</span>
                    <Badge variant="outline" className="text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Activo
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Webhook:</span>
                    <Badge variant="outline" className="text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Activo
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Bot Telegram:</span>
                    <Badge variant="outline" className="text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Conectado
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
            <Trophy className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestión de Torneos</h1>
            <p className="text-muted-foreground">Crear y administrar torneos de Telegram</p>
          </div>
        </div>
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Crear Torneo
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Torneos</p>
                <p className="text-2xl font-bold">{stats.totalTournaments}</p>
              </div>
              <Trophy className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Torneos Activos</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeTournaments}</p>
              </div>
              <Activity className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Participantes</p>
                <p className="text-2xl font-bold">{stats.totalParticipants}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Puntuación Media</p>
                <p className="text-2xl font-bold">{stats.averageScore.toFixed(1)}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Tournament Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Crear Nuevo Torneo</CardTitle>
            <CardDescription>
              Configura los parámetros del torneo de preguntas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTournament} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del Torneo</Label>
                  <Input
                    id="name"
                    value={createData.name}
                    onChange={(e) => setCreateData({...createData, name: e.target.value})}
                    placeholder="Ej: Torneo LPACAP - Enero 2024"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startTime">Fecha y Hora de Inicio</Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={createData.startTime}
                    onChange={(e) => setCreateData({...createData, startTime: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalQuestions">Número de Preguntas</Label>
                  <Select 
                    value={createData.totalQuestions.toString()} 
                    onValueChange={(value) => setCreateData({...createData, totalQuestions: parseInt(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 preguntas</SelectItem>
                      <SelectItem value="5">5 preguntas</SelectItem>
                      <SelectItem value="10">10 preguntas</SelectItem>
                      <SelectItem value="15">15 preguntas</SelectItem>
                      <SelectItem value="20">20 preguntas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duración (minutos)</Label>
                  <Select 
                    value={createData.duration.toString()} 
                    onValueChange={(value) => setCreateData({...createData, duration: parseInt(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 minutos</SelectItem>
                      <SelectItem value="10">10 minutos</SelectItem>
                      <SelectItem value="15">15 minutos</SelectItem>
                      <SelectItem value="20">20 minutos</SelectItem>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="60">60 minutos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="questionCategory">Categoría de Preguntas</Label>
                  <Select 
                    value={createData.questionCategory} 
                    onValueChange={(value) => setCreateData({...createData, questionCategory: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mixed">Todas las Categorías (Mixto)</SelectItem>
                      <SelectItem value="LPACAP">LPACAP</SelectItem>
                      <SelectItem value="OFICIAL">Preguntas Oficiales</SelectItem>
                      <SelectItem value="CONSTITUCIONAL">Derecho Constitucional</SelectItem>
                      <SelectItem value="ADMINISTRATIVO">Derecho Administrativo</SelectItem>
                      <SelectItem value="PENAL">Derecho Penal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="difficulty">Nivel de Dificultad</Label>
                  <Select 
                    value={createData.difficulty} 
                    onValueChange={(value) => setCreateData({...createData, difficulty: value as any})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Fácil</SelectItem>
                      <SelectItem value="medium">Medio</SelectItem>
                      <SelectItem value="hard">Difícil</SelectItem>
                      <SelectItem value="mixed">Mixto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="examSource">Fuente de Preguntas</Label>
                  <Select 
                    value={createData.examSource} 
                    onValueChange={(value) => setCreateData({...createData, examSource: value as any})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="both">Ambos Exámenes (2018 + 2024)</SelectItem>
                      <SelectItem value="2018">Solo Examen Oficial 2018</SelectItem>
                      <SelectItem value="2024">Solo Examen Oficial 2024</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción (Opcional)</Label>
                <Textarea
                  id="description"
                  value={createData.description}
                  onChange={(e) => setCreateData({...createData, description: e.target.value})}
                  placeholder="Descripción del torneo, reglas especiales, etc."
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Crear Torneo
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tournaments List */}
      <Card>
        <CardHeader>
          <CardTitle>Torneos Existentes</CardTitle>
          <CardDescription>
            Gestiona y monitorea todos los torneos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : tournaments.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay torneos</h3>
              <p className="text-muted-foreground mb-4">
                Crea tu primer torneo para empezar
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Primer Torneo
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {tournaments.map((tournament) => (
                <div 
                  key={tournament.id} 
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedTournament(tournament)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{tournament.name}</h3>
                      {getStatusBadge(tournament.status)}
                    </div>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {tournament.status === 'draft' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleStartTournament(tournament.id)}
                          className="text-green-600 hover:text-green-700"
                          disabled={startingTournament === tournament.id}
                        >
                          {startingTournament === tournament.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                      
                      {tournament.status === 'active' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleStopTournament(tournament.id)}
                          className="text-orange-600 hover:text-orange-700"
                          disabled={stoppingTournament === tournament.id}
                        >
                          {stoppingTournament === tournament.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                          ) : (
                            <Timer className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                      
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      
                      {tournament.status !== 'active' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setShowDeleteConfirm(tournament.id)}
                          className="text-red-600 hover:text-red-700"
                          disabled={deletingTournament === tournament.id}
                        >
                          {deletingTournament === tournament.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Preguntas:</span>
                      <span className="ml-2 font-medium">{tournament.totalQuestions}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Duración:</span>
                      <span className="ml-2 font-medium">{tournament.duration}min</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Participantes:</span>
                      <span className="ml-2 font-medium">{tournament.participants}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Inicio:</span>
                      <span className="ml-2 font-medium">
                        {formatDateTime(tournament.startTime)}
                      </span>
                    </div>
                  </div>
                  
                  {tournament.description && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {tournament.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Confirmación de Eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="w-5 h-5" />
                Confirmar Eliminación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                ¿Estás seguro de que quieres eliminar este torneo? Esta acción no se puede deshacer.
              </p>
              
              {(() => {
                const tournament = tournaments.find(t => t.id === showDeleteConfirm);
                return tournament ? (
                  <div className="border rounded-lg p-3 bg-muted">
                    <p className="font-medium">{tournament.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {tournament.participants} participantes • {tournament.totalQuestions} preguntas
                    </p>
                    {tournament.status === 'active' && (
                      <p className="text-sm text-red-600 font-medium mt-1">
                        ⚠️ Este torneo está activo
                      </p>
                    )}
                  </div>
                ) : null;
              })()}
              
              <div className="flex gap-3 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setShowDeleteConfirm(null)}
                  disabled={deletingTournament === showDeleteConfirm}
                >
                  Cancelar
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    if (showDeleteConfirm) {
                      handleDeleteTournament(showDeleteConfirm);
                    }
                  }}
                  disabled={deletingTournament === showDeleteConfirm}
                  className="flex items-center gap-2"
                >
                  {deletingTournament === showDeleteConfirm ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Eliminar Torneo
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}