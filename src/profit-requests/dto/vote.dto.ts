import { IsUUID, IsBoolean } from 'class-validator';

export class VoteDto {
  @IsUUID()
  requestId!: string;

  @IsBoolean()
  vote!: boolean;
}