'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  FileText, 
  Upload, 
  Settings, 
  HelpCircle, 
  Book,
  BrainCircuit,
  History,
  LogOut,
  ChevronDown,
  ChevronRight,
  BarChart3,
  Edit3,
  CheckSquare,
  UploadCloud,
  Sparkles,
  Users,
  Target,
  MessageSquare,
  Zap,
  Trophy,
  Gift,
  Shield,
  Activity,
  Terminal,
  Gamepad2,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';

// Componente para los elementos del sidebar
interface SidebarItemProps {
  icon: React.ReactNode;
  title: string;
  href?: string;
  active?: boolean;
  subMenu?: { title: string; href: string; badge?: string; isNew?: boolean }[];
  badge?: string;
  isNew?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
  menuId?: string;
}

const SidebarItem = ({ 
  icon, 
  title, 
  href, 
  active, 
  subMenu, 
  badge, 
  isNew, 
  isOpen = false,
  onToggle,
  menuId 
}: SidebarItemProps) => {
  const hasSubMenu = subMenu && subMenu.length > 0;
  
  if (hasSubMenu) {
    return (
      <div className="mb-1">
        <button
          className={cn(
            'flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-left transition-all duration-200 group',
            active 
              ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm' 
              : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
          )}
          onClick={onToggle}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-5 h-5 transition-colors duration-200',
              active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
            )}>
              {icon}
            </div>
            <span className="text-sm font-medium">{title}</span>
            {badge && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                {badge}
              </Badge>
            )}
            {isNew && (
              <div className="flex items-center">
                <Sparkles className="w-3 h-3 text-primary" />
                <span className="text-xs text-primary font-medium ml-1">Nuevo</span>
              </div>
            )}
          </div>
          <ChevronRight className={cn(
            'w-4 h-4 transition-transform duration-300',
            isOpen && 'rotate-90'
          )} />
        </button>
        
        <div className={cn(
          'overflow-hidden transition-all duration-300 ease-in-out',
          isOpen ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0'
        )}>
          <div className="ml-8 space-y-1 border-l-2 border-border/50 pl-4">
            {subMenu.map((item, index) => (
              <Link 
                key={index} 
                href={item.href}
                className="flex items-center justify-between px-3 py-2 text-sm text-muted-foreground rounded-lg hover:bg-accent/30 hover:text-foreground transition-all duration-200 group"
              >
                <span className="group-hover:translate-x-0.5 transition-transform duration-200">
                  {item.title}
                </span>
                <div className="flex items-center gap-2">
                  {item.badge && (
                    <Badge variant="outline" className="text-xs">
                      {item.badge}
                    </Badge>
                  )}
                  {item.isNew && (
                    <div className="flex items-center">
                      <Sparkles className="w-3 h-3 text-primary" />
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <Link 
      href={href || '#'} 
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all duration-200 group',
        active 
          ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm' 
          : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
      )}
    >
      <div className={cn(
        'w-5 h-5 transition-colors duration-200',
        active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
      )}>
        {icon}
      </div>
      <span className="text-sm font-medium flex-1">{title}</span>
      {badge && (
        <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
          {badge}
        </Badge>
      )}
      {isNew && (
        <div className="flex items-center">
          <Sparkles className="w-3 h-3 text-primary" />
          <span className="text-xs text-primary font-medium ml-1">Nuevo</span>
        </div>
      )}
    </Link>
  );
};

export default function Sidebar() {
  const pathname = usePathname() || '/';
  
  // Estado para controlar qué sección está abierta (auto-colapso inteligente)
  const [openSection, setOpenSection] = useState<string | null>(() => {
    // Determinar qué sección debería estar abierta inicialmente basándose en la ruta actual
    if (pathname.startsWith('/dashboard') || pathname === '/') return 'dashboard';
    if (pathname.startsWith('/documents') || pathname.startsWith('/upload')) return 'documents';
    return null;
  });

  const handleSectionToggle = (sectionId: string) => {
    setOpenSection(current => current === sectionId ? null : sectionId);
  };

  return (
    <div className="h-full w-64 border-r border-border bg-card/95 backdrop-blur-xl py-6 flex flex-col shadow-sm">
      {/* Header */}
      <div className="px-6 mb-8">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <BrainCircuit className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">OpositIA</h1>
            <p className="text-xs text-muted-foreground">Generador de Exámenes</p>
          </div>
        </div>
      </div>
      
      {/* Contenido principal sin scroll - auto-colapso inteligente */}
      <div className="flex-1 px-4 space-y-4 overflow-hidden">
        {/* Main Menu */}
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3 flex items-center">
            <div className="w-4 h-px bg-border mr-2"></div>
            Panel Principal
          </h2>
          
          <div className="space-y-1">
            <SidebarItem
              menuId="dashboard"
              icon={<Home />}
              title="Dashboard"
              active={pathname.startsWith('/dashboard') && !pathname.includes('/gamification')}
              isOpen={openSection === 'dashboard'}
              onToggle={() => handleSectionToggle('dashboard')}
              subMenu={[
                { title: 'Vista General', href: '/' },
                { title: 'Gamificación', href: '/dashboard/gamification', isNew: true }
              ]}
            />
            
            <SidebarItem
              menuId="documents"
              icon={<FileText />}
              title="Documentos"
              active={pathname.startsWith('/documents') || pathname.startsWith('/upload')}
              isOpen={openSection === 'documents'}
              onToggle={() => handleSectionToggle('documents')}
              subMenu={[
                { title: 'Cargar Nuevo', href: '/upload' },
                { title: 'Ver Todos', href: '/documents' }
              ]}
            />
          </div>
        </div>

        {/* Tools Menu */}
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3 flex items-center">
            <div className="w-4 h-px bg-border mr-2"></div>
            Herramientas
          </h2>
          
          <div className="space-y-1">
            <SidebarItem
              icon={<Zap />}
              title="Generador Manual"
              href="/manual-question-generator"
              active={pathname === '/manual-question-generator'}
            />
            
            <SidebarItem
              icon={<CheckSquare />}
              title="Validador Avanzado"
              href="/validator-chat"
              active={pathname === '/validator-chat'}
              isNew={true}
            />
            
            <SidebarItem
              icon={<Eye />}
              title="Visor GIFT"
              href="/gift-viewer"
              active={pathname === '/gift-viewer'}
            />
            
            <SidebarItem
              icon={<UploadCloud />}
              title="Importar Moodle"
              href="/admin/moodle-import"
              active={pathname === '/admin/moodle-import'}
              badge="Beta"
            />
            
            <SidebarItem
              icon={<History />}
              title="Historial"
              href="/history"
              active={pathname === '/history'}
            />
          </div>
        </div>

        {/* Configuration Menu */}
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3 flex items-center">
            <div className="w-4 h-px bg-border mr-2"></div>
            Configuración
          </h2>
          
          <div className="space-y-1">
            <SidebarItem
              icon={<BrainCircuit />}
              title="Configuración IA"
              href="/ai-settings"
              active={pathname === '/ai-settings'}
              badge="IA"
            />
            
            <SidebarItem
              icon={<BarChart3 />}
              title="Taxonomía de Bloom"
              href="/bloom"
              active={pathname === '/bloom'}
            />
          </div>
        </div>

        {/* Administration Menu */}
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3 flex items-center">
            <div className="w-4 h-px bg-border mr-2"></div>
            Administración
          </h2>
          
          <div className="space-y-1">
            <SidebarItem
              icon={<Shield />}
              title="Panel Admin"
              href="/admin"
              active={pathname === '/admin'}
              badge="Admin"
            />
            
            <SidebarItem
              icon={<MessageSquare />}
              title="Logs de Telegram"
              href="/admin/telegram-logs"
              active={pathname === '/admin/telegram-logs'}
            />
            
            <SidebarItem
              icon={<Terminal />}
              title="Panel Avanzado"
              href="/(admin_panel)"
              active={pathname === '/(admin_panel)'}
              badge="Pro"
            />
          </div>
        </div>
        
        {/* Help & Support */}
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3 flex items-center">
            <div className="w-4 h-px bg-border mr-2"></div>
            Ayuda y Soporte
          </h2>
          
          <div className="space-y-1">
            <SidebarItem
              icon={<Book />}
              title="Guía de Uso"
              href="/guide"
              active={pathname === '/guide'}
            />
            
            <SidebarItem
              icon={<HelpCircle />}
              title="Soporte"
              href="/support"
              active={pathname === '/support'}
            />
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="px-4 pt-6 border-t border-border/50">
        <Link 
          href="/logout" 
          className="flex items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg transition-all duration-200 group"
        >
          <LogOut className="w-5 h-5 group-hover:text-destructive transition-colors duration-200" />
          <span className="font-medium">Cerrar Sesión</span>
        </Link>
      </div>
    </div>
  );
} 