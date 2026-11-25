import React from 'react';
import UsernamePasswordForm from './UsernamePasswordForm';

const LoginForm = ({ onSubmit, isLoading, error }) => {
  return (
    <UsernamePasswordForm
      onLogin={onSubmit}
      onBack={() => {}}
      isLoading={isLoading}
      error={error}
    />
  );
};

export default LoginForm;
