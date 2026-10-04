import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsuarioEstado } from '../catalogos/entities/usuario.entity';

describe('AuthService - login por abreviatura y PIN', () => {
  const queryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
  };
  const usuariosRepo = {
    createQueryBuilder: jest.fn(() => queryBuilder),
    manager: {
      transaction: jest.fn(),
    },
  };
  const transactionManager = {
    findOne: jest.fn(),
    update: jest.fn(),
    query: jest.fn(),
  };
  const jwtService = {
    sign: jest.fn(() => 'jwt-prueba'),
    verify: jest.fn(),
  };

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    queryBuilder.where.mockReturnThis();
    queryBuilder.leftJoinAndSelect.mockReturnThis();
    usuariosRepo.manager.transaction.mockImplementation(async (callback) => (
      callback(transactionManager)
    ));
    service = new AuthService(usuariosRepo as never, jwtService as never);
  });

  it('normaliza la abreviatura y autentica contra el hash individual', async () => {
    queryBuilder.getOne.mockResolvedValue({
      id: 'usuario-1',
      nombre: 'Asesor de prueba',
      abreviatura: 'ANA_VAZQUEZ',
      password_hash: await bcrypt.hash('1234', 4),
      rol_id: 'rol-asesor',
      sucursal_id: 'sucursal-matriz',
      estado: UsuarioEstado.ACTIVO,
      requiere_cambio_pin: true,
      rol: {
        nombre: 'ASESOR',
        estado: 'ACTIVO',
        permisos: {
          modulos: ['documentacion', 'expedientes', 'solicitudes'],
          acciones: ['crear', 'leer', 'actualizar'],
        },
      },
    });

    const result = await service.login({ abreviatura: ' ana_vazquez ', pin: '1234' });

    expect(queryBuilder.where).toHaveBeenCalledWith(
      'UPPER(usuario.abreviatura) = :abreviatura',
      { abreviatura: 'ANA_VAZQUEZ' },
    );
    expect(result.usuario.abreviatura).toBe('ANA_VAZQUEZ');
    expect(result.usuario.rol_nombre).toBe('ASESOR');
    expect(result.usuario.requiere_cambio_pin).toBe(true);
    expect(result.usuario.permisos.modulos).toContain('documentacion');
    expect(result.token).toBe('jwt-prueba');
    expect(transactionManager.update).toHaveBeenCalledWith(
      expect.any(Function),
      'usuario-1',
      expect.objectContaining({ ultimo_login: expect.any(Date) }),
    );
    expect(transactionManager.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO audit_log'),
      expect.arrayContaining([
        'usuarios',
        'usuario-1',
        'LOGIN',
        'usuario-1',
      ]),
    );
  });

  it('rechaza 1234 cuando el hash individual pertenece a otro PIN', async () => {
    queryBuilder.getOne.mockResolvedValue({
      id: 'usuario-1',
      abreviatura: 'ANA_VAZQUEZ',
      password_hash: await bcrypt.hash('9876', 4),
      estado: UsuarioEstado.ACTIVO,
      rol: { estado: 'ACTIVO', permisos: null },
    });

    await expect(
      service.login({ abreviatura: 'ANA_VAZQUEZ', pin: '1234' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('conserva el nombre del rol y entrega los permisos personalizados efectivos', async () => {
    queryBuilder.getOne.mockResolvedValue({
      id: 'usuario-1',
      nombre: 'Asesor de prueba',
      abreviatura: 'ASESOR_PRUEBA',
      password_hash: await bcrypt.hash('1234', 4),
      rol_id: 'rol-asesor',
      sucursal_id: 'sucursal-matriz',
      estado: UsuarioEstado.ACTIVO,
      requiere_cambio_pin: false,
      permisos_personalizados: {
        modulos: ['documentacion', 'expedientes', 'solicitudes'],
        acciones: ['crear', 'leer', 'actualizar'],
      },
      rol: {
        nombre: 'ASESOR',
        estado: 'ACTIVO',
        permisos: {
          modulos: ['documentacion', 'expedientes', 'solicitudes', 'verificacion'],
          acciones: ['crear', 'leer', 'actualizar'],
        },
      },
    });

    const result = await service.login({ abreviatura: 'ASESOR_PRUEBA', pin: '1234' });

    expect(result.usuario.rol_nombre).toBe('ASESOR');
    expect(result.usuario.permisos.modulos).not.toContain('verificacion');
    expect(result.usuario.permisos.modulos).toContain('documentacion');
  });

  it('rechaza un asesor inactivo aunque el PIN sea correcto', async () => {
    queryBuilder.getOne.mockResolvedValue({
      id: 'usuario-1',
      abreviatura: 'ANA_VAZQUEZ',
      password_hash: await bcrypt.hash('1234', 4),
      estado: UsuarioEstado.INACTIVO,
      rol: { estado: 'ACTIVO', permisos: null },
    });

    await expect(
      service.login({ abreviatura: 'ANA_VAZQUEZ', pin: '1234' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('cambia el PIN en una transacción y audita sólo metadatos no sensibles', async () => {
    transactionManager.findOne.mockResolvedValue({
      id: 'usuario-1',
      password_hash: await bcrypt.hash('1234', 4),
      estado: UsuarioEstado.ACTIVO,
      requiere_cambio_pin: true,
    });

    await expect(service.cambiarPin('usuario-1', {
      pin_actual: '1234',
      nuevo_pin: '5678',
      confirmacion_pin: '5678',
    })).resolves.toEqual({ requiere_cambio_pin: false });

    expect(transactionManager.findOne).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        where: { id: 'usuario-1' },
        lock: { mode: 'pessimistic_write' },
      }),
    );
    const update = transactionManager.update.mock.calls[0][2] as {
      password_hash: string;
      requiere_cambio_pin: boolean;
    };
    expect(update.requiere_cambio_pin).toBe(false);
    await expect(bcrypt.compare('5678', update.password_hash)).resolves.toBe(true);

    const auditoriaSerializada = JSON.stringify(transactionManager.query.mock.calls);
    expect(auditoriaSerializada).toContain('CAMBIO_PIN');
    expect(auditoriaSerializada).not.toContain('1234');
    expect(auditoriaSerializada).not.toContain('5678');
    expect(auditoriaSerializada).not.toContain(update.password_hash);
  });

  it('rechaza un PIN actual incorrecto sin actualizar la credencial', async () => {
    transactionManager.findOne.mockResolvedValue({
      id: 'usuario-1',
      password_hash: await bcrypt.hash('1234', 4),
      estado: UsuarioEstado.ACTIVO,
      requiere_cambio_pin: true,
    });

    await expect(service.cambiarPin('usuario-1', {
      pin_actual: '9999',
      nuevo_pin: '5678',
      confirmacion_pin: '5678',
    })).rejects.toBeInstanceOf(BadRequestException);
    expect(transactionManager.update).not.toHaveBeenCalled();
  });

  it('rechaza confirmación diferente y reutilización del PIN actual', async () => {
    await expect(service.cambiarPin('usuario-1', {
      pin_actual: '1234',
      nuevo_pin: '5678',
      confirmacion_pin: '0000',
    })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.cambiarPin('usuario-1', {
      pin_actual: '1234',
      nuevo_pin: '1234',
      confirmacion_pin: '1234',
    })).rejects.toBeInstanceOf(BadRequestException);
    expect(usuariosRepo.manager.transaction).not.toHaveBeenCalled();
  });
});
