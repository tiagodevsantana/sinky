'use client';

// BUG-005: taskCount recebido como prop estática no momento de montagem do componente.
// Não é reativo — não atualiza quando tarefas são criadas ou deletadas.
interface Props {
  taskCount: number;
}

export default function Header({ taskCount }: Props) {
  return (
    <header
      data-testid="app-header"
      style={{
        backgroundColor: '#1e40af',
        color: 'white',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '32px',
        borderRadius: '12px',
      }}
    >
      <div>
        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>Smart To-Do</h1>
        <p style={{ margin: '4px 0 0', fontSize: '13px', opacity: 0.8 }}>
          Powered by Sinky
        </p>
      </div>
      <span
        data-testid="task-count"
        style={{
          backgroundColor: 'rgba(255,255,255,0.2)',
          padding: '6px 14px',
          borderRadius: '20px',
          fontSize: '13px',
          fontWeight: 600,
        }}
      >
        {taskCount} {taskCount === 1 ? 'tarefa' : 'tarefas'}
      </span>
    </header>
  );
}
