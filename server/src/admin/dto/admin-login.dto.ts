import { IsEmail, IsString, MinLength } from 'class-validator';

export class AdminLoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class AdminTokenResponseDto {
  access_token: string;
  user: {
    email: string;
    name: string;
    role: string;
    permissions: string[];
  };
}