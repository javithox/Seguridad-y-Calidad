// src/pages/auth/Login.test.jsx
import '@testing-library/jest-dom'; // <--- Importa esto
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Login from './Login';

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    role: null,
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

describe('Componente Login', () => {
  it('debe renderizar los campos de usuario y contraseña', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    expect(screen.getByLabelText(/nombre de usuario/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
  });

  it('debe actualizar el valor del campo de usuario al escribir', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const inputUsuario = screen.getByLabelText(/nombre de usuario/i);
    await user.type(inputUsuario, 'admin');

    expect(inputUsuario).toHaveValue('admin');
  });
});