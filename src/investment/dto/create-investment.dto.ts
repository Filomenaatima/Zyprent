export class CreateInvestmentDto {
  propertyId!: string;
  investorId!: string;
  amount!: number;
  status?: 'PENDING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
}