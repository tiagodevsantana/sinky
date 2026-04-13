import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateTaskDto {
  // BUG-002: Falta @IsNotEmpty() — títulos com apenas espaços são aceitos
  // BUG-011: Falta @MaxLength() — títulos de qualquer tamanho são aceitos
  @ApiProperty({ example: 'Preparar apresentação de vendas' })
  @IsString()
  title: string;
}
