'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { 
  Users, 
  MessageSquare, 
  BarChart3, 
  Trophy, 
  TrendingUp, 
  Activity,
  Clock,
  Target,
  Zap,
  Award,
  Settings,
  Play,
  Pause,
  RotateCw
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  totalPolls: number;
  totalResponses: number;
  recentActivity: {
    pollsSent: number;
    responsesReceived: number;
  };
  topUsers: Array<{
    name: string;
    points: number;
    level: number;
    responses: number;
  }>;
  systemHealth: {
    database: boolean;
    webhook: boolean;
    telegram: boolean;
  };
}

interface SchedulerConfig {
  notifications: {
    enabled: boolean;
    intervalHours: number;
  };
  dailyPolls: {
    enabled: boolean;
    frequency: string;
    customMinutes?: number;
    startHour?: number;
    startMinute?: number;
    endHour?: number;
    endMinute?: number;
  };
  monitoring: {
    enabled: boolean;
    intervalMinutes: number;
  };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [schedulerConfig, setSchedulerConfig] = useState<SchedulerConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [configLoading, setConfigLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    fetchStats();
    fetchSchedulerConfig();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats');
      const data = await response.json();
      setStats(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoading(false);
    }
  };

  const fetchSchedulerConfig = async () => {
    try {
      const response = await fetch('/api/scheduler/config');
      const data = await response.json();
      if (data.success) {
        setSchedulerConfig(data.config);
      }
    } catch (error) {
      console.error('Error fetching scheduler config:', error);
    }
  };

  const updateSchedulerConfig = async (newConfig: Partial<SchedulerConfig>) => {
    setConfigLoading(true);
    try {
      const response = await fetch('/api/scheduler/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });
      
      const result = await response.json();
      if (result.success) {
        setSchedulerConfig(result.config);
        alert('✅ ' + result.message);
      } else {
        alert('❌ Error: ' + result.error);
      }
    } catch (error) {
      console.error('Error updating config:', error);
      alert('❌ Error actualizando configuración');
    }
    setConfigLoading(false);
  };

  const reloadSchedulerConfig = async () => {
    setConfigLoading(true);
    try {
      const response = await fetch('/api/scheduler/reload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const result = await response.json();
      if (result.success) {
        alert('✅ ' + result.message);
      } else {
        alert('❌ Error: ' + result.error);
      }
    } catch (error) {
      console.error('Error reloading config:', error);
      alert('❌ Error recargando configuración');
    }
    setConfigLoading(false);
  };

  const handleFrequencyChange = (frequency: string, customMinutes?: number) => {
    updateSchedulerConfig({
      dailyPolls: {
        enabled: true,
        frequency,
        customMinutes,
        ...schedulerConfig?.dailyPolls
      }
    });
  };

  const handleScheduleTimeChange = (timeType: 'start' | 'end', hour: number, minute: number = 0) => {
    updateSchedulerConfig({
      dailyPolls: {
        ...schedulerConfig?.dailyPolls,
        [`${timeType}Hour`]: hour,
        [`${timeType}Minute`]: minute
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard de Gamificación</h1>
          <p className="text-gray-600">Sistema de polls y gamificación para Telegram</p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-4">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'dashboard' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => setActiveTab('scheduler')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'scheduler' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              ⚙️ Configuración
            </button>
          </nav>
        </div>

        {activeTab === 'dashboard' && (
          <>
            {/* System Health */}
            <div className="mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Estado del Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <Badge variant={stats?.systemHealth?.database ? "default" : "destructive"}>
                      {stats?.systemHealth?.database ? "✅" : "❌"} Base de Datos
                    </Badge>
                    <Badge variant={stats?.systemHealth?.webhook ? "default" : "destructive"}>
                      {stats?.systemHealth?.webhook ? "✅" : "❌"} Webhook
                    </Badge>
                    <Badge variant={stats?.systemHealth?.telegram ? "default" : "destructive"}>
                      {stats?.systemHealth?.telegram ? "✅" : "❌"} Bot Telegram
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                  <p className="text-xs text-muted-foreground">Registrados en el sistema</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Polls Enviados</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalPolls || 0}</div>
                  <p className="text-xs text-muted-foreground">Preguntas publicadas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Respuestas</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalResponses || 0}</div>
                  <p className="text-xs text-muted-foreground">Participaciones totales</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Actividad Reciente</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.recentActivity?.responsesReceived || 0}</div>
                  <p className="text-xs text-muted-foreground">Respuestas últimas 24h</p>
                </CardContent>
              </Card>
            </div>

            {/* Top Users */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Ranking de Usuarios
                </CardTitle>
                <CardDescription>Top usuarios más activos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.topUsers?.map((user, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="text-lg font-bold text-gray-500">#{index + 1}</div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-gray-600">Nivel {user.level} • {user.responses} respuestas</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-600">{user.points} pts</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === 'scheduler' && schedulerConfig && (
          <div className="space-y-6">
            {/* Poll Frequency Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Frecuencia de Polls
                </CardTitle>
                <CardDescription>Configura cada cuánto tiempo se envían preguntas automáticamente</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    variant={schedulerConfig.dailyPolls.frequency === 'daily' ? 'primary' : 'outline'}
                    onClick={() => handleFrequencyChange('daily')}
                    disabled={configLoading}
                    className="h-16 text-left flex-col items-start justify-center"
                  >
                    <div className="font-semibold">📅 Diario</div>
                    <div className="text-sm opacity-70">Una vez al día (9:00 AM)</div>
                  </Button>
                  
                  <Button
                    variant={schedulerConfig.dailyPolls.frequency === 'hourly' ? 'primary' : 'outline'}
                    onClick={() => handleFrequencyChange('hourly')}
                    disabled={configLoading}
                    className="h-16 text-left flex-col items-start justify-center"
                  >
                    <div className="font-semibold">⏰ Cada Hora</div>
                    <div className="text-sm opacity-70">24 veces al día</div>
                  </Button>
                  
                  <Button
                    variant={schedulerConfig.dailyPolls.frequency === 'custom' ? 'primary' : 'outline'}
                    onClick={() => handleFrequencyChange('custom', schedulerConfig.dailyPolls.customMinutes)}
                    disabled={configLoading}
                    className="h-16 text-left flex-col items-start justify-center"
                  >
                    <div className="font-semibold">🎛️ Personalizado</div>
                    <div className="text-sm opacity-70">
                      {schedulerConfig.dailyPolls.customMinutes && schedulerConfig.dailyPolls.customMinutes < 60 
                        ? `Cada ${schedulerConfig.dailyPolls.customMinutes} min`
                        : `Cada ${Math.floor((schedulerConfig.dailyPolls.customMinutes || 60) / 60)} hora(s)`
                      }
                    </div>
                  </Button>
                </div>

                {/* Custom Frequency Controls */}
                {schedulerConfig.dailyPolls.frequency === 'custom' && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-3">Frecuencia Personalizada</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {[1, 5, 10, 15, 30, 60, 120, 240].map((minutes) => (
                        <Button
                          key={minutes}
                          variant={schedulerConfig.dailyPolls.customMinutes === minutes ? 'primary' : 'outline'}
                          size="sm"
                          onClick={() => handleFrequencyChange('custom', minutes)}
                          disabled={configLoading}
                        >
                          {minutes < 60 ? `${minutes}min` : `${minutes/60}h`}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Schedule Time Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Horarios de Envío
                </CardTitle>
                <CardDescription>Configura las horas de inicio y pausa de envío de preguntas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Hora de Inicio */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-green-700">🟢 Hora de Inicio</h4>
                    <div className="grid grid-cols-4 gap-2">
                      {Array.from({ length: 24 }, (_, i) => (
                        <Button
                          key={i}
                          variant={(schedulerConfig.dailyPolls.startHour ?? 8) === i ? 'primary' : 'outline'}
                          size="sm"
                          onClick={() => handleScheduleTimeChange('start', i)}
                          disabled={configLoading}
                        >
                          {i.toString().padStart(2, '0')}:00
                        </Button>
                      ))}
                    </div>
                    <p className="text-sm text-gray-600">
                      Inicio actual: <strong>{(schedulerConfig.dailyPolls.startHour ?? 8).toString().padStart(2, '0')}:00</strong>
                    </p>
                  </div>

                  {/* Hora de Pausa */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-red-700">🔴 Hora de Pausa</h4>
                    <div className="grid grid-cols-4 gap-2">
                      {Array.from({ length: 24 }, (_, i) => (
                        <Button
                          key={i}
                          variant={(schedulerConfig.dailyPolls.endHour ?? 22) === i ? 'primary' : 'outline'}
                          size="sm"
                          onClick={() => handleScheduleTimeChange('end', i)}
                          disabled={configLoading}
                        >
                          {i.toString().padStart(2, '0')}:00
                        </Button>
                      ))}
                    </div>
                    <p className="text-sm text-gray-600">
                      Pausa actual: <strong>{(schedulerConfig.dailyPolls.endHour ?? 22).toString().padStart(2, '0')}:00</strong>
                    </p>
                  </div>
                </div>

                {/* Resumen del horario */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">📅 Resumen del Horario</h4>
                  <div className="text-sm text-blue-700">
                    <p><strong>Periodo activo:</strong> {(schedulerConfig.dailyPolls.startHour ?? 8).toString().padStart(2, '0')}:00 - {(schedulerConfig.dailyPolls.endHour ?? 22).toString().padStart(2, '0')}:00</p>
                    <p><strong>Periodo de pausa:</strong> {(schedulerConfig.dailyPolls.endHour ?? 22).toString().padStart(2, '0')}:00 - {(schedulerConfig.dailyPolls.startHour ?? 8).toString().padStart(2, '0')}:00</p>
                    <p className="mt-2">
                      ⏰ Durante el <strong>periodo activo</strong>, las preguntas se enviarán según la frecuencia configurada.
                      <br />
                      😴 Durante el <strong>periodo de pausa</strong>, no se enviarán preguntas automáticamente.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notifications Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Notificaciones Inteligentes
                </CardTitle>
                <CardDescription>Sistema de notificaciones contextuales para usuarios</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Estado: {schedulerConfig.notifications.enabled ? '✅ Activo' : '❌ Inactivo'}</p>
                    <p className="text-sm text-gray-600">Frecuencia: Cada {schedulerConfig.notifications.intervalHours} horas</p>
                  </div>
                  <Button
                    variant={schedulerConfig.notifications.enabled ? 'destructive' : 'primary'}
                    onClick={() => updateSchedulerConfig({
                      notifications: { ...schedulerConfig.notifications, enabled: !schedulerConfig.notifications.enabled }
                    })}
                    disabled={configLoading}
                  >
                    {schedulerConfig.notifications.enabled ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                    {schedulerConfig.notifications.enabled ? 'Pausar' : 'Activar'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* System Control */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Control del Sistema
                </CardTitle>
                <CardDescription>Acciones de administración del scheduler</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-green-800">
                    ✅ <strong>¡Novedad!</strong> Los cambios de configuración ahora se aplican automáticamente. El scheduler detecta cambios y se recarga sin necesidad de reiniciar manualmente.
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 mb-3">Control avanzado:</p>
                  <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-sm">
                    <p># Ver estado del scheduler:</p>
                    <p>npx tsx scripts/notification-scheduler.ts --status</p>
                    <p># Forzar recarga manual (opcional):</p>
                    <p>npx tsx scripts/notification-scheduler.ts --reload</p>
                  </div>
                  <div className="mt-4">
                    <Button
                      variant="primary"
                      onClick={reloadSchedulerConfig}
                      disabled={configLoading}
                    >
                      <RotateCw className="h-4 w-4 mr-2" />
                      {configLoading ? 'Recargando...' : 'Forzar Recarga Manual'}
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">
                      Solo usar si los cambios automáticos no se detectan
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
} 