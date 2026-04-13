import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateTaskDto {
  @ApiPropertyOptional({ example: 'Novo título' })
  @IsOptional()
  @IsString()
  title?: string;

  // BUG-007: Falta @IsBoolean() — a API aceita qualquer valor em isCompleted (ex: "banana")
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  isCompleted?: boolean;
}
