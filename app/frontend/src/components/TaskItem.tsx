'use client';

import { Task } from '@/lib/types';

interface Props {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function TaskItem({ task, onToggle, onDelete }: Props) {
  return (
    <li
      data-testid="task-item"
      data-task-id={task.id}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        marginBottom: '8px',
      }}
    >
      <input
        data-testid="task-checkbox"
        type="checkbox"
        checked={task.isCompleted}
        onChange={() => onToggle(task.id)}
        style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#2563eb' }}
      />

      <span
        data-testid="task-title"
        style={{
          flex: 1,
          fontSize: '14px',
          color: task.isCompleted ? '#9ca3af' : '#111827',
          textDecoration: task.isCompleted ? 'line-through' : 'none',
          wordBreak: 'break-word',
        }}
      >
        {task.title}
      </span>

      {task.isAiGenerated && (
        <span
          data-testid="task-ai-badge"
          style={{
            fontSize: '11px',
            padding: '2px 8px',
            backgroundColor: '#ede9fe',
            color: '#7c3aed',
            borderRadius: '12px',
            whiteSpace: 'nowrap',
          }}
        >
          IA
        </span>
      )}

      {/* BUG-013: Botões de ação sem aria-label — leitores de tela anunciam apenas "botão" */}
      <button
        data-testid="task-delete-button"
        onClick={() => onDelete(task.id)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#ef4444',
          padding: '4px',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
          <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
        </svg>
      </button>
    </li>
  );
}
