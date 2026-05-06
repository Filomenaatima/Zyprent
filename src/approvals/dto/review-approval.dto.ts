import { IsIn, IsOptional, IsString } from 'class-validator';

export class ReviewApprovalDto {
  @IsIn(['APPROVE', 'REJECT'])
  action!: 'APPROVE' | 'REJECT';

  @IsOptional()
  @IsString()
  reason?: string;
}