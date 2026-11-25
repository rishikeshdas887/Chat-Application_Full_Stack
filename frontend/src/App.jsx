import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import AuthPage from './pages/AuthPage';
import ChatPage from './pages/ChatPage';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ChatProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<AuthPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ChatProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
