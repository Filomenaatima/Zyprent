export class UpdateInvestmentDto {
  id!: string;
  status?: 'PENDING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
}