import { IsString } from 'class-validator';

export class AssignResidentDto {
  @IsString()
  unitId!: string;
}
