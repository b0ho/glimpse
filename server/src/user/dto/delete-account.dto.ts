import { IsOptional, IsString, IsEnum } from 'class-validator';

export class DeleteAccountDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

export class RestoreAccountDto {
  @IsOptional()
  @IsString()
  confirmation?: string;
}

export enum DeletionStatus {
  ACTIVE = 'ACTIVE',
  DELETION_REQUESTED = 'DELETION_REQUESTED', 
  PERMANENTLY_DELETED = 'PERMANENTLY_DELETED'
}

export interface AccountDeletionInfo {
  status: DeletionStatus;
  requestedAt?: Date;
  scheduledDeletionAt?: Date;
  reason?: string;
  daysRemaining?: number;
}