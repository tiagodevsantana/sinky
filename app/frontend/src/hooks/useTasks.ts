'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { Task } from '@/lib/types';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get<Task[]>('/tasks');
      setTasks(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = async (title: string) => {
    const { data } = await api.post<Task>('/tasks', { title });
    setTasks((prev) => [...prev, data]);
  };

  // BUG-001: toggleComplete atualiza apenas o estado local.
  // A chamada PATCH /tasks/:id está ausente — o estado não é persistido no banco.
  // Após recarregar a página, a tarefa volta ao estado original.
  const toggleComplete = async (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isCompleted: !t.isCompleted } : t)),
    );
  };

  const deleteTask = async (id: string) => {
    await api.delete(`/tasks/${id}`);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const addAiTasks = (newTasks: Task[]) => {
    setTasks((prev) => [...prev, ...newTasks]);
  };

  return { tasks, isLoading, fetchTasks, createTask, toggleComplete, deleteTask, addAiTasks };
}
