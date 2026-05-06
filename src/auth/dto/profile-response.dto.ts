export class ProfileResponseDto {
  id!: string;
  email?: string | null;
  phone?: string | null;
  name?: string | null;
  role!: string;
  createdAt!: Date;
}