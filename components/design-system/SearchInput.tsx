import React from 'react';
import { Search } from 'lucide-react';

/**
 * Search Input Component
 * Styled search input with icon
 * Based on the search bar from the design
 */

export interface SearchInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  className?: string;
}

export function SearchInput({
  placeholder = 'Search something',
  value,
  onChange,
  onSearch,
  className = '',
}: SearchInputProps) {
  const [internalValue, setInternalValue] = React.useState(value || '');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    onChange?.(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch?.(internalValue);
    }
  };

  return (
    <div
      className={`flex items-center gap-3 bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 transition-all duration-200 focus-within:border-[#2D6EF7] focus-within:ring-1 focus-within:ring-[#2D6EF7] ${className}`}
    >
      <Search size={20} className="text-neutral-400 flex-shrink-0" />
      <input
        type="text"
        value={value !== undefined ? value : internalValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="flex-1 bg-transparent border-none outline-none text-sm text-neutral-900 placeholder:text-neutral-400"
      />
    </div>
  );
}

/**
 * Example Usage:
 *
 * <SearchInput
 *   placeholder="Search influencers"
 *   onChange={(value) => console.log('Search:', value)}
 *   onSearch={(value) => console.log('Execute search:', value)}
 * />
 */
