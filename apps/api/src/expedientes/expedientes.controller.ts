import { Controller, Get, Param, Patch } from '@nestjs/common';
import { ExpedientesService } from './expedientes.service';

@Controller('expedientes')
export class ExpedientesController {
  constructor(private readonly expedientesService: ExpedientesService) {}

  @Get('group/:groupId')
  listByGroup(@Param('groupId') groupId: string) {
    return this.expedientesService.listByGroup(groupId);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.expedientesService.getById(id);
  }

  @Patch(':id/send-to-verification')
  sendToVerification(@Param('id') id: string) {
    return this.expedientesService.sendToVerification(id);
  }
}
