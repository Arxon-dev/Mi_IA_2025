import React from 'react';
import AdminNavbar from '@/components/nav/AdminNavbar'; // Ajusta la ruta si es necesario

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <AdminNavbar />
      <main className="flex-1 p-6">
        {children}
      </main>
      {/* Podrías añadir un AdminFooter aquí si lo necesitas en el futuro */}
    </div>
  );
};

export default AdminLayout; 