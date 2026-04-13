import { Injectable, BadRequestException } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class AiService {
  async generateSubtasks(objective: string, apiKey: string): Promise<string[]> {
    const prompt = `Você é um assistente de produtividade. Dado o objetivo abaixo, gere entre 4 e 6 subtarefas claras, acionáveis e em português, necessárias para atingir esse objetivo. Responda SOMENTE com um array JSON de strings, sem nenhum texto adicional, sem markdown, sem explicações. Exemplo de formato esperado: ["Subtarefa 1","Subtarefa 2","Subtarefa 3"]\n\nObjetivo: ${objective}`;

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'google/gemma-3-4b-it:free',
        messages: [{ role: 'user', content: prompt }],
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://sinky.com.br',
          'X-Title': 'Sinky Smart Todo',
        },
        timeout: 30000,
      },
    );

    const content: string = response.data?.choices?.[0]?.message?.content ?? '';

    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new BadRequestException('Resposta da IA não pôde ser interpretada como lista de tarefas.');
    }

    const tasks: unknown = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(tasks) || tasks.some((t) => typeof t !== 'string')) {
      throw new BadRequestException('Formato inesperado na resposta da IA.');
    }

    return tasks as string[];
  }
}
