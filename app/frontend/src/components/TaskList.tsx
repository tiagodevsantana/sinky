'use client';

import { Task } from '@/lib/types';
import TaskItem from './TaskItem';

interface Props {
  tasks: Task[];
  isLoading: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function TaskList({ tasks, isLoading, onToggle, onDelete }: Props) {
  if (isLoading) {
    return (
      <div data-testid="tasks-loading" style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
        Carregando tarefas...
      </div>
    );
  }

  // BUG-012: Sem empty state — quando não há tarefas, a lista renderiza apenas uma <ul> vazia
  // O usuário não recebe nenhum feedback ou call-to-action

  return (
    <ul data-testid="task-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} />
      ))}
    </ul>
  );
}
