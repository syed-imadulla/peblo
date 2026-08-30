import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export const Dropdown = ({ label, options, value, onChange, minWidth = '140px', prefix, placement = 'bottom', height = '42px', padding = '0 12px 0 16px' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dynamicPlacement, setDynamicPlacement] = useState(placement);
  const ref = useRef(null);

  useEffect(() => {
    if (isOpen && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      // Dropdown max-height is 280px + search box ~45px = ~325px.
      // If we don't have 325px below, but have more space above, open upwards.
      if (spaceBelow < 325 && spaceAbove > spaceBelow) {
        setDynamicPlacement('top');
      } else {
        setDynamicPlacement('bottom');
      }
    } else {
      setSearchQuery(''); // reset search when closed
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div ref={ref} style={{ position: 'relative', minWidth, flexShrink: 0 }}>
      {label && <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--navy-900)', paddingLeft: '4px', marginBottom: '6px', display: 'block' }}>{label}</label>}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          height, padding, display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
          backgroundColor: isOpen ? '#F5F3FF' : '#FFFFFF', 
          border: isOpen ? '1px solid #A78BFA' : '1px solid #E2E8F0', 
          borderRadius: '20px', cursor: 'pointer', color: isOpen ? '#6D28D9' : '#334155', 
          fontSize: '13px', transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
        }}
      >
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: '8px', fontWeight: value.startsWith('All') ? '400' : '500' }}>
          {prefix && <span style={{ color: 'var(--text-muted)', fontWeight: '400', marginRight: '4px' }}>{prefix}</span>}
          {value}
        </span>
        <ChevronDown size={14} style={{ flexShrink: 0, color: isOpen ? 'var(--purple-700)' : 'var(--text-muted)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
      </div>
      {isOpen && (
        <div style={{ 
          position: 'absolute', 
          ...(dynamicPlacement === 'top' ? { bottom: 'calc(100% + 6px)' } : { top: 'calc(100% + 6px)' }), 
          left: 0, 
          minWidth: '100%', 
          backgroundColor: '#FFFFFF', 
          border: '1px solid #E2E8F0', 
          borderRadius: '16px', 
          boxShadow: '0 10px 40px -10px rgba(109, 40, 217, 0.15)', 
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {options.length > 10 && (
            <div style={{ padding: '8px', borderBottom: '1px solid #F1F5F9', backgroundColor: '#F8FAFC' }}>
              <input
                type="text"
                autoFocus
                placeholder="Search..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          )}
          <div style={{ maxHeight: '280px', overflowY: 'auto', padding: '6px' }} className="custom-scrollbar">
            {filteredOptions.length > 0 ? filteredOptions.map(opt => (
              <div 
                key={opt}
                title={opt}
                onClick={() => { onChange(opt); setIsOpen(false); }}
                style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', backgroundColor: value === opt ? 'var(--purple-50)' : 'transparent', color: value === opt ? 'var(--purple-700)' : 'var(--navy-900)', fontWeight: value === opt ? '600' : '400', display: 'flex', alignItems: 'center', justifyContent: 'space-between', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                onMouseOver={e => { if (value !== opt) e.currentTarget.style.backgroundColor = 'var(--gray-50)' }}
                onMouseOut={e => { if (value !== opt) e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: '8px' }}>{opt}</span>
                {value === opt && <Check size={14} style={{ flexShrink: 0 }} />}
              </div>
            )) : (
              <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                No results found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
