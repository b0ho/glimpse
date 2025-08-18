import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
  UseGuards,
  Req,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PersonaService } from './persona.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePersonaDto, UpdatePersonaDto, UpdateLocationDto, GetNearbyPersonasDto } from './dto/persona.dto';

@ApiTags('persona')
@Controller('persona')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PersonaController {
  constructor(private readonly personaService: PersonaService) {}

  @Post()
  @ApiOperation({ summary: 'Create or update persona' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Persona created/updated successfully' })
  async createOrUpdatePersona(@Req() req: any, @Body() dto: CreatePersonaDto) {
    const persona = await this.personaService.createOrUpdate(req.user.id, dto);
    return {
      success: true,
      data: persona,
    };
  }

  @Get('me')
  @ApiOperation({ summary: 'Get my persona' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns current user persona' })
  async getMyPersona(@Req() req: any) {
    const persona = await this.personaService.getMyPersona(req.user.id);
    return {
      success: true,
      data: persona,
    };
  }

  @Put('toggle')
  @ApiOperation({ summary: 'Toggle persona active status' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Persona status toggled' })
  async togglePersona(@Req() req: any, @Body() body: { isActive: boolean }) {
    const persona = await this.personaService.togglePersona(req.user.id, body.isActive);
    return {
      success: true,
      data: persona,
    };
  }

  @Delete()
  @ApiOperation({ summary: 'Delete persona' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Persona deleted' })
  async deletePersona(@Req() req: any) {
    await this.personaService.deletePersona(req.user.id);
    return {
      success: true,
      message: 'Persona deleted successfully',
    };
  }

  @Post('location')
  @ApiOperation({ summary: 'Update user location' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Location updated' })
  async updateLocation(@Req() req: any, @Body() dto: UpdateLocationDto) {
    // This endpoint will be called every 5 minutes by the mobile app
    await this.personaService.updateLocation(req.user.id, dto);
    return {
      success: true,
      message: 'Location updated',
    };
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Get nearby personas' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Returns nearby personas within radius' })
  async getNearbyPersonas(@Req() req: any, @Query() query: GetNearbyPersonasDto) {
    const personas = await this.personaService.getNearbyPersonas(
      req.user.id,
      query.latitude,
      query.longitude,
      query.radiusKm || 5,
    );
    return {
      success: true,
      data: personas,
    };
  }
}