import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { TasksService } from '../tasks/tasks.service';
import { GenerateTasksDto } from './generate-tasks.dto';

@ApiTags('ai')
@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly tasksService: TasksService,
  ) {}

  @Post('generate')
  @ApiOperation({ summary: 'Gera subtarefas a partir de um objetivo usando IA' })
  @ApiResponse({ status: 201, description: 'Tarefas geradas e salvas com sucesso.' })
  @ApiResponse({ status: 400, description: 'Erro ao interpretar resposta da IA ou payload inválido.' })
  @ApiResponse({ status: 401, description: 'API Key inválida ou sem permissão.' })
  async generate(@Body() dto: GenerateTasksDto) {
    const titles = await this.aiService.generateSubtasks(dto.objective, dto.apiKey);
    const tasks = await Promise.all(
      titles.map((title) => this.tasksService.create({ title }, true)),
    );
    return tasks;
  }
}
