import { useContext } from 'react';
import ChatContext from '../context/chatContextInstance';

export const useChatContext = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return ctx;
};

export default useChatContext;
