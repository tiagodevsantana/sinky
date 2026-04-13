import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateTasksDto {
  @ApiProperty({ example: 'Lançar um novo produto de software' })
  @IsString()
  @IsNotEmpty()
  objective: string;

  @ApiProperty({ example: 'sk-or-v1-...' })
  @IsString()
  @IsNotEmpty()
  apiKey: string;
}
