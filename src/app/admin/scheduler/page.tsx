'use client';

import { useState, useEffect } from 'react';
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
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { cn } from '@/lib/utils';
import {
  Clock,
  Bell,
  PlayCircle,
  PauseCircle,
  Settings,
  Activity,
  Calendar,
  ArrowLeft,
  Info,
  Send,
  RefreshCw,
  Monitor,
  Timer,
  Zap,
  CheckCircle,
  XCircle,
  Trophy
} from 'lucide-react';
import Link from 'next/link';

interface SchedulerConfig {
  notifications: {
    enabled: boolean;
    intervalHours: number;
    enabledRules: string[];
  };
  dailyPolls: {
    enabled: boolean;
    time: string; // formato cron
    frequency?: string;
    customMinutes?: number;
    startHour?: number;
    startMinute?: number;
    endHour?: number;
    endMinute?: number;
    questionsPerSend?: number;
  };
  monitoring: {
    enabled: boolean;
    intervalMinutes: number;
  };
  rankings?: {
    general?: {
      enabled: boolean;
      frequency: string;
      cronExpression: string;
      topUsersCount: number;
      showFailStats: boolean;
      includeWeeklyStats: boolean;
      showAccuracy: boolean;
      showAverageTime: boolean;
      includeMemes: boolean;
    };
    weekly?: {
      enabled: boolean;
      frequency: string;
      cronExpression: string;
      topUsersCount: number;
      showAccuracy: boolean;
      showAverageTime: boolean;
      includeMemes: boolean;
      showComparison: boolean;
    };
  };
}

const CRON_PRESETS = [
  { value: '*/5 * * * *', label: 'Cada 5 minutos', minutes: 5 },
  { value: '*/10 * * * *', label: 'Cada 10 minutos', minutes: 10 },
  { value: '*/15 * * * *', label: 'Cada 15 minutos', minutes: 15 },
  { value: '*/30 * * * *', label: 'Cada 30 minutos', minutes: 30 },
  { value: '0 * * * *', label: 'Cada hora', minutes: 60 },
  { value: '0 */2 * * * *', label: 'Cada 2 horas', minutes: 120 },
  { value: '0 */4 * * * *', label: 'Cada 4 horas', minutes: 240 },
  { value: '0 9 * * *', label: 'Diario a las 9:00 AM', minutes: 1440 },
  { value: '0 12 * * *', label: 'Diario a las 12:00 PM', minutes: 1440 },
  { value: '0 18 * * *', label: 'Diario a las 6:00 PM', minutes: 1440 }
];

const RANKING_FREQUENCY_PRESETS = [
  { key: 'test', label: 'Test (cada 3 min)', cron: '*/3 * * * *', description: 'Solo para pruebas' },
  { key: 'hourly', label: 'Cada hora', cron: '0 * * * *', description: 'Frecuencia alta' },
  { key: 'every3h', label: 'Cada 3 horas', cron: '0 */3 * * *', description: 'Frecuencia media-alta' },
  { key: 'every4h', label: 'Cada 4 horas', cron: '0 */4 * * *', description: 'Recomendado ⭐' },
  { key: 'every6h', label: 'Cada 6 horas', cron: '0 */6 * * *', description: 'Frecuencia media' },
  { key: 'daily', label: 'Diario (2:00 PM)', cron: '0 14 * * *', description: 'Una vez al día' },
  { key: 'evening', label: 'Diario (8:00 PM)', cron: '0 20 * * *', description: 'Por la noche' },
  { key: 'weekly', label: 'Semanal (Lunes 12:00 PM)', cron: '0 12 * * 1', description: 'Una vez por semana' }
];

const NOTIFICATION_RULES = [
  { id: 'streak_encouragement', label: 'Motivación de Rachas', description: 'Motiva usuarios con rachas activas' },
  { id: 'level_celebration', label: 'Celebración de Niveles', description: 'Celebra cuando usuarios suben de nivel' },
  { id: 'inactive_users', label: 'Usuarios Inactivos', description: 'Re-engancha usuarios inactivos' },
  { id: 'high_performers', label: 'Alto Rendimiento', description: 'Reconoce usuarios destacados' },
  { id: 'close_competition', label: 'Competencia Cercana', description: 'Notifica competencia entre usuarios' }
];

export default function SchedulerPage() {
  const [config, setConfig] = useState<SchedulerConfig>({
    notifications: {
      enabled: true,
      intervalHours: 4,
      enabledRules: ['streak_encouragement', 'level_celebration']
    },
    dailyPolls: {
      enabled: true,
      time: '*/30 * * * *',
      frequency: 'custom',
      customMinutes: 30,
      startHour: 7,
      startMinute: 0,
      endHour: 23,
      endMinute: 0,
      questionsPerSend: 1
    },
    monitoring: {
      enabled: true,
      intervalMinutes: 30
    },
    rankings: {
      general: {
        enabled: true,
        frequency: 'every4h',
        cronExpression: '0 */4 * * *',
        topUsersCount: 8,
        showFailStats: true,
        includeWeeklyStats: true,
        showAccuracy: true,
        showAverageTime: true,
        includeMemes: true
      },
      weekly: {
        enabled: true,
        frequency: 'every4h',
        cronExpression: '0 */4 * * *',
        topUsersCount: 8,
        showAccuracy: true,
        showAverageTime: true,
        includeMemes: true,
        showComparison: true
      }
    }
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [customCron, setCustomCron] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      // Cargar desde scheduler-config.json
      const response = await fetch('/api/scheduler/config');
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
        setCustomCron(data.dailyPolls.time || '');
      }
    } catch (error) {
      console.error('Error loading scheduler config:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/scheduler/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      if (response.ok) {
        console.log('✅ Configuración del scheduler guardada');
        // El notification-scheduler.ts detectará el cambio automáticamente
      } else {
        console.error('Error saving scheduler config');
      }
    } catch (error) {
      console.error('Error saving scheduler config:', error);
    } finally {
      setSaving(false);
    }
  };

  const testTask = async (taskName: string) => {
    setTesting(true);
    try {
      const response = await fetch('/api/scheduler/run-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: taskName })
      });
      
      if (response.ok) {
        console.log(`✅ Tarea ${taskName} ejecutada exitosamente`);
      } else {
        console.error(`Error ejecutando tarea ${taskName}`);
      }
    } catch (error) {
      console.error('Error testing task:', error);
    } finally {
      setTesting(false);
    }
  };

  const updatePollTime = (cronExpression: string) => {
    const preset = CRON_PRESETS.find(p => p.value === cronExpression);
    setConfig(prev => ({
      ...prev,
      dailyPolls: {
        ...prev.dailyPolls,
        time: cronExpression,
        customMinutes: preset?.minutes || prev.dailyPolls.customMinutes
      }
    }));
    setCustomCron(cronExpression);
  };

  const toggleNotificationRule = (ruleId: string) => {
    setConfig(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        enabledRules: prev.notifications.enabledRules.includes(ruleId)
          ? prev.notifications.enabledRules.filter(r => r !== ruleId)
          : [...prev.notifications.enabledRules, ruleId]
      }
    }));
  };

  // Funciones para manejar rankings
  const updateRankingFrequency = (rankingType: 'general' | 'weekly', frequency: string) => {
    const preset = RANKING_FREQUENCY_PRESETS.find(p => p.key === frequency);
    if (!preset) return;

    setConfig(prev => ({
      ...prev,
      rankings: {
        ...prev.rankings,
        [rankingType]: {
          ...prev.rankings?.[rankingType],
          frequency,
          cronExpression: preset.cron
        }
      }
    }));
  };

  const toggleRankingSetting = (rankingType: 'general' | 'weekly', setting: string, value?: any) => {
    setConfig(prev => ({
      ...prev,
      rankings: {
        ...prev.rankings,
        [rankingType]: {
          ...prev.rankings?.[rankingType],
          [setting]: value !== undefined ? value : !prev.rankings?.[rankingType]?.[setting as keyof typeof prev.rankings.general]
        }
      }
    }));
  };

  const updateRankingTopUsers = (rankingType: 'general' | 'weekly', count: number) => {
    setConfig(prev => ({
      ...prev,
      rankings: {
        ...prev.rankings,
        [rankingType]: {
          ...prev.rankings?.[rankingType],
          topUsersCount: Math.max(1, Math.min(15, count))
        }
      }
    }));
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-muted-foreground">Cargando configuración del notification-scheduler...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <Link href="/admin">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Admin
          </Button>
        </Link>
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Clock className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Notification Scheduler</h1>
            <p className="text-muted-foreground">Sistema avanzado de notificaciones y envíos automáticos</p>
          </div>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Polls Diarios</p>
                <p className="text-2xl font-bold">
                  {config.dailyPolls.enabled ? 'Activo' : 'Inactivo'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {config.dailyPolls.enabled && `${config.dailyPolls.questionsPerSend || 1} pregunta(s) • ${config.dailyPolls.startHour}:00 - ${config.dailyPolls.endHour}:00`}
                </p>
              </div>
              {config.dailyPolls.enabled ? (
                <PlayCircle className="w-8 h-8 text-green-500" />
              ) : (
                <PauseCircle className="w-8 h-8 text-red-500" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Notificaciones</p>
                <p className="text-2xl font-bold">
                  {config.notifications.enabled ? 'Activo' : 'Inactivo'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {config.notifications.enabled && `Cada ${config.notifications.intervalHours}h`}
                </p>
              </div>
              {config.notifications.enabled ? (
                <Bell className="w-8 h-8 text-blue-500" />
              ) : (
                <XCircle className="w-8 h-8 text-red-500" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monitoreo</p>
                <p className="text-2xl font-bold">
                  {config.monitoring.enabled ? 'Activo' : 'Inactivo'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {config.monitoring.enabled && `Cada ${config.monitoring.intervalMinutes}min`}
                </p>
              </div>
              {config.monitoring.enabled ? (
                <Monitor className="w-8 h-8 text-purple-500" />
              ) : (
                <XCircle className="w-8 h-8 text-red-500" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ranking General</p>
                <p className="text-2xl font-bold">
                  {config.rankings?.general?.enabled ? 'Activo' : 'Inactivo'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {config.rankings?.general?.enabled && `${RANKING_FREQUENCY_PRESETS.find(p => p.key === config.rankings?.general?.frequency)?.label || config.rankings?.general?.frequency}`}
                </p>
              </div>
              {config.rankings?.general?.enabled ? (
                <Trophy className="w-8 h-8 text-yellow-500" />
              ) : (
                <XCircle className="w-8 h-8 text-red-500" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ranking Semanal</p>
                <p className="text-2xl font-bold">
                  {config.rankings?.weekly?.enabled ? 'Activo' : 'Inactivo'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {config.rankings?.weekly?.enabled && `${RANKING_FREQUENCY_PRESETS.find(p => p.key === config.rankings?.weekly?.frequency)?.label || config.rankings?.weekly?.frequency}`}
                </p>
              </div>
              {config.rankings?.weekly?.enabled ? (
                <Calendar className="w-8 h-8 text-orange-500" />
              ) : (
                <XCircle className="w-8 h-8 text-red-500" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Polls Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Timer className="w-5 h-5 text-green-500" />
            <span>Configuración de Polls Diarios</span>
          </CardTitle>
          <CardDescription>
            Sistema optimizado usando auto-send-daily-poll.ts con tabla ValidQuestion
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-foreground">Habilitar envío automático de polls</h4>
              <p className="text-xs text-muted-foreground">
                Usa el sistema optimizado con 4,826 preguntas pre-validadas
              </p>
            </div>
            <button
              onClick={() => setConfig(prev => ({
                ...prev,
                dailyPolls: { ...prev.dailyPolls, enabled: !prev.dailyPolls.enabled }
              }))}
              className={cn(
                "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                config.dailyPolls.enabled ? 'bg-primary' : 'bg-muted'
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out",
                  config.dailyPolls.enabled ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
          </div>

          {config.dailyPolls.enabled && (
            <>
              {/* Frequency Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Frecuencia de envío (Formato Cron)
                </label>
                <select
                  value={config.dailyPolls.time}
                  onChange={(e) => updatePollTime(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {CRON_PRESETS.map(preset => (
                    <option key={preset.value} value={preset.value}>
                      {preset.label} ({preset.value})
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Cron Expression */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Expresión Cron Personalizada
                </label>
                <Input
                  value={customCron}
                  onChange={(e) => {
                    setCustomCron(e.target.value);
                    setConfig(prev => ({
                      ...prev,
                      dailyPolls: { ...prev.dailyPolls, time: e.target.value }
                    }));
                  }}
                  placeholder="*/30 * * * *"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Formato: minuto hora día mes día-semana (ej: */30 * * * * = cada 30 minutos)
                </p>
              </div>

              {/* Time Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Hora de inicio
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="23"
                    value={config.dailyPolls.startHour}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      dailyPolls: { ...prev.dailyPolls, startHour: parseInt(e.target.value) }
                    }))}
                    className="w-24"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Hora de fin
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="23"
                    value={config.dailyPolls.endHour}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      dailyPolls: { ...prev.dailyPolls, endHour: parseInt(e.target.value) }
                    }))}
                    className="w-24"
                  />
                </div>
              </div>

              {/* Questions per Send */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Cantidad de preguntas por envío
                </label>
                <div className="flex items-center space-x-4">
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={config.dailyPolls.questionsPerSend || 1}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      dailyPolls: { ...prev.dailyPolls, questionsPerSend: parseInt(e.target.value) || 1 }
                    }))}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">
                    preguntas (máximo 10)
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Número de preguntas que se enviarán automáticamente en cada intervalo programado
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Notifications Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-blue-500" />
            <span>Sistema de Notificaciones Inteligentes</span>
          </CardTitle>
          <CardDescription>
            Notificaciones contextuales y motivacionales automáticas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-foreground">Habilitar notificaciones inteligentes</h4>
              <p className="text-xs text-muted-foreground">
                Sistema de notificaciones contextuales para engagement
              </p>
            </div>
            <button
              onClick={() => setConfig(prev => ({
                ...prev,
                notifications: { ...prev.notifications, enabled: !prev.notifications.enabled }
              }))}
              className={cn(
                "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                config.notifications.enabled ? 'bg-primary' : 'bg-muted'
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out",
                  config.notifications.enabled ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
          </div>

          {config.notifications.enabled && (
            <>
              {/* Interval Hours */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Intervalo de notificaciones (horas)
                </label>
                <Input
                  type="number"
                  min="1"
                  max="24"
                  value={config.notifications.intervalHours}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, intervalHours: parseInt(e.target.value) }
                  }))}
                  className="w-32"
                />
              </div>

              {/* Notification Rules */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-foreground">
                  Reglas de notificación habilitadas
                </label>
                <div className="space-y-2">
                  {NOTIFICATION_RULES.map(rule => (
                    <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h5 className="text-sm font-medium">{rule.label}</h5>
                          {config.notifications.enabledRules.includes(rule.id) && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{rule.description}</p>
                      </div>
                      <button
                        onClick={() => toggleNotificationRule(rule.id)}
                        className={cn(
                          "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-primary",
                          config.notifications.enabledRules.includes(rule.id) ? 'bg-primary' : 'bg-muted'
                        )}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out",
                            config.notifications.enabledRules.includes(rule.id) ? 'translate-x-4' : 'translate-x-0'
                          )}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Rankings Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <span>Sistema de Rankings Automáticos</span>
          </CardTitle>
          <CardDescription>
            Envío automático de rankings general y semanal a Telegram
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Ranking General */}
          <div className="space-y-4 p-4 border rounded-lg bg-yellow-50/30 dark:bg-yellow-900/10">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  Ranking General
                </h4>
                <p className="text-sm text-muted-foreground">
                  Top usuarios por puntuación total y estadísticas globales
                </p>
              </div>
              <button
                onClick={() => toggleRankingSetting('general', 'enabled')}
                className={cn(
                  "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                  config.rankings?.general?.enabled ? 'bg-primary' : 'bg-muted'
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out",
                    config.rankings?.general?.enabled ? 'translate-x-5' : 'translate-x-0'
                  )}
                />
              </button>
            </div>

            {config.rankings?.general?.enabled && (
              <div className="space-y-4 pl-4 border-l-2 border-yellow-200">
                {/* Frecuencia */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Frecuencia de envío
                  </label>
                  <select
                    value={config.rankings?.general?.frequency || 'every4h'}
                    onChange={(e) => updateRankingFrequency('general', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {RANKING_FREQUENCY_PRESETS.map(preset => (
                      <option key={preset.key} value={preset.key}>
                        {preset.label} - {preset.description}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Expresión cron: {config.rankings?.general?.cronExpression || '0 */4 * * *'}
                  </p>
                </div>

                {/* Top usuarios */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Número de usuarios en el top
                  </label>
                  <Input
                    type="number"
                    min="3"
                    max="15"
                    value={config.rankings?.general?.topUsersCount || 8}
                    onChange={(e) => updateRankingTopUsers('general', parseInt(e.target.value))}
                    className="w-24"
                  />
                </div>

                {/* Opciones */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-foreground">
                    Opciones de contenido
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="general-accuracy"
                        checked={config.rankings?.general?.showAccuracy || false}
                        onChange={(e) => toggleRankingSetting('general', 'showAccuracy', e.target.checked)}
                        className="rounded border-border"
                      />
                      <label htmlFor="general-accuracy" className="text-sm">Mostrar precisión</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="general-time"
                        checked={config.rankings?.general?.showAverageTime || false}
                        onChange={(e) => toggleRankingSetting('general', 'showAverageTime', e.target.checked)}
                        className="rounded border-border"
                      />
                      <label htmlFor="general-time" className="text-sm">Tiempo promedio</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="general-fails"
                        checked={config.rankings?.general?.showFailStats || false}
                        onChange={(e) => toggleRankingSetting('general', 'showFailStats', e.target.checked)}
                        className="rounded border-border"
                      />
                      <label htmlFor="general-fails" className="text-sm">Estadísticas de fallos</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="general-weekly"
                        checked={config.rankings?.general?.includeWeeklyStats || false}
                        onChange={(e) => toggleRankingSetting('general', 'includeWeeklyStats', e.target.checked)}
                        className="rounded border-border"
                      />
                      <label htmlFor="general-weekly" className="text-sm">Stats semanales</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="general-memes"
                        checked={config.rankings?.general?.includeMemes || false}
                        onChange={(e) => toggleRankingSetting('general', 'includeMemes', e.target.checked)}
                        className="rounded border-border"
                      />
                      <label htmlFor="general-memes" className="text-sm">Frases motivacionales</label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Ranking Semanal */}
          <div className="space-y-4 p-4 border rounded-lg bg-orange-50/30 dark:bg-orange-900/10">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-orange-500" />
                  Ranking Semanal
                </h4>
                <p className="text-sm text-muted-foreground">
                  Top usuarios por actividad de los últimos 7 días
                </p>
              </div>
              <button
                onClick={() => toggleRankingSetting('weekly', 'enabled')}
                className={cn(
                  "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                  config.rankings?.weekly?.enabled ? 'bg-primary' : 'bg-muted'
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out",
                    config.rankings?.weekly?.enabled ? 'translate-x-5' : 'translate-x-0'
                  )}
                />
              </button>
            </div>

            {config.rankings?.weekly?.enabled && (
              <div className="space-y-4 pl-4 border-l-2 border-orange-200">
                {/* Frecuencia */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Frecuencia de envío
                  </label>
                  <select
                    value={config.rankings?.weekly?.frequency || 'every4h'}
                    onChange={(e) => updateRankingFrequency('weekly', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {RANKING_FREQUENCY_PRESETS.map(preset => (
                      <option key={preset.key} value={preset.key}>
                        {preset.label} - {preset.description}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Expresión cron: {config.rankings?.weekly?.cronExpression || '0 */4 * * *'}
                  </p>
                </div>

                {/* Top usuarios */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Número de usuarios en el top
                  </label>
                  <Input
                    type="number"
                    min="3"
                    max="15"
                    value={config.rankings?.weekly?.topUsersCount || 8}
                    onChange={(e) => updateRankingTopUsers('weekly', parseInt(e.target.value))}
                    className="w-24"
                  />
                </div>

                {/* Opciones */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-foreground">
                    Opciones de contenido
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="weekly-accuracy"
                        checked={config.rankings?.weekly?.showAccuracy || false}
                        onChange={(e) => toggleRankingSetting('weekly', 'showAccuracy', e.target.checked)}
                        className="rounded border-border"
                      />
                      <label htmlFor="weekly-accuracy" className="text-sm">Mostrar precisión</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="weekly-time"
                        checked={config.rankings?.weekly?.showAverageTime || false}
                        onChange={(e) => toggleRankingSetting('weekly', 'showAverageTime', e.target.checked)}
                        className="rounded border-border"
                      />
                      <label htmlFor="weekly-time" className="text-sm">Tiempo promedio</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="weekly-comparison"
                        checked={config.rankings?.weekly?.showComparison || false}
                        onChange={(e) => toggleRankingSetting('weekly', 'showComparison', e.target.checked)}
                        className="rounded border-border"
                      />
                      <label htmlFor="weekly-comparison" className="text-sm">Comparar semanas</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="weekly-memes"
                        checked={config.rankings?.weekly?.includeMemes || false}
                        onChange={(e) => toggleRankingSetting('weekly', 'includeMemes', e.target.checked)}
                        className="rounded border-border"
                      />
                      <label htmlFor="weekly-memes" className="text-sm">Frases motivacionales</label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Monitoring Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Monitor className="w-5 h-5 text-purple-500" />
            <span>Sistema de Monitoreo</span>
          </CardTitle>
          <CardDescription>
            Monitoreo automático del estado del sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-foreground">Habilitar monitoreo automático</h4>
              <p className="text-xs text-muted-foreground">
                Ejecuta scripts de monitoreo periódicamente
              </p>
            </div>
            <button
              onClick={() => setConfig(prev => ({
                ...prev,
                monitoring: { ...prev.monitoring, enabled: !prev.monitoring.enabled }
              }))}
              className={cn(
                "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                config.monitoring.enabled ? 'bg-primary' : 'bg-muted'
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out",
                  config.monitoring.enabled ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
          </div>

          {config.monitoring.enabled && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Intervalo de monitoreo (minutos)
              </label>
              <Input
                type="number"
                min="5"
                max="120"
                value={config.monitoring.intervalMinutes}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  monitoring: { ...prev.monitoring, intervalMinutes: parseInt(e.target.value) }
                }))}
                className="w-32"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Alert */}
      <Alert variant="default">
        <Info className="h-4 w-4" />
        <AlertDescription>
          Este sistema utiliza <code>notification-scheduler.ts</code> que detecta cambios automáticamente. 
          No necesitas reiniciar manualmente - los cambios se aplican en tiempo real.
        </AlertDescription>
      </Alert>

      {/* Actions */}
      <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
        <Button 
          onClick={saveConfig} 
          disabled={saving}
          className="flex items-center gap-2"
        >
          {saving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Settings className="w-4 h-4" />
          )}
          {saving ? 'Guardando...' : 'Guardar Config'}
        </Button>

        <Button 
          onClick={() => testTask('poll')} 
          disabled={testing}
          variant="outline"
          className="flex items-center gap-2"
        >
          {testing ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          Test Poll
        </Button>

        <Button 
          onClick={() => testTask('notifications')} 
          disabled={testing}
          variant="outline"
          className="flex items-center gap-2"
        >
          {testing ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Bell className="w-4 h-4" />
          )}
          Test Notif
        </Button>

        <Button 
          onClick={() => testTask('monitor')} 
          disabled={testing}
          variant="outline"
          className="flex items-center gap-2"
        >
          {testing ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Monitor className="w-4 h-4" />
          )}
          Test Monitor
        </Button>

        <Button 
          onClick={() => testTask('ranking-general')} 
          disabled={testing}
          variant="outline"
          className="flex items-center gap-2"
        >
          {testing ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Trophy className="w-4 h-4" />
          )}
          Test General
        </Button>

        <Button 
          onClick={() => testTask('ranking-weekly')} 
          disabled={testing}
          variant="outline"
          className="flex items-center gap-2"
        >
          {testing ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Calendar className="w-4 h-4" />
          )}
          Test Semanal
        </Button>

        <Button 
          onClick={loadConfig} 
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Recargar
        </Button>
      </div>
    </div>
  );
} 