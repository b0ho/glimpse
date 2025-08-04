import { IsString, IsEnum, IsOptional, IsObject } from 'class-validator';

export enum CallEventType {
  ACCEPT = 'ACCEPT',
  REJECT = 'REJECT',
  END = 'END',
  ICE_CANDIDATE = 'ICE_CANDIDATE',
  OFFER = 'OFFER',
  ANSWER = 'ANSWER',
  MUTE_AUDIO = 'MUTE_AUDIO',
  UNMUTE_AUDIO = 'UNMUTE_AUDIO',
  MUTE_VIDEO = 'MUTE_VIDEO',
  UNMUTE_VIDEO = 'UNMUTE_VIDEO',
}

export class CallEventDto {
  @IsString()
  callId: string;

  @IsEnum(CallEventType)
  type: CallEventType;

  @IsOptional()
  @IsObject()
  data?: any;
}