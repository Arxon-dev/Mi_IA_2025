'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, BookOpen, Settings, FileText, HelpCircle, Sun, Moon, BrainCircuit, User, Bell, Network } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

// Componente de logo externo por URL
const OpomelillaLogo = () => (
  <div className="h-10 w-10 flex-shrink-0 relative">
    <img
      src="https://i.gyazo.com/b111a3a57fc14318043b379bb42b62fe.webp"
      alt="OpoMelilla"
      className="w-full h-full object-contain rounded-lg"
    />
  </div>
);

export default function Header() {
  const [isOpen, setOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Manejar la hidratación
  useEffect(() => {
    setMounted(true);
  }, []);

  // Evitar renderizado durante SSR
  if (!mounted) {
    return null;
  }

  return (
    <header className="w-full z-40 fixed top-0 left-0 bg-background/95 backdrop-blur-xl border-b border-border shadow-sm">
      <div className="container relative mx-auto h-16 flex items-center justify-between px-6">
        {/* Logo y título */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex items-center gap-3">
            <OpomelillaLogo />
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors duration-200">
                OpositIA
              </h1>
              <p className="text-xs text-muted-foreground">
                Generador de Exámenes
              </p>
            </div>
          </div>
        </Link>

        {/* Navegación para desktop */}
        <nav className="hidden lg:flex items-center space-x-1">
          <Link 
            href="/" 
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-lg transition-all duration-200"
          >
            <FileText className="w-4 h-4" />
            <span>Documentos</span>
          </Link>
          <Link 
            href="/schema-generator" 
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-lg transition-all duration-200"
          >
            <Network className="w-4 h-4" />
            <span>Esquemas</span>
            <Badge variant="secondary" className="text-xs">
              IA
            </Badge>
          </Link>
          <Link 
            href="/ai-settings" 
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-lg transition-all duration-200"
          >
            <BrainCircuit className="w-4 h-4" />
            <span>IA</span>
            <Badge variant="secondary" className="text-xs">
              Config
            </Badge>
          </Link>
          <Link 
            href="/help" 
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-lg transition-all duration-200"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Ayuda</span>
          </Link>
        </nav>

        {/* Acciones del header */}
        <div className="flex items-center space-x-2">
          {/* Notificaciones */}
          <Button variant="ghost" size="sm" className="relative hidden md:flex">
            <Bell className="w-4 h-4" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full"></div>
          </Button>

          {/* Botón de tema */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="hidden md:flex"
            title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </Button>

          {/* Guía de uso */}
          <Button asChild className="hidden lg:flex">
            <Link href="/guide">
              <BookOpen className="w-4 h-4 mr-2" />
              Guía de Uso
            </Link>
          </Button>

          {/* Perfil de usuario */}
          <Button variant="ghost" size="sm" className="hidden md:flex">
            <User className="w-4 h-4" />
          </Button>
          
          {/* Botón menú móvil */}
          <Button 
            variant="ghost"
            size="sm"
            className="lg:hidden" 
            onClick={() => setOpen(!isOpen)}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Menú móvil */}
        {isOpen && (
          <div className="absolute top-16 left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-border shadow-lg lg:hidden">
            <div className="container mx-auto px-6 py-6">
              <div className="flex flex-col space-y-2">
                <Link 
                  href="/" 
                  className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-lg transition-all duration-200"
                  onClick={() => setOpen(false)}
                >
                  <FileText className="w-5 h-5" />
                  <span className="font-medium">Documentos</span>
                </Link>
                
                <Link 
                  href="/schema-generator" 
                  className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-lg transition-all duration-200"
                  onClick={() => setOpen(false)}
                >
                  <Network className="w-5 h-5" />
                  <span className="font-medium">Generador de Esquemas</span>
                  <Badge variant="secondary" className="text-xs ml-auto">
                    IA
                  </Badge>
                </Link>
                
                <Link 
                  href="/ai-settings" 
                  className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-lg transition-all duration-200"
                  onClick={() => setOpen(false)}
                >
                  <BrainCircuit className="w-5 h-5" />
                  <span className="font-medium">Configuración IA</span>
                  <Badge variant="secondary" className="text-xs ml-auto">
                    Config
                  </Badge>
                </Link>
                
                <Link 
                  href="/help" 
                  className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-lg transition-all duration-200"
                  onClick={() => setOpen(false)}
                >
                  <HelpCircle className="w-5 h-5" />
                  <span className="font-medium">Ayuda</span>
                </Link>
                
                <div className="border-t border-border my-4"></div>
                
                <Link 
                  href="/guide" 
                  className="flex items-center gap-3 px-4 py-3 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-all duration-200"
                  onClick={() => setOpen(false)}
                >
                  <BookOpen className="w-5 h-5" />
                  <span className="font-medium">Guía de Uso</span>
                </Link>
                
                {/* Controles adicionales en móvil */}
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm font-medium text-muted-foreground">Tema</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      toggleTheme();
                      setOpen(false);
                    }}
                    className="flex items-center gap-2"
                  >
                    {theme === 'light' ? (
                      <>
                        <Moon className="w-4 h-4" />
                        <span className="text-sm">Oscuro</span>
                      </>
                    ) : (
                      <>
                        <Sun className="w-4 h-4" />
                        <span className="text-sm">Claro</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}