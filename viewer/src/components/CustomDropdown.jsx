import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export const CustomDropdown = ({
  options = [],
  value,
  onChange,
  ariaLabel = 'Select option',
  minWidth = '140px',
  size = 'md', // 'sm' | 'md'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const isSmall = size === 'sm';

  return (
    <div
      ref={dropdownRef}
      style={{
        position: 'relative',
        display: 'inline-block',
        minWidth: minWidth,
        userSelect: 'none',
      }}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          padding: isSmall ? '0.35rem 0.65rem' : '0.5rem 0.85rem',
          borderRadius: isSmall ? '8px' : '10px',
          backgroundColor: isOpen ? 'var(--bg-surface-hover)' : 'var(--bg-surface)',
          border: '1px solid',
          borderColor: isOpen ? 'var(--purple-600)' : 'var(--border)',
          color: 'var(--text-main)',
          fontSize: isSmall ? '0.8rem' : '0.86rem',
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'all 0.18s ease',
          boxShadow: isOpen ? '0 0 0 2px rgba(124, 58, 237, 0.25)' : 'none',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedOption?.label || selectedOption?.value}
        </span>
        <ChevronDown
          size={isSmall ? 14 : 16}
          color="var(--text-muted)"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            flexShrink: 0,
          }}
        />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            minWidth: '100%',
            backgroundColor: '#121225',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '12px',
            padding: '6px',
            boxShadow: '0 16px 36px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(124, 58, 237, 0.15)',
            zIndex: 100,
            backdropFilter: 'blur(20px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  width: '100%',
                  padding: isSmall ? '0.4rem 0.65rem' : '0.5rem 0.75rem',
                  borderRadius: '8px',
                  backgroundColor: isSelected ? 'rgba(124, 58, 237, 0.22)' : 'transparent',
                  color: isSelected ? '#ffffff' : 'var(--text-nav)',
                  fontSize: isSmall ? '0.8rem' : '0.84rem',
                  fontWeight: isSelected ? 800 : 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.12s ease, color 0.12s ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                    e.currentTarget.style.color = '#ffffff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--text-nav)';
                  }
                }}
              >
                <span>{opt.label || opt.value}</span>
                {isSelected && (
                  <Check size={14} color="var(--purple-500)" strokeWidth={2.5} style={{ flexShrink: 0 }} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
