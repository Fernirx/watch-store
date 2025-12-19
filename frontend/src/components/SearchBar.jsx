import { useState } from 'react';

const SearchBar = ({
  value,
  onChange,
  onSubmit,
  onClear,
  placeholder = 'Tìm kiếm sản phẩm theo tên...',
  compact = false,
}) => {
  const [localValue, setLocalValue] = useState(value || '');

  const handleChange = (e) => {
    const v = e.target.value;
    setLocalValue(v);
    if (onChange) onChange(v);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const current = value !== undefined ? value : localValue;
      if (onSubmit) onSubmit(current);
    }
  };

  const handleClear = () => {
    setLocalValue('');
    if (onClear) {
      onClear();
    } else if (onChange) {
      onChange('');
    }
  };

  return (
    <div className={`search-bar${compact ? ' compact' : ''}`}>
      <div className="search-input-wrapper">
        <input
          type="text"
          placeholder={placeholder}
          value={value !== undefined ? value : localValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className="search-input"
        />
        {(value ?? localValue)?.length > 0 && (
          <button onClick={handleClear} className="clear-search-btn" aria-label="Clear">
            ✕
          </button>
        )}
        <span className="search-icon" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
      </div>
    </div>
  );
};

export default SearchBar;
