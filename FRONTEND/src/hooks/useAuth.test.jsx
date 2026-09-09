import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useAuth } from './useAuth';
// Ajusta la ruta al archivo exacto donde creaste AuthProvider (ej: AuthContext.jsx)
import AuthProvider from '../context/AuthContext'; 

describe('Hook useAuth', () => {
  it('debe inicializarse sin usuario autenticado', () => {
    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBeNull();
  });
});