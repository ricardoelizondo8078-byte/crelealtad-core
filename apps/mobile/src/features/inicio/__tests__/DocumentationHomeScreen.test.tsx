import { fireEvent, render } from '@testing-library/react-native';
import { describe, expect, it, jest } from '@jest/globals';
import { DocumentationHomeScreen } from '../DocumentationHomeScreen';

jest.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ usuario: null }),
}));

jest.mock('../../../context/PendingReviewsContext', () => ({
  usePendingReviews: () => ({ totalPending: 0, openInbox: jest.fn() }),
}));

jest.mock('../../../context/ProcessingContext', () => ({
  useProcessingAction: (action: unknown) => action,
}));

const createProps = () => ({
  canCreateGroup: true,
  canRenew: true,
  canViewExpedientes: true,
  onBack: jest.fn(),
  onCreateGroup: jest.fn(),
  onRenew: jest.fn(),
  onViewExpedientes: jest.fn(),
});

describe('DocumentationHomeScreen', () => {
  it('presenta las acciones autorizadas con el formato compartido de menú', async () => {
    const props = createProps();
    const view = await render(<DocumentationHomeScreen {...props} />);

    const crearGrupo = view.getByRole('button', {
      name: 'Crear grupo. Inicia un expediente para un grupo nuevo.',
    });
    const renovacion = view.getByRole('button', {
      name: 'Renovación. Inicia el siguiente expediente de un grupo.',
    });
    const expedientes = view.getByRole('button', {
      name: 'Mis expedientes. Continúa con la documentación pendiente.',
    });

    await fireEvent.press(crearGrupo);
    await fireEvent.press(renovacion);
    await fireEvent.press(expedientes);

    expect(props.onCreateGroup).toHaveBeenCalledTimes(1);
    expect(props.onRenew).toHaveBeenCalledTimes(1);
    expect(props.onViewExpedientes).toHaveBeenCalledTimes(1);
  });

  it('oculta acciones sin permiso y conserva el estado vacío', async () => {
    const props = createProps();
    const view = await render(
      <DocumentationHomeScreen
        {...props}
        canCreateGroup={false}
        canRenew={false}
        canViewExpedientes={false}
      />,
    );

    expect(await view.findByText('Sin acciones habilitadas')).toBeTruthy();
    expect(view.queryByText('Crear grupo')).toBeNull();
    expect(view.queryByText('Renovación')).toBeNull();
    expect(view.queryByText('Mis expedientes')).toBeNull();
  });
});
