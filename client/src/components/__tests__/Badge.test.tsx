import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Badge } from '../ui/badge';

describe('Badge Component', () => {
    it('renders with correct text', () => {
        render(<Badge>Active</Badge>);
        const badgeElement = screen.getByText(/Active/i);
        expect(badgeElement).toBeInTheDocument();
    });

    it('applies the destructive variant class', () => {
        render(<Badge variant="destructive">Error</Badge>);
        const badgeElement = screen.getByText(/Error/i);
        expect(badgeElement).toHaveClass('bg-destructive');
    });

    it('applies the secondary variant class', () => {
        render(<Badge variant="secondary">Draft</Badge>);
        const badgeElement = screen.getByText(/Draft/i);
        expect(badgeElement).toHaveClass('bg-secondary');
    });

    it('applies the outline variant class', () => {
        render(<Badge variant="outline">Bordered</Badge>);
        const badgeElement = screen.getByText(/Bordered/i);
        expect(badgeElement).toHaveClass('text-foreground');
    });
});
