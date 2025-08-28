import Link from 'next/link';
import React from 'react';
import { ArrowLeft } from 'lucide-react';

const AdminNavbar: React.FC = () => {
  return (
    <nav className="bg-card border-b border-border p-4 shadow-sm">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-semibold text-foreground">Panel de Administración</h1>
        <Link href="/" legacyBehavior>
          <a className="flex items-center text-sm text-primary hover:underline">
            <ArrowLeft size={18} className="mr-1" />
            Volver al Inicio
          </a>
        </Link>
        {/* Futuros enlaces de administración podrían ir aquí */}
      </div>
    </nav>
  );
};

export default AdminNavbar; 