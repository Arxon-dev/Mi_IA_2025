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
import {
  Activity,
  MessageSquare,
  Database,
  Users,
  BarChart3,
  Settings,
  Terminal,
  FileText,
  TrendingUp,
  Shield,
  Zap,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Clock,
  Trophy
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  totalQuestions: number;
  totalDocuments: number;
  totalResponses: number;
  systemHealth: {
    database: boolean;
    telegram: boolean;
    webhook: boolean;
    ai: boolean;
  };
  recentActivity: {
    lastQuestion: string;
    lastResponse: string;
    lastUser: string;
  };
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    // Establecer el tiempo solo en el cliente para evitar hydration error
    setCurrentTime(new Date().toLocaleTimeString());
    
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching admin stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const healthStatus = (status: boolean) => {
    return status ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <AlertCircle className="w-4 h-4 text-red-500" />
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
            <Shield className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Panel de Administración</h1>
            <p className="text-muted-foreground">Monitoreo y gestión del sistema OpositIA</p>
          </div>
        </div>
        {currentTime && (
          <Badge variant="secondary" className="text-xs">
            <Clock className="w-3 h-3 mr-1" />
            Última actualización: {currentTime}
          </Badge>
        )}
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-500" />
            Estado del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                {healthStatus(stats?.systemHealth?.database ?? true)}
                <span className="text-sm font-medium">Base de Datos</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                {healthStatus(stats?.systemHealth?.telegram ?? true)}
                <span className="text-sm font-medium">Bot Telegram</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                {healthStatus(stats?.systemHealth?.webhook ?? true)}
                <span className="text-sm font-medium">Webhook</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                {healthStatus(stats?.systemHealth?.ai ?? true)}
                <span className="text-sm font-medium">Servicios IA</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Usuarios Registrados</p>
                <p className="text-2xl font-bold">{loading ? '...' : stats?.totalUsers || 0}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Preguntas Generadas</p>
                <p className="text-2xl font-bold">{loading ? '...' : stats?.totalQuestions || 0}</p>
              </div>
              <FileText className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Documentos Cargados</p>
                <p className="text-2xl font-bold">{loading ? '...' : stats?.totalDocuments || 0}</p>
              </div>
              <Database className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Respuestas Totales</p>
                <p className="text-2xl font-bold">{loading ? '...' : stats?.totalResponses || 0}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="group hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              Logs de Telegram
            </CardTitle>
            <CardDescription>
              Monitorear envíos y respuestas del bot
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/telegram-logs">
              <Button className="w-full group-hover:bg-primary/90 transition-colors">
                Ver Registros
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="w-5 h-5 text-yellow-600" />
              Gestión de Torneos
            </CardTitle>
            <CardDescription>
              Crear y administrar torneos de Telegram
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/tournaments">
              <Button className="w-full group-hover:bg-primary/90 transition-colors">
                Gestionar Torneos
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="w-5 h-5 text-blue-600" />
              Horarios Programados
            </CardTitle>
            <CardDescription>
              Configurar envío automático de preguntas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/scheduler">
              <Button className="w-full group-hover:bg-primary/90 transition-colors">
                Configurar Horarios
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Terminal className="w-5 h-5 text-green-500" />
              Panel Avanzado
            </CardTitle>
            <CardDescription>
              Herramientas de administración avanzadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/(admin_panel)">
              <Button className="w-full group-hover:bg-primary/90 transition-colors">
                Acceder
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="w-5 h-5 text-purple-500" />
              Dashboard Gamificación
            </CardTitle>
            <CardDescription>
              Estadísticas del sistema de gamificación
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/gamification">
              <Button className="w-full group-hover:bg-primary/90 transition-colors">
                Ver Dashboard
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="w-5 h-5 text-orange-500" />
              Configuración IA
            </CardTitle>
            <CardDescription>
              Gestionar modelos y parámetros de IA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/ai-settings">
              <Button className="w-full group-hover:bg-primary/90 transition-colors">
                Configurar
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="w-5 h-5 text-yellow-500" />
              Herramientas
            </CardTitle>
            <CardDescription>
              Acceso rápido a utilidades del sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link href="/manual-question-generator" className="block">
                <Button variant="outline" className="w-full justify-start">
                  Generador Manual
                </Button>
              </Link>
              <Link href="/validator-chat" className="block">
                <Button variant="outline" className="w-full justify-start">
                  Validador Avanzado
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Database className="w-5 h-5 text-indigo-500" />
              Gestión de Datos
            </CardTitle>
            <CardDescription>
              Backup, migraciones y mantenimiento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start" disabled>
                Backup BD
                <Badge variant="outline" className="ml-2 text-xs">Próximamente</Badge>
              </Button>
              <Button variant="outline" className="w-full justify-start" disabled>
                Migraciones
                <Badge variant="outline" className="ml-2 text-xs">Próximamente</Badge>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Database className="w-5 h-5 text-green-500" />
              Gestión de Preguntas Válidas
            </CardTitle>
            <CardDescription>
              Administra las preguntas optimizadas para Telegram
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Busca, edita y elimina preguntas de la tabla ValidQuestion
            </p>
            <Link href="/admin/valid-questions">
              <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                Gestionar Preguntas
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>
            Herramientas frecuentemente utilizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Link href="/documents">
              <Button variant="outline" size="sm">
                <FileText className="w-4 h-4 mr-2" />
                Ver Documentos
              </Button>
            </Link>
            <Link href="/upload">
              <Button variant="outline" size="sm">
                <Database className="w-4 h-4 mr-2" />
                Cargar Documento
              </Button>
            </Link>
            <Link href="/history">
              <Button variant="outline" size="sm">
                <Clock className="w-4 h-4 mr-2" />
                Ver Historial
              </Button>
            </Link>
            <Link href="/guide">
              <Button variant="outline" size="sm">
                <Users className="w-4 h-4 mr-2" />
                Guía de Uso
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 