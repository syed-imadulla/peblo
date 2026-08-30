import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Dropdown } from './Dropdown';

const getPaginationWindow = (current, total) => {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 3) {
    return [1, 2, 3, 4, '...', total];
  }
  if (current >= total - 2) {
    return [1, '...', total - 3, total - 2, total - 1, total];
  }
  return [1, '...', current - 1, current, current + 1, '...', total];
};

export const Pagination = ({ 
  currentPage, 
  totalPages, 
  totalItems, 
  itemsPerPage, 
  setCurrentPage, 
  setItemsPerPage, 
  itemName = 'results',
  itemsPerPageOptions = [10, 20, 50]
}) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderTop: '1px solid var(--border)', borderBottomLeftRadius: 'var(--radius-lg)', borderBottomRightRadius: 'var(--radius-lg)', backgroundColor: '#fff', flexWrap: 'wrap', gap: '16px' }}>
      
      <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>
        Showing <strong style={{ color: 'var(--navy-900)' }}>{totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</strong> to <strong style={{ color: 'var(--navy-900)' }}>{Math.min(currentPage * itemsPerPage, totalItems)}</strong> of <strong style={{ color: 'var(--navy-900)' }}>{totalItems}</strong> {itemName}
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <button 
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: '10px', background: 'transparent', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: currentPage === 1 ? '#CBD5E1' : '#64748B', transition: 'all 0.2s ease' }}
          onMouseOver={e => { if(currentPage !== 1) { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#334155'; } }}
          onMouseOut={e => { if(currentPage !== 1) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748B'; } }}
        >
          <ChevronLeft size={16} />
        </button>
        
        {getPaginationWindow(currentPage, totalPages).map((p, idx) => {
          if (typeof p === 'string') {
            return <div key={`ellipsis-${idx}`} style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontWeight: '500', fontSize: '13px' }}>...</div>;
          }
          const isActive = currentPage === p;
          return (
            <button 
              key={p}
              onClick={() => setCurrentPage(p)}
              style={{ 
                width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', 
                borderRadius: '10px', 
                background: isActive ? '#4325c2' : 'transparent', 
                color: isActive ? '#FFFFFF' : '#64748B', 
                fontWeight: isActive ? '600' : '500', 
                fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s ease',
                boxShadow: isActive ? '0 4px 12px rgba(67, 37, 194, 0.25)' : 'none'
              }}
              onMouseOver={e => { if(!isActive) { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#334155'; } }}
              onMouseOut={e => { if(!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748B'; } }}
            >
              {p}
            </button>
          );
        })}

        <button 
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages || totalPages === 0}
          style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: '10px', background: 'transparent', cursor: (currentPage === totalPages || totalPages === 0) ? 'not-allowed' : 'pointer', color: (currentPage === totalPages || totalPages === 0) ? '#CBD5E1' : '#64748B', transition: 'all 0.2s ease' }}
          onMouseOver={e => { if(currentPage !== totalPages && totalPages !== 0) { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.color = '#334155'; } }}
          onMouseOut={e => { if(currentPage !== totalPages && totalPages !== 0) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748B'; } }}
        >
          <ChevronRight size={16} />
        </button>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {setItemsPerPage ? (
          <Dropdown 
            value={`${itemsPerPage} / page`}
            onChange={(val) => {
              setItemsPerPage(Number(val.split(' ')[0]));
              setCurrentPage(1); // reset to page 1 on size change
            }}
            options={itemsPerPageOptions.map(o => `${o} / page`)}
            minWidth="110px"
            placement="top"
            height="36px"
            padding="0 10px 0 14px"
          />
        ) : (
          <div style={{ minWidth: '110px' }}></div>
        )}
      </div>
    </div>
  );
};
