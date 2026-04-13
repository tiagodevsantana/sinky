import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@ApiTags('tasks')
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'Lista todas as tarefas' })
  @ApiResponse({ status: 200, description: 'Lista de tarefas retornada com sucesso.' })
  findAll() {
    return this.tasksService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma tarefa pelo ID' })
  @ApiResponse({ status: 200, description: 'Tarefa encontrada.' })
  // BUG-009: Erros de "not found" usam shape { error } enquanto erros de validação usam shape NestJS { message, statusCode }
  @ApiResponse({ status: 404, description: 'Tarefa não encontrada.' })
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Cria uma nova tarefa manualmente' })
  @ApiResponse({ status: 201, description: 'Tarefa criada com sucesso.' })
  create(@Body() dto: CreateTaskDto) {
    return this.tasksService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza uma tarefa (título ou status de conclusão)' })
  @ApiResponse({ status: 200, description: 'Tarefa atualizada com sucesso.' })
  update(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove uma tarefa pelo ID' })
  // BUG-004: Retorna 204 mesmo se o ID não existir
  @ApiResponse({ status: 204, description: 'Tarefa removida.' })
  remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }
}
