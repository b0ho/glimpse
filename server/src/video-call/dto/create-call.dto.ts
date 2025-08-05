import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum CallType {
  VIDEO = 'VIDEO',
  VOICE = 'VOICE',
}

export class CreateCallDto {
  @IsString()
  recipientId: string;

  @IsEnum(CallType)
  type: CallType;

  @IsOptional()
  @IsString()
  matchId?: string;
}
