import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
  ) {}

  async findAll(): Promise<Task[]> {
    // BUG-008: Sem ORDER BY — a ordem das tarefas é não determinística
    return this.tasksRepository.find();
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.tasksRepository.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException({ error: 'Task not found' });
    }
    return task;
  }

  async create(dto: CreateTaskDto, isAiGenerated = false): Promise<Task> {
    const task = this.tasksRepository.create({ ...dto, isAiGenerated });
    return this.tasksRepository.save(task);
  }

  async update(id: string, dto: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(id);
    Object.assign(task, dto);
    return this.tasksRepository.save(task);
  }

  async remove(id: string): Promise<void> {
    // BUG-004: Sem verificação de existência — DELETE em ID inexistente retorna 200 OK
    await this.tasksRepository.delete(id);
  }
}
