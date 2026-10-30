import { fireEvent, render } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';
import { FinancieraProductMarketFields } from '../FinancieraProductMarketFields';

const producto = {
  semanas: '',
  tasa: '',
  seguro: '',
  apertura: '',
  retencion: '',
  base: '',
  refinanciamiento: '',
  descripcion: '',
};

describe('FinancieraProductMarketFields', () => {
  it('previsualiza el número en el scroll y sólo lo aplica al confirmar', async () => {
    const onProductoChange = jest.fn();
    const onNumeroSucursalesChange = jest.fn();
    const onSucursalChange = jest.fn();
    const view = await render(
      <FinancieraProductMarketFields
        producto={producto}
        numeroSucursales="2"
        sucursales={[
          { zona: '', direccion: '', numeroAsesoras: '', valorSucursal: '' },
          { zona: '', direccion: '', numeroAsesoras: '', valorSucursal: '' },
        ]}
        onProductoChange={onProductoChange}
        onNumeroSucursalesChange={onNumeroSucursalesChange}
        onSucursalChange={onSucursalChange}
      />,
    );

    expect(view.getByText('PRODUCTO')).toBeTruthy();
    expect(view.getByText('PARTICIPACIÓN MERCADO')).toBeTruthy();
    const descripcion = view.getByLabelText('Descripción');
    expect(descripcion.props.multiline).toBe(true);
    expect(descripcion.props.maxLength).toBe(10000);
    expect(view.getByText('Sucursal 1')).toBeTruthy();
    expect(view.getByText('Sucursal 2')).toBeTruthy();

    await fireEvent.press(view.getByRole('button', { name: 'Número de sucursales. 2' }));

    await fireEvent.press(view.getByRole('radio', { name: '3' }));

    expect(
      view.getAllByRole('radio').filter(
        (option) => option.props.accessibilityState.checked,
      ),
    ).toHaveLength(1);
    expect(view.getAllByRole('radio').find(
      (option) => option.props.accessibilityState.checked,
    )).toHaveTextContent(/^3/);
    expect(onNumeroSucursalesChange).not.toHaveBeenCalled();

    expect(view.getByRole('radio', { name: '0' })).toBeTruthy();
    expect(view.getByRole('radio', { name: '10' })).toBeTruthy();
    await fireEvent.press(view.getByRole('button', { name: 'Confirmar selección' }));
    expect(onNumeroSucursalesChange).toHaveBeenCalledWith('3');

    await fireEvent.changeText(view.getByLabelText('Zona de sucursal 2'), 'Sur');
    expect(onSucursalChange).toHaveBeenCalledWith(1, 'zona', 'Sur');

    await fireEvent.changeText(descripcion, 'Texto libre\ncon varios párrafos');
    expect(onProductoChange).toHaveBeenCalledWith(
      'descripcion',
      'Texto libre\ncon varios párrafos',
    );
  }, 60000);
});
