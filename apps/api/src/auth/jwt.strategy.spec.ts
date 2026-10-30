import { JwtStrategy } from './jwt.strategy';
import { UsuarioEstado } from '../catalogos/entities/usuario.entity';

describe('JwtStrategy - acceso universal de desarrollo', () => {
  const usuariosRepo = {
    findOne: jest.fn(),
  };
  const originalNodeEnv = process.env.NODE_ENV;
  const originalDevUniversalPin = process.env.DEV_UNIVERSAL_PIN;
  let strategy: JwtStrategy;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'test';
    delete process.env.DEV_UNIVERSAL_PIN;
    strategy = new JwtStrategy(usuariosRepo as never);
    usuariosRepo.findOne.mockResolvedValue({
      id: 'usuario-1',
      estado: UsuarioEstado.ACTIVO,
      rol: { estado: 'ACTIVO' },
    });
  });

  afterAll(() => {
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
    if (originalDevUniversalPin === undefined) delete process.env.DEV_UNIVERSAL_PIN;
    else process.env.DEV_UNIVERSAL_PIN = originalDevUniversalPin;
  });

  it('conserva la excepción del JWT cuando el acceso universal sigue habilitado', async () => {
    process.env.NODE_ENV = 'development';
    process.env.DEV_UNIVERSAL_PIN = '2468';

    const usuario = await strategy.validate({
      sub: 'usuario-1',
      abreviatura: 'ASESOR_PRUEBA',
      rol: 'rol-asesor',
      acceso_pin_universal_desarrollo: true,
    });

    expect(usuario.acceso_pin_universal_desarrollo).toBe(true);
  });

  it('ignora la excepción del JWT fuera de desarrollo', async () => {
    process.env.NODE_ENV = 'production';
    process.env.DEV_UNIVERSAL_PIN = '2468';

    const usuario = await strategy.validate({
      sub: 'usuario-1',
      abreviatura: 'ASESOR_PRUEBA',
      rol: 'rol-asesor',
      acceso_pin_universal_desarrollo: true,
    });

    expect(usuario.acceso_pin_universal_desarrollo).toBe(false);
  });
});
