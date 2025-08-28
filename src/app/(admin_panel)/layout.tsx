import React from 'react';
import AdminNavbar from '@/components/nav/AdminNavbar'; // La barra de navegación que creamos para admin

// Nota: No importamos ni usamos el Sidebar principal aquí

export default function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Usaremos solo AdminNavbar como header principal para esta sección para maximizar espacio */}
      <AdminNavbar />
      
      <main className="flex-1 w-full p-6 backdrop-blur-md flex flex-col">
        {/* El RootLayout en src/app/layout.tsx ya provee el fondo y color de texto base */}
        {/* El padding p-6 es el mismo que el del RootLayout, puedes ajustarlo si necesitas algo diferente aquí */}
        {children}
      </main>
    </>
  );
} 