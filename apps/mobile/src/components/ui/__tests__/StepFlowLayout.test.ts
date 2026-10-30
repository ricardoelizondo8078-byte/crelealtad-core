import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { useResponsiveLayout } from '../ResponsiveContent';
import {
  getStepFlowItemState,
  StepFlowLayout,
  type StepFlowItem,
} from '../StepFlowLayout';

jest.mock('../ResponsiveContent', () => ({
  useResponsiveLayout: jest.fn(),
}));

const mockUseResponsiveLayout = jest.mocked(useResponsiveLayout);

describe('StepFlowLayout', () => {
  const complete: StepFlowItem = { id: 1, title: 'Información personal', complete: true };
  const pending: StepFlowItem = { id: 3, title: 'Referencias', complete: false };

  it('prioritizes the current step over its completion flag', () => {
    expect(getStepFlowItemState(complete, 1)).toBe('current');
  });

  it('distinguishes completed and pending steps', () => {
    expect(getStepFlowItemState(complete, 2)).toBe('complete');
    expect(getStepFlowItemState(pending, 2)).toBe('pending');
  });

  it('shows the step rail beside the active content on desktop', async () => {
    mockUseResponsiveLayout.mockReturnValue({
      width: 1440,
      height: 900,
      isTablet: true,
      isDesktop: true,
      isWide: true,
      gutter: 32,
    });

    const view = await render(React.createElement(
      StepFlowLayout,
      {
        currentStepId: 2,
        moduleTheme: 'documentation',
        steps: [complete, { ...pending, id: 2, title: 'Domicilio' }],
      },
      React.createElement(Text, null, 'Contenido activo'),
    ));

    expect(view.getByText('Pasos de la solicitud')).toBeTruthy();
    expect(view.getByText('Información personal')).toBeTruthy();
    expect(view.getByText('Domicilio')).toBeTruthy();
    expect(view.getByText('Contenido activo')).toBeTruthy();
  });

  it('keeps only the active content on mobile', async () => {
    mockUseResponsiveLayout.mockReturnValue({
      width: 390,
      height: 844,
      isTablet: false,
      isDesktop: false,
      isWide: false,
      gutter: undefined,
    });

    const view = await render(React.createElement(
      StepFlowLayout,
      {
        currentStepId: 2,
        moduleTheme: 'documentation',
        steps: [complete, pending],
      },
      React.createElement(Text, null, 'Contenido móvil'),
    ));

    expect(view.queryByText('Pasos de la solicitud')).toBeNull();
    expect(view.getByText('Contenido móvil')).toBeTruthy();
  });
});
