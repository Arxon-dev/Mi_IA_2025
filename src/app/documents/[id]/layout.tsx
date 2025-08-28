// Layout específico para deshabilitar prerenderizado en rutas dinámicas de documentos
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

// Metadatos dinámicos para evitar prerenderizado
export async function generateMetadata() {
  return {
    title: 'Documento',
    description: 'Visualización de documento'
  };
}

export default function DocumentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}