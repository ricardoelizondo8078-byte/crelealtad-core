import { Controller, Get, Param, Patch, Post, Body, NotFoundException } from '@nestjs/common';
import { ExpedientesService } from './expedientes.service';
import { CreateExpedienteDto } from './dto/create-expediente.dto';

@Controller('expedientes')
export class ExpedientesController {
  constructor(private readonly expedientesService: ExpedientesService) {}

  @Post()
  create(@Body() dto: CreateExpedienteDto) {
    return this.expedientesService.createForGroup(dto);
  }

  @Get()
  listAll() {
    return this.expedientesService.listAll();
  }

  @Get('group/:groupId')
  listByGroup(@Param('groupId') groupId: string) {
    return this.expedientesService.listByGroup(groupId);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.expedientesService.getById(id);
  }

  @Get(':id/integrantes')
  getIntegrantes(@Param('id') id: string) {
    return this.expedientesService.getIntegrantes(id);
  }

  @Patch(':id/send-to-verification')
  async sendToVerification(@Param('id') id: string) {
    const expediente = await this.expedientesService.sendToVerification(id);
    if (!expediente) {
      throw new NotFoundException('Expediente no encontrado');
    }
    return expediente;
  }
}
