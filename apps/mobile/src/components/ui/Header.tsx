import React from 'react';
import { AppHeader, AppHeaderProps } from './AppHeader';
import { ScreenTitleBar } from './ScreenTitleBar';

export interface HeaderProps extends Omit<AppHeaderProps, 'currentWeek' | 'userRole'> {
  title: string;
  weekLabel?: string;
  testID?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  userName,
  weekLabel = 'Semana actual',
  avatarLabel = 'U',
  onBackPress,
  showBackButton = false,
  testID: _testID,
}) => {
  return (
    <>
      <AppHeader
        userName={userName}
        currentWeek={weekLabel}
        avatarLabel={avatarLabel}
        onBackPress={onBackPress}
        showBackButton={showBackButton}
        moduleTheme="documentation"
      />
      <ScreenTitleBar title={title} moduleTheme="documentation" />
    </>
  );
};

export const HeaderPreview: React.FC = () => (
  <Header
    title="DOCUMENTACIÓN"
    userName="María González"
    avatarLabel="MG"
    weekLabel="Semana 18"
  />
);
