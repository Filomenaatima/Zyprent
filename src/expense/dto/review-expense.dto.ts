import { IsIn, IsOptional, IsString } from 'class-validator';

export class ReviewExpenseDto {
  @IsIn(['APPROVE', 'REJECT'])
  action!: 'APPROVE' | 'REJECT';

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}