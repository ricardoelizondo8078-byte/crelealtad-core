import React from 'react';
import { Modal } from 'react-native';
import { usePendingReviews } from '../../context/PendingReviewsContext';
import { PendingReviewsScreen } from './PendingReviewsScreen';

export const PendingReviewOverlay: React.FC = () => {
  const { inboxVisible, closeInbox } = usePendingReviews();

  return (
    <Modal
      animationType="slide"
      presentationStyle="fullScreen"
      visible={inboxVisible}
      onRequestClose={closeInbox}
    >
      <PendingReviewsScreen />
    </Modal>
  );
};
