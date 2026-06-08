import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PasswordStrengthMeter } from '../PasswordStrengthMeter';

describe('PasswordStrengthMeter Component', () => {
    it('shows Weak for a short password', () => {
        render(<PasswordStrengthMeter password="123" />);
        const textElement = screen.getByText(/Weak/i);
        expect(textElement).toBeInTheDocument();
    });

    it('shows Fair for a medium password', () => {
        render(<PasswordStrengthMeter password="password123" />);
        const textElement = screen.getByText(/Fair/i);
        expect(textElement).toBeInTheDocument();
    });

    it('shows Strong for a strong password', () => {
        render(<PasswordStrengthMeter password="Password123!@#" />);
        const textElement = screen.getByText(/Strong/i);
        expect(textElement).toBeInTheDocument();
    });

    it('renders empty progress bars when password is empty', () => {
        render(<PasswordStrengthMeter password="" />);
        const textElement = screen.getByText(/Weak/i);
        expect(textElement).toBeInTheDocument();
    });
});
