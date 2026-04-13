'use client';

import { useState } from 'react';

interface Props {
  onCreate: (title: string) => Promise<void>;
}

export default function TaskForm({ onCreate }: Props) {
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // BUG-002: Validação sem .trim() — títulos compostos apenas de espaços são aceitos
    if (!title) return;
    setIsSubmitting(true);
    try {
      await onCreate(title);
      setTitle('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} data-testid="task-form">
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <input
          data-testid="task-title-input"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Adicionar nova tarefa..."
          disabled={isSubmitting}
          style={{
            flex: 1,
            padding: '10px 14px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          data-testid="task-submit-button"
          disabled={isSubmitting}
          style={{
            padding: '10px 20px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
          }}
        >
          {isSubmitting ? 'Adicionando...' : 'Adicionar'}
        </button>
      </div>
    </form>
  );
}
