import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { 
  BookOpen,
  Target,
  Trophy,
  Users,
  Calendar,
  Zap,
  TrendingUp,
  Clock,
  Star,
  Brain,
  Sparkles,
  Share,
  Download,
  Heart,
  MessageCircle,
  Bookmark,
  Play,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface StudySession {
  id: string;
  subject: string;
  topic: string;
  visualizationType: string;
  studyTime: number;
  completionRate: number;
  difficulty: 'easy' | 'medium' | 'hard';
  date: Date;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface OpositiaIntegrationProps {
  currentVisualization?: any;
  onSaveToLibrary?: (data: any) => void;
  onShareWithCommunity?: (data: any) => void;
  className?: string;
}

/**
 * 🎯 Integración Avanzada con OpositIA
 * Conecta visualizaciones con el ecosistema educativo
 */
export default function OpositiaIntegration({
  currentVisualization,
  onSaveToLibrary,
  onShareWithCommunity,
  className
}: OpositiaIntegrationProps) {
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [weeklyProgress, setWeeklyProgress] = useState(78);
  const [studyStreak, setStudyStreak] = useState(12);
  const [totalStudyTime, setTotalStudyTime] = useState(145); // en minutos

  useEffect(() => {
    // Simular datos de ejemplo
    setStudySessions([
      {
        id: '1',
        subject: 'Derecho Administrativo',
        topic: 'Procedimiento Administrativo Común',
        visualizationType: 'Mapa Conceptual',
        studyTime: 25,
        completionRate: 85,
        difficulty: 'medium',
        date: new Date()
      },
      {
        id: '2',
        subject: 'Derecho Constitucional',
        topic: 'Derechos Fundamentales',
        visualizationType: 'Esquema Jerárquico',
        studyTime: 35,
        completionRate: 92,
        difficulty: 'hard',
        date: new Date(Date.now() - 86400000)
      }
    ]);

    setAchievements([
      {
        id: '1',
        title: 'Maestro Visualizador',
        description: 'Crea 10 mapas conceptuales',
        icon: <Brain className="h-4 w-4" />,
        progress: 7,
        maxProgress: 10,
        unlocked: false,
        rarity: 'rare'
      },
      {
        id: '2',
        title: 'Racha de Estudio',
        description: 'Estudia 7 días consecutivos',
        icon: <Zap className="h-4 w-4" />,
        progress: 12,
        maxProgress: 7,
        unlocked: true,
        rarity: 'epic'
      },
      {
        id: '3',
        title: 'Experto en Flujos',
        description: 'Domina los diagramas de flujo',
        icon: <Target className="h-4 w-4" />,
        progress: 3,
        maxProgress: 5,
        unlocked: false,
        rarity: 'common'
      }
    ]);
  }, []);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'rare': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'epic': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'legendary': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-success/10 text-success border-success/20';
      case 'medium': return 'bg-warning/10 text-warning border-warning/20';
      case 'hard': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted/10 text-muted-foreground border-border';
    }
  };

  const formatStudyTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Panel de estadísticas personales */}
      <Card className="bg-gradient-to-br from-primary/5 via-accent/5 to-success/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Mi Progreso OpositIA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-card/50">
              <div className="text-2xl font-bold text-primary">{studyStreak}</div>
              <div className="text-xs text-muted-foreground">Días consecutivos</div>
              <div className="flex items-center justify-center mt-1">
                <Zap className="h-3 w-3 text-warning mr-1" />
                <span className="text-xs text-warning">¡En racha!</span>
              </div>
            </div>
            
            <div className="text-center p-3 rounded-lg bg-card/50">
              <div className="text-2xl font-bold text-accent">{weeklyProgress}%</div>
              <div className="text-xs text-muted-foreground">Meta semanal</div>
              <div className="w-full bg-muted rounded-full h-1 mt-2">
                <div 
                  className="bg-accent h-1 rounded-full transition-all duration-500"
                  style={{ width: `${weeklyProgress}%` }}
                />
              </div>
            </div>
            
            <div className="text-center p-3 rounded-lg bg-card/50">
              <div className="text-2xl font-bold text-success">{formatStudyTime(totalStudyTime)}</div>
              <div className="text-xs text-muted-foreground">Esta semana</div>
              <div className="flex items-center justify-center mt-1">
                <TrendingUp className="h-3 w-3 text-success mr-1" />
                <span className="text-xs text-success">+15%</span>
              </div>
            </div>
            
            <div className="text-center p-3 rounded-lg bg-card/50">
              <div className="text-2xl font-bold text-warning">{achievements.filter(a => a.unlocked).length}</div>
              <div className="text-xs text-muted-foreground">Logros desbloqueados</div>
              <div className="flex items-center justify-center mt-1">
                <Star className="h-3 w-3 text-warning mr-1" />
                <span className="text-xs text-warning">¡Genial!</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Acciones rápidas con la visualización actual */}
      {currentVisualization && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              Acciones con Visualización Actual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onSaveToLibrary?.(currentVisualization)}
                className="flex items-center gap-2"
              >
                <Bookmark className="h-4 w-4" />
                Guardar en Mi Biblioteca
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => onShareWithCommunity?.(currentVisualization)}
                className="flex items-center gap-2"
              >
                <Share className="h-4 w-4" />
                Compartir con Comunidad
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Exportar a PDF
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                className="flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                Modo Repaso
              </Button>
            </div>
            
            {/* Sugerencias inteligentes */}
            <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-start gap-2">
                <Brain className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-primary">Sugerencia IA</div>
                  <div className="text-xs text-muted-foreground">
                    Basándote en tu patrón de estudio, te recomendamos repasar este mapa conceptual 
                    en 3 días para una retención óptima del conocimiento.
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sesiones de estudio recientes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              Sesiones Recientes
            </div>
            <Button size="sm" variant="ghost">Ver todas</Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {studySessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card/30 hover:bg-card/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <BookOpen className="h-4 w-4 text-primary" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="font-medium text-sm">{session.topic}</div>
                    <div className="text-xs text-muted-foreground">
                      {session.subject} • {session.visualizationType}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-medium">{formatStudyTime(session.studyTime)}</div>
                    <div className="text-xs text-muted-foreground">{session.completionRate}% completado</div>
                  </div>
                  
                  <Badge className={cn("text-xs", getDifficultyColor(session.difficulty))}>
                    {session.difficulty}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sistema de logros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-warning" />
            Logros y Medallas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={cn(
                  'flex items-center justify-between p-3 rounded-lg border transition-all duration-200',
                  achievement.unlocked 
                    ? 'bg-success/5 border-success/20 hover:bg-success/10' 
                    : 'bg-muted/20 border-muted hover:bg-muted/30'
                )}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className={cn(
                    'p-2 rounded-lg',
                    achievement.unlocked 
                      ? 'bg-success/20 text-success' 
                      : 'bg-muted text-muted-foreground'
                  )}>
                    {achievement.unlocked ? <CheckCircle className="h-4 w-4" /> : achievement.icon}
                  </div>
                  
                  <div className="flex-1">
                    <div className={cn(
                      'font-medium text-sm',
                      achievement.unlocked ? 'text-foreground' : 'text-muted-foreground'
                    )}>
                      {achievement.title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {achievement.description}
                    </div>
                    
                    {/* Barra de progreso */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 bg-muted rounded-full h-1.5">
                        <div 
                          className={cn(
                            'h-1.5 rounded-full transition-all duration-500',
                            achievement.unlocked ? 'bg-success' : 'bg-primary'
                          )}
                          style={{ 
                            width: `${Math.min((achievement.progress / achievement.maxProgress) * 100, 100)}%` 
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {achievement.progress}/{achievement.maxProgress}
                      </span>
                    </div>
                  </div>
                  
                  <Badge className={cn("text-xs", getRarityColor(achievement.rarity))}>
                    {achievement.rarity}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Comunidad y colaboración */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-accent" />
            Comunidad OpositIA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Visualizaciones populares */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-sm">Visualizaciones Populares</h4>
                <Button size="sm" variant="ghost">Explorar</Button>
              </div>
              
              <div className="space-y-2">
                {[
                  { title: 'Proceso Penal Completo', author: 'María L.', likes: 156, type: 'Diagrama de Flujo' },
                  { title: 'Derecho Civil - Contratos', author: 'Juan P.', likes: 98, type: 'Mapa Conceptual' },
                  { title: 'Organización del Estado', author: 'Ana R.', likes: 87, type: 'Esquema Jerárquico' }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded border bg-card/30 hover:bg-card/50 transition-colors">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{item.title}</div>
                      <div className="text-xs text-muted-foreground">
                        por {item.author} • {item.type}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Heart className="h-3 w-3" />
                        {item.likes}
                      </div>
                      <Button size="sm" variant="ghost">
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Call to action */}
            <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
              <div className="flex items-center gap-3">
                <Sparkles className="h-8 w-8 text-primary" />
                <div className="flex-1">
                  <div className="font-medium">¡Únete a la Comunidad!</div>
                  <div className="text-sm text-muted-foreground">
                    Comparte tus visualizaciones y aprende de otros estudiantes
                  </div>
                </div>
                <Button size="sm">
                  Explorar
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}