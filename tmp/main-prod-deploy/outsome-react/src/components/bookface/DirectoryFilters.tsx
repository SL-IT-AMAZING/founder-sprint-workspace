import React, { useState } from 'react';

export interface FilterSection {
  id: string;
  label: string;
  type: 'checkbox' | 'search-checkbox' | 'slider' | 'select';
  options?: { value: string; label: string; count?: number }[];
  min?: number;
  max?: number;
  step?: number;
}

export interface DirectoryFiltersProps {
  sections: FilterSection[];
  values: Record<string, any>;
  onChange: (sectionId: string, value: any) => void;
  onClear?: () => void;
  className?: string;
}

const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
  <svg 
    width="10" 
    height="6" 
    viewBox="0 0 10 6" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    style={{ 
      transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
      transition: 'transform 0.2s ease',
      flexShrink: 0
    }}
  >
    <path d="M1 1L5 5L9 1" stroke="#666666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SearchIcon = () => (
  <svg 
    width="14" 
    height="14" 
    viewBox="0 0 14 14" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
  >
    <path d="M6.125 10.5C8.54125 10.5 10.5 8.54125 10.5 6.125C10.5 3.70875 8.54125 1.75 6.125 1.75C3.70875 1.75 1.75 3.70875 1.75 6.125C1.75 8.54125 3.70875 10.5 6.125 10.5Z" stroke="#999999" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12.25 12.25L9.1875 9.1875" stroke="#999999" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const styles = {
  container: {
    width: '240px',
    padding: '16px',
    backgroundColor: '#ffffff',
    position: 'sticky' as const,
    top: '20px',
    borderRight: '1px solid #e0e0e0',
    height: 'fit-content',
    maxHeight: 'calc(100vh - 40px)',
    overflowY: 'auto' as const,
    boxSizing: 'border-box' as const,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  title: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#2F2C26',
    margin: 0,
  },
  clearButton: {
    fontSize: '12px',
    color: '#555AB9',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    textDecoration: 'none',
  },
  section: {
    marginBottom: '24px',
    borderBottom: '1px solid #f0f0f0',
    paddingBottom: '16px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    userSelect: 'none' as const,
    marginBottom: '12px',
  },
  sectionLabel: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#2F2C26',
  },
  inputSearchContainer: {
    position: 'relative' as const,
    marginBottom: '12px',
  },
  searchInput: {
    width: '100%',
    padding: '8px 8px 8px 30px',
    fontSize: '13px',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    outline: 'none',
    boxSizing: 'border-box' as const,
    color: '#2F2C26',
  },
  checkboxContainer: {
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#2F2C26',
  },
  checkbox: {
    marginRight: '8px',
    marginTop: '2px',
    accentColor: '#555AB9',
    cursor: 'pointer',
  },
  count: {
    color: '#666666',
    marginLeft: '4px',
  },
  seeAllButton: {
    background: 'none',
    border: 'none',
    color: '#555AB9',
    fontSize: '13px',
    cursor: 'pointer',
    padding: 0,
    marginTop: '4px',
    fontWeight: 500,
  },
  sliderContainer: {
    padding: '0 4px',
  },
  sliderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#666666',
    marginBottom: '8px',
  },
  slider: {
    width: '100%',
    accentColor: '#555AB9',
    height: '4px',
    borderRadius: '2px',
    outline: 'none',
    cursor: 'pointer',
  }
};

const CheckboxGroup = ({ 
  options = [], 
  selectedValues = [], 
  onChange, 
  searchable 
}: { 
  options: FilterSection['options'], 
  selectedValues: string[], 
  onChange: (newValues: string[]) => void, 
  searchable: boolean 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);

  const filteredOptions = options?.filter(opt => 
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const visibleOptions = (showAll || searchQuery) ? filteredOptions : filteredOptions.slice(0, 8);
  const hasMore = filteredOptions.length > 8;

  const handleCheckboxChange = (value: string, checked: boolean) => {
    if (checked) {
      onChange([...selectedValues, value]);
    } else {
      onChange(selectedValues.filter(v => v !== value));
    }
  };

  return (
    <div>
      {searchable && (
        <div style={styles.inputSearchContainer}>
          <SearchIcon />
          <input
            type="text"
            placeholder="Search..."
            style={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
        {visibleOptions.map(option => (
          <label key={option.value} style={styles.checkboxContainer}>
            <input
              type="checkbox"
              checked={selectedValues.includes(option.value)}
              onChange={(e) => handleCheckboxChange(option.value, e.target.checked)}
              style={styles.checkbox}
            />
            <span style={{ lineHeight: '1.4' }}>
              {option.label}
              {option.count !== undefined && <span style={styles.count}>({option.count})</span>}
            </span>
          </label>
        ))}
      </div>

      {hasMore && !searchQuery && (
        <button 
          style={styles.seeAllButton}
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? 'Show less' : `See all options`}
        </button>
      )}
      
      {searchable && searchQuery && filteredOptions.length === 0 && (
        <div style={{ fontSize: '13px', color: '#666666', fontStyle: 'italic' }}>
          No matches found
        </div>
      )}
    </div>
  );
};

const SliderFilter = ({ 
  min = 0, 
  max = 100, 
  value, 
  onChange 
}: { 
  min?: number, 
  max?: number, 
  value?: number, 
  onChange: (val: number) => void 
}) => {
  const displayValue = value ?? min;
  
  return (
    <div style={styles.sliderContainer}>
      <div style={styles.sliderHeader}>
        <span>{min} years</span>
        <span style={{ fontWeight: 600, color: '#555AB9' }}>{displayValue} years</span>
        <span>{max}+ years</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={displayValue}
        onChange={(e) => onChange(Number(e.target.value))}
        style={styles.slider}
      />
    </div>
  );
};

export const DirectoryFilters: React.FC<DirectoryFiltersProps> = ({
  sections,
  values,
  onChange,
  onClear,
  className
}) => {
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (id: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div style={styles.container} className={className}>
      <div style={styles.header}>
        <h2 style={styles.title}>Filters</h2>
        {onClear && (
          <button style={styles.clearButton} onClick={onClear}>
            Clear all
          </button>
        )}
      </div>

      {sections.map(section => {
        const isCollapsed = collapsedSections[section.id];
        const sectionValue = values[section.id];

        return (
          <div key={section.id} style={styles.section}>
            <div 
              style={styles.sectionHeader} 
              onClick={() => toggleSection(section.id)}
            >
              <span style={styles.sectionLabel}>{section.label}</span>
              <ChevronIcon expanded={!isCollapsed} />
            </div>

            {!isCollapsed && (
              <div style={{ marginTop: '12px' }}>
                {(section.type === 'checkbox' || section.type === 'search-checkbox') && (
                  <CheckboxGroup
                    options={section.options}
                    searchable={section.type === 'search-checkbox'}
                    selectedValues={Array.isArray(sectionValue) ? sectionValue : []}
                    onChange={(newVal) => onChange(section.id, newVal)}
                  />
                )}

                {section.type === 'slider' && (
                  <SliderFilter
                    min={section.min}
                    max={section.max}
                    value={sectionValue}
                    onChange={(newVal) => onChange(section.id, newVal)}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default DirectoryFilters;
