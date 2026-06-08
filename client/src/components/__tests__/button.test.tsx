import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Button } from '../ui/button';


describe('Button Component', () => {
    it('renders with correct text', () => {
        render(<Button>Click me</Button>);
        const buttonElement = screen.getByRole('button', { name: /click me/i });
        expect(buttonElement).toBeInTheDocument();
    });

    it('applies the destructive variant class', () => {
        render(<Button variant="destructive">Delete</Button>);
        const buttonElement = screen.getByRole('button', { name: /delete/i });
        expect(buttonElement).toHaveClass('bg-destructive');
    });

    it('is disabled when disabled prop is passed', () => {
        render(<Button disabled>Disabled</Button>);
        const buttonElement = screen.getByRole('button', { name: /disabled/i });
        expect(buttonElement).toBeDisabled();
    });
});
