'use client';

import { useTasks } from '@/hooks/useTasks';
import Header from '@/components/Header';
import TaskForm from '@/components/TaskForm';
import TaskList from '@/components/TaskList';
import AiGenerator from '@/components/AiGenerator';

export default function HomePage() {
  const { tasks, isLoading, createTask, toggleComplete, deleteTask, addAiTasks } = useTasks();

  return (
    <main style={{ maxWidth: '680px', margin: '0 auto', padding: '32px 16px' }}>
      {/* BUG-005: tasks.length é passado uma única vez na montagem — Header não reage a mudanças posteriores */}
      <Header taskCount={tasks.length} />

      <AiGenerator onTasksAdded={addAiTasks} />

      <TaskForm onCreate={createTask} />

      <TaskList
        tasks={tasks}
        isLoading={isLoading}
        onToggle={toggleComplete}
        onDelete={deleteTask}
      />
    </main>
  );
}
