import { fireEvent, render } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';
import { ProcessingProvider } from '../../../context/ProcessingContext';
import { VerificationProcessMenu } from '../VerificationProcessMenu';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

describe('menú de procesos de Verificación', () => {
  it('habilita Conclusiones y abre su captura existente', async () => {
    const onSelect = jest.fn();
    const view = await render(
      <ProcessingProvider>
        <VerificationProcessMenu onSelect={onSelect} />
      </ProcessingProvider>,
    );

    const conclusiones = view.getByRole('button', { name: 'Conclusiones' });

    expect(conclusiones.props.accessibilityState).toEqual({ disabled: false });
    fireEvent.press(conclusiones);
    expect(onSelect).toHaveBeenCalledWith('observaciones');
  });

  it('muestra el tipo calculado y distingue procesos obligatorios de opcionales', async () => {
    const view = await render(
      <ProcessingProvider>
        <VerificationProcessMenu
          onSelect={jest.fn()}
          requisitos={{
            tipo_integrante: 'CICLO_2_MAS_CON_EVIDENCIA',
            tiene_historial_crelealtad: true,
            tiene_evidencia_otra_financiera: true,
            matriz_revision: 2,
            pasos: [
              { tipo_integrante: 'CICLO_2_MAS_CON_EVIDENCIA', paso: 'DOCUMENTOS', modalidad: 'OBLIGATORIO', dias_para_obligatorio: null },
              { tipo_integrante: 'CICLO_2_MAS_CON_EVIDENCIA', paso: 'LLAMADA', modalidad: 'OBLIGATORIO_DESPUES_DIAS', dias_para_obligatorio: 30 },
              { tipo_integrante: 'CICLO_2_MAS_CON_EVIDENCIA', paso: 'VISITA_VECINO', modalidad: 'OBLIGATORIO', dias_para_obligatorio: null },
              { tipo_integrante: 'CICLO_2_MAS_CON_EVIDENCIA', paso: 'IMAGENES_DOMICILIO', modalidad: 'OBLIGATORIO', dias_para_obligatorio: null },
              { tipo_integrante: 'CICLO_2_MAS_CON_EVIDENCIA', paso: 'ENTREVISTA', modalidad: 'OBLIGATORIO', dias_para_obligatorio: null },
              { tipo_integrante: 'CICLO_2_MAS_CON_EVIDENCIA', paso: 'CONCLUSIONES', modalidad: 'OPCIONAL', dias_para_obligatorio: null },
            ],
          }}
        />
      </ProcessingProvider>,
    );

    expect(view.getByText('Ciclo 2+ con evidencia para aumento')).toBeTruthy();
    expect(view.getAllByText('Opcional')).toHaveLength(1);
    expect(view.getByText('Después de 30 días')).toBeTruthy();
    expect(view.getAllByText('Siempre')).toHaveLength(4);
  });
});
