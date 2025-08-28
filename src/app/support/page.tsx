'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  MessageCircle,
  Mail,
  FileText,
  ExternalLink,
  HelpCircle,
  Book,
  VideoIcon,
  Github,
  Bug,
  Lightbulb,
  Phone,
  Clock
} from 'lucide-react';
import Link from 'next/link';

export default function SupportPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <HelpCircle className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Centro de Soporte</h1>
            <p className="text-muted-foreground">Obtén ayuda y recursos para usar OpositIA</p>
          </div>
        </div>
      </div>

      {/* Quick Help */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="group hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Book className="w-5 h-5 text-green-500" />
              Guía de Usuario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Documentación completa sobre cómo usar todas las funcionalidades
            </p>
            <Link href="/guide">
              <Button className="w-full">
                Ver Guía Completa
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <VideoIcon className="w-5 h-5 text-red-500" />
              Tutoriales en Video
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Videos explicativos sobre funcionalidades específicas
            </p>
            <Button className="w-full" variant="outline" disabled>
              Próximamente
              <Badge variant="outline" className="ml-2 text-xs">En desarrollo</Badge>
            </Button>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageCircle className="w-5 h-5 text-blue-500" />
              FAQ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Respuestas a las preguntas más frecuentes
            </p>
            <Button className="w-full" variant="outline">
              Ver FAQ
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Contact Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-orange-500" />
            Métodos de Contacto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                <Mail className="w-5 h-5 text-blue-500 mt-1" />
                <div>
                  <h4 className="font-medium">Soporte por Email</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Para consultas generales y reportes de bugs
                  </p>
                  <Button variant="outline" size="sm">
                    <Mail className="w-4 h-4 mr-2" />
                    soporte@opositia.com
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                <Github className="w-5 h-5 text-gray-700 mt-1" />
                <div>
                  <h4 className="font-medium">GitHub Issues</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Para reportar bugs o solicitar nuevas funcionalidades
                  </p>
                  <Button variant="outline" size="sm">
                    <Github className="w-4 h-4 mr-2" />
                    Crear Issue
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                <Clock className="w-5 h-5 text-green-500 mt-1" />
                <div>
                  <h4 className="font-medium">Horarios de Atención</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Lunes a Viernes: 9:00 - 18:00</p>
                    <p>Sábados: 10:00 - 14:00</p>
                    <p>Domingos: Cerrado</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                <Lightbulb className="w-5 h-5 text-yellow-500 mt-1" />
                <div>
                  <h4 className="font-medium">Tiempo de Respuesta</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Consultas generales: 24-48h</p>
                    <p>Bugs críticos: 4-8h</p>
                    <p>Solicitudes de funcionalidades: 1-2 semanas</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="w-5 h-5 text-red-500" />
            Solución de Problemas Comunes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <details className="group">
              <summary className="flex items-center justify-between p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <span className="font-medium">No se pueden generar preguntas</span>
                <div className="w-5 h-5 group-open:rotate-180 transition-transform">⌄</div>
              </summary>
              <div className="mt-3 p-4 bg-muted/20 rounded-lg text-sm space-y-2">
                <p><strong>Posibles causas:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>El documento no tiene el formato correcto</li>
                  <li>Error en la configuración de IA</li>
                  <li>Límites de API excedidos</li>
                </ul>
                <p><strong>Soluciones:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Verifica que el documento sea un PDF o texto válido</li>
                  <li>Revisa la configuración de IA en <Link href="/ai-settings" className="text-primary hover:underline">Configuración IA</Link></li>
                  <li>Espera unos minutos e intenta de nuevo</li>
                </ul>
              </div>
            </details>

            <details className="group">
              <summary className="flex items-center justify-between p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <span className="font-medium">El bot de Telegram no responde</span>
                <div className="w-5 h-5 group-open:rotate-180 transition-transform">⌄</div>
              </summary>
              <div className="mt-3 p-4 bg-muted/20 rounded-lg text-sm space-y-2">
                <p><strong>Posibles causas:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Webhook no configurado correctamente</li>
                  <li>Token de bot inválido</li>
                  <li>Problemas de conectividad</li>
                </ul>
                <p><strong>Soluciones:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Verifica el estado del sistema en <Link href="/admin" className="text-primary hover:underline">Panel Admin</Link></li>
                  <li>Revisa los logs en <Link href="/admin/telegram-logs" className="text-primary hover:underline">Logs de Telegram</Link></li>
                  <li>Contacta al soporte si persiste el problema</li>
                </ul>
              </div>
            </details>

            <details className="group">
              <summary className="flex items-center justify-between p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <span className="font-medium">Error de validación en formato GIFT</span>
                <div className="w-5 h-5 group-open:rotate-180 transition-transform">⌄</div>
              </summary>
              <div className="mt-3 p-4 bg-muted/20 rounded-lg text-sm space-y-2">
                <p><strong>Posibles causas:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Formato GIFT incorrecto</li>
                  <li>Caracteres especiales no escapados</li>
                  <li>Estructura de pregunta inválida</li>
                </ul>
                <p><strong>Soluciones:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Usa el <Link href="/validator-chat" className="text-primary hover:underline">Validador Avanzado</Link> para verificar tus preguntas</li>
                  <li>Consulta la <Link href="/guide" className="text-primary hover:underline">Guía de Usuario</Link> para ver ejemplos correctos</li>
                  <li>Usa el <Link href="/gift-viewer" className="text-primary hover:underline">Visor GIFT</Link> para verificar el formato</li>
                </ul>
              </div>
            </details>
          </div>
        </CardContent>
      </Card>

      {/* Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-500" />
            Recursos Útiles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium">Documentación Técnica</h4>
              <div className="space-y-2">
                <Link href="/guide" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                  <ExternalLink className="w-4 h-4" />
                  Guía completa de usuario
                </Link>
                <Link href="#" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                  <ExternalLink className="w-4 h-4" />
                  Formato GIFT explicado
                </Link>
                <Link href="#" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                  <ExternalLink className="w-4 h-4" />
                  API Reference
                </Link>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Enlaces Externos</h4>
              <div className="space-y-2">
                <a href="https://docs.moodle.org/en/GIFT_format" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                  <ExternalLink className="w-4 h-4" />
                  Documentación oficial GIFT
                </a>
                <a href="https://core.telegram.org/bots/api" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                  <ExternalLink className="w-4 h-4" />
                  Telegram Bot API
                </a>
                <a href="#" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                  <ExternalLink className="w-4 h-4" />
                  Mejores prácticas educativas
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-green-500" />
            ¿No encuentras lo que buscas?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Si no puedes resolver tu problema con estos recursos, no dudes en contactarnos.
              Nuestro equipo de soporte estará encantado de ayudarte.
            </p>
            <div className="flex justify-center gap-4">
              <Button>
                <Mail className="w-4 h-4 mr-2" />
                Contactar Soporte
              </Button>
              <Link href="/admin">
                <Button variant="outline">
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Panel Admin
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 