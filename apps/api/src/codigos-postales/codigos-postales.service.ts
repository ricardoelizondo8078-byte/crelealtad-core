import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CodigoPostalEntity } from './codigo-postal.entity';

@Injectable()
export class CodigosPostalesService {
  constructor(
    @InjectRepository(CodigoPostalEntity)
    private readonly codigoPostalRepository: Repository<CodigoPostalEntity>,
  ) {}

  /**
   * Buscar colonias por código postal
   */
  async buscarPorCodigo(codigo: string): Promise<CodigoPostalEntity[]> {
    return this.codigoPostalRepository.find({
      where: { codigo },
      order: { colonia: 'ASC' },
    });
  }

  /**
   * Buscar información de una colonia específica
   */
  async buscarPorCodigoYColonia(codigo: string, colonia: string): Promise<CodigoPostalEntity | null> {
    return this.codigoPostalRepository.findOne({
      where: { codigo, colonia },
    });
  }

  /**
   * Buscar colonias por municipio
   */
  async buscarPorMunicipio(municipio: string): Promise<CodigoPostalEntity[]> {
    return this.codigoPostalRepository.find({
      where: { municipio },
      order: { colonia: 'ASC' },
    });
  }
}
