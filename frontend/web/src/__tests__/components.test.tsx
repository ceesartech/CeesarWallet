import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock components for testing
const MockButton = ({ children, onClick, disabled = false, ...props }) => (
  <button onClick={onClick} disabled={disabled} {...props}>
    {children}
  </button>
);

const MockInput = ({ value, onChange, placeholder, ...props }) => (
  <input
    value={value || ''}
    onChange={onChange || (() => {})}
    placeholder={placeholder}
    {...props}
  />
);

const MockCard = ({ children, title, ...props }) => (
  <div {...props}>
    {title && <h3>{title}</h3>}
    {children}
  </div>
);

describe('Component Tests', () => {
  describe('MockButton', () => {
    it('renders button with text', () => {
      render(<MockButton>Click me</MockButton>);
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });

    it('handles click events', () => {
      const handleClick = jest.fn();
      render(<MockButton onClick={handleClick}>Click me</MockButton>);
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('can be disabled', () => {
      render(<MockButton disabled>Disabled button</MockButton>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('accepts custom props', () => {
      render(<MockButton data-testid="custom-button">Custom</MockButton>);
      expect(screen.getByTestId('custom-button')).toBeInTheDocument();
    });
  });

  describe('MockInput', () => {
    it('renders input with placeholder', () => {
      render(<MockInput placeholder="Enter text" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('handles value changes', async () => {
      const handleChange = jest.fn();
      render(<MockInput onChange={handleChange} placeholder="Test input" />);
      
      const input = screen.getByPlaceholderText('Test input');
      fireEvent.change(input, { target: { value: 'new value' } });
      
      await waitFor(() => {
        expect(handleChange).toHaveBeenCalled();
      });
    });

    it('displays initial value', () => {
      render(<MockInput value="initial value" />);
      expect(screen.getByDisplayValue('initial value')).toBeInTheDocument();
    });
  });

  describe('MockCard', () => {
    it('renders card with title', () => {
      render(<MockCard title="Card Title">Card content</MockCard>);
      expect(screen.getByText('Card Title')).toBeInTheDocument();
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('renders card without title', () => {
      render(<MockCard>Card content only</MockCard>);
      expect(screen.getByText('Card content only')).toBeInTheDocument();
    });

    it('accepts custom props', () => {
      render(<MockCard data-testid="custom-card">Content</MockCard>);
      expect(screen.getByTestId('custom-card')).toBeInTheDocument();
    });
  });
});

describe('Integration Tests', () => {
  it('form submission works correctly', async () => {
    const handleSubmit = jest.fn((e) => e.preventDefault());
    
    render(
      <form onSubmit={handleSubmit}>
        <MockInput placeholder="Name" />
        <MockButton type="button" onClick={handleSubmit}>Submit</MockButton>
      </form>
    );

    const input = screen.getByPlaceholderText('Name');
    const submitButton = screen.getByRole('button', { name: 'Submit' });

    fireEvent.change(input, { target: { value: 'John Doe' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalled();
    });
  });

  it('multiple components work together', () => {
    render(
      <div>
        <MockCard title="Dashboard">
          <MockInput placeholder="Search" />
          <MockButton>Search</MockButton>
        </MockCard>
      </div>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
  });
});

describe('Accessibility Tests', () => {
  it('button has proper accessibility attributes', () => {
    render(<MockButton aria-label="Close dialog">×</MockButton>);
    expect(screen.getByLabelText('Close dialog')).toBeInTheDocument();
  });

  it('input has proper accessibility attributes', () => {
    render(<MockInput aria-label="Email address" placeholder="Enter email" />);
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
  });

  it('card has proper heading structure', () => {
    render(<MockCard title="Section Title">Content</MockCard>);
    const heading = screen.getByRole('heading', { name: 'Section Title' });
    expect(heading).toBeInTheDocument();
  });
});
