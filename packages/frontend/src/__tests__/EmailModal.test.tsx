import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { vi } from 'vitest';

// Mock i18next before importing component
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'email.title': 'Ostatni krok!',
        'email.sub': 'Podaj email, aby zapisać Twój plan.',
        'email.label': 'Adres email',
        'email.placeholder': 'twoj@email.com',
        'email.cta': 'Generuj plan',
        'email.note': 'Nie wyślemy Ci żadnych wiadomości.',
      };
      return map[key] ?? key;
    },
  }),
}));

// Mock AuthContext
const mockIdentify = vi.fn();
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ identify: mockIdentify }),
}));

// Import after mocks
import EmailModal from '../components/modals/EmailModal';

/** Helper: set input value in a way React and RHF both observe */
function setNativeInputValue(input: HTMLElement, value: string) {
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value',
  )?.set;
  nativeInputValueSetter?.call(input, value);
  fireEvent.input(input, { target: { value } });
  fireEvent.change(input, { target: { value } });
}

describe('EmailModal', () => {
  beforeEach(() => {
    mockIdentify.mockReset();
  });

  test('renders title and email label', () => {
    render(<EmailModal onSuccess={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText('Ostatni krok!')).toBeInTheDocument();
    expect(screen.getByText('Adres email')).toBeInTheDocument();
  });

  test('shows error on invalid email', async () => {
    render(<EmailModal onSuccess={vi.fn()} onClose={vi.fn()} />);
    const input = screen.getByPlaceholderText('twoj@email.com');
    setNativeInputValue(input, 'not-an-email');
    await act(async () => {
      fireEvent.submit(input.closest('form')!);
    });
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('calls identify on valid email', async () => {
    mockIdentify.mockResolvedValue(undefined);
    const onSuccess = vi.fn();
    render(<EmailModal onSuccess={onSuccess} onClose={vi.fn()} />);
    const input = screen.getByPlaceholderText('twoj@email.com');
    setNativeInputValue(input, 'test@example.com');
    await act(async () => {
      fireEvent.submit(input.closest('form')!);
    });
    await waitFor(() => {
      expect(mockIdentify).toHaveBeenCalledWith('test@example.com');
    }, { timeout: 3000 });
    await waitFor(() => expect(onSuccess).toHaveBeenCalled(), { timeout: 3000 });
  });
});
