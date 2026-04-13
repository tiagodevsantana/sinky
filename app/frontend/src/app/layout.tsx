import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Smart To-Do — Sinky',
  description: 'Lista de tarefas inteligente com geração por IA',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          backgroundColor: '#f9fafb',
          minHeight: '100vh',
        }}
      >
        {children}
      </body>
    </html>
  );
}
