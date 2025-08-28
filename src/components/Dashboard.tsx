'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, FileText, MessageSquare, Zap, Clock, Settings, ChevronRight } from 'lucide-react';
import { StorageService } from '@/services/storageService';
import type { RecentDocument, Statistics } from '@/services/storageService';
import { AIService, availableModels } from '@/services/aiService';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';

interface DashboardProps {
  isLoading: boolean;
  error: string | null;
  selectedModel: string | null;
}

export default function Dashboard({ isLoading, error, selectedModel }: DashboardProps) {
  const router = useRouter();
  const [recentDocs, setRecentDocs] = useState<RecentDocument[]>([]);
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);
        setDataError(null);

        const [recentDocuments, statistics] = await Promise.all([
          StorageService.getRecentDocuments(),
          StorageService.getStatistics()
        ]);

        setRecentDocs(recentDocuments);
        setStats(statistics);
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setDataError('Error al cargar los datos del dashboard');
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, []);

  if (loadingData) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-muted-foreground">Cargando dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-6 py-12 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Gestiona tus documentos y genera preguntas de examen con IA
          </p>
        </div>

        {/* AI Configuration Card */}
        <Card variant="elevated" className="border-l-4 border-l-primary">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Settings className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Configuración de IA</CardTitle>
                  <CardDescription>
                    Configura el modelo de inteligencia artificial para generar preguntas
                  </CardDescription>
                </div>
              </div>
              <Button
                onClick={() => router.push('/ai-settings')}
                className="shrink-0"
              >
                <Settings className="w-4 h-4 mr-2" />
                Configurar
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-muted-foreground">Cargando configuración...</span>
              </div>
            ) : error ? (
              <Alert variant="error">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-muted-foreground">Modelo actual:</span>
                  <Badge variant={selectedModel ? "default" : "secondary"}>
                    {selectedModel || 'No seleccionado'}
                  </Badge>
                </div>
                {selectedModel && (
                  <div className="flex items-center space-x-2 text-sm text-success">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    <span>Configurado</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Error Alert */}
        {dataError && (
          <Alert variant="error">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{dataError}</AlertDescription>
          </Alert>
        )}

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Documentos Procesados */}
          <Card className="group hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Documentos Procesados
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {stats?.totalDocuments || 0}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg group-hover:scale-110 transition-transform duration-200">
                  <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preguntas Generadas */}
          <Card className="group hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Preguntas Generadas
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {stats?.totalquestions || 0}
                  </p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg group-hover:scale-110 transition-transform duration-200">
                  <MessageSquare className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tokens Consumidos */}
          <Card className="group hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Tokens Consumidos
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {stats?.totalTokens || 0}
                  </p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg group-hover:scale-110 transition-transform duration-200">
                  <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tiempo Promedio */}
          <Card className="group hover:shadow-md transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Tiempo Promedio
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {stats?.averageProcessingTime ? `${Math.round(stats.averageProcessingTime)}s` : 'N/A'}
                  </p>
                </div>
                <div className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg group-hover:scale-110 transition-transform duration-200">
                  <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Documentos Recientes</span>
            </CardTitle>
            <CardDescription>
              Accede rápidamente a tus documentos procesados recientemente
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentDocs.length > 0 ? (
              <div className="space-y-3">
                {(showAll ? recentDocs : recentDocs.slice(0, 4)).map((doc) => (
                  <Link
                    key={doc.id}
                    href={`/documents/${doc.id}`}
                    className="group block"
                  >
                    <div className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/5 transition-all duration-200">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-muted rounded-lg group-hover:bg-primary/10 transition-colors duration-200">
                          <FileText className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-medium text-foreground group-hover:text-primary transition-colors duration-200">
                            {doc.title || 'Documento sin título'}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(doc.createdAt).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant="secondary">
                          {doc.questionCount} preguntas
                        </Badge>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
                      </div>
                    </div>
                  </Link>
                ))}
                
                {recentDocs.length > 4 && (
                  <div className="pt-4 border-t border-border">
                    <Button
                      variant="ghost"
                      onClick={() => setShowAll((prev) => !prev)}
                      className="w-full"
                    >
                      {showAll ? 'Ver menos' : `Ver ${recentDocs.length - 4} más`}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="p-4 bg-muted/50 rounded-lg w-fit mx-auto mb-4">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-4">No hay documentos recientes</p>
                <Button onClick={() => router.push('/upload')}>
                  Subir primer documento
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Telegram Administration Section */}
        <Card variant="elevated" className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <svg 
                    className="w-5 h-5 text-blue-500" 
                    viewBox="0 0 24 24" 
                    fill="currentColor"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.05.01-.23-.08-.32-.09-.1-.25-.07-.36-.04-.15.05-2.5 1.59-3.55 2.34-.33.22-.64.33-1.22.33-.41 0-1.2-.13-1.8-.24-.73-.14-1.31-.21-1.26-.73.03-.18.13-.38.54-.57 1.91-.92 3.68-1.52 4.61-1.96.18-.09 3.73-1.54 4.76-1.74.48-.16.83-.23 1.01-.01.08.09.12.21.13.48z" />
                  </svg>
                </div>
                <div>
                  <CardTitle className="text-xl">Administración de Telegram</CardTitle>
                  <CardDescription>
                    Gestiona y monitoriza los envíos de preguntas a Telegram
                  </CardDescription>
                </div>
              </div>
              <Button
                onClick={() => router.push('/admin/telegram-logs')}
                className="shrink-0"
              >
                <ChevronRight className="w-4 h-4 ml-2" />
                Ver Registros
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Consulta el historial de envíos, detecta errores y monitoriza el sistema mejorado contra duplicados.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 