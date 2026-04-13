'use client';

import { useState } from 'react';
import { Task } from '@/lib/types';
import api from '@/lib/api';

interface Props {
  onTasksAdded: (tasks: Task[]) => void;
}

export default function AiGenerator({ onTasksAdded }: Props) {
  const [objective, setObjective] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (!objective.trim()) return;
    setIsLoading(true);
    try {
      const { data } = await api.post<Task[]>('/ai/generate', { objective, apiKey });
      onTasksAdded(data);
      setObjective('');
    } catch (err) {
      // BUG-003: Erro capturado mas nenhum estado de erro é atualizado na UI.
      // O spinner desaparece e nada acontece — usuário não recebe feedback de falha.
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      data-testid="ai-generator"
      style={{
        backgroundColor: '#f5f3ff',
        border: '1px solid #ddd6fe',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px',
      }}
    >
      <h2 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 700, color: '#5b21b6' }}>
        Gerar tarefas com IA
      </h2>
      <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#7c3aed' }}>
        Descreva um objetivo e a IA irá decompô-lo em subtarefas acionáveis.
      </p>

      <input
        data-testid="ai-api-key-input"
        type="password"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder="Sua API Key do OpenRouter (sk-or-v1-...)"
        style={{
          width: '100%',
          padding: '10px 14px',
          border: '1px solid #c4b5fd',
          borderRadius: '8px',
          fontSize: '13px',
          marginBottom: '10px',
          boxSizing: 'border-box',
          outline: 'none',
        }}
      />

      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          data-testid="ai-objective-input"
          type="text"
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          placeholder="Ex: Lançar um novo produto de software"
          onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          style={{
            flex: 1,
            padding: '10px 14px',
            border: '1px solid #c4b5fd',
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none',
          }}
        />
        {/* BUG-010: Botão não é desabilitado durante loading — cliques múltiplos disparam chamadas duplicadas */}
        <button
          data-testid="ai-generate-button"
          onClick={handleGenerate}
          style={{
            padding: '10px 20px',
            backgroundColor: '#7c3aed',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {/* BUG-014: Texto genérico "Carregando..." sem contexto de que a IA está processando */}
          {isLoading ? 'Carregando...' : 'Gerar tarefas'}
        </button>
      </div>
    </div>
  );
}
