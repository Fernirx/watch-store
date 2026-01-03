import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import productService from '../services/productService';

const SearchBar = ({
  value,
  onChange,
  onSubmit,
  onClear,
  placeholder = 'Tìm kiếm sản phẩm theo tên...',
  compact = false,
  liveSearch = false,
}) => {
  const [localValue, setLocalValue] = useState(value || '');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeoutRef = useRef(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const v = e.target.value;
    setLocalValue(v);
    if (onChange) onChange(v);

    // Live search functionality
    if (liveSearch) {
      // Clear previous timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      if (v.trim().length === 0) {
        setSearchResults([]);
        setShowDropdown(false);
        return;
      }

      // Debounce: wait 300ms after user stops typing
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const response = await productService.getProducts({
            search: v.trim(),
            per_page: 5,
          });
          setSearchResults(response.data?.data || []);
          setShowDropdown(true);
        } catch (error) {
          console.error('Live search error:', error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    }
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
    setSearchResults([]);
    setShowDropdown(false);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (onClear) {
      onClear();
    } else if (onChange) {
      onChange('');
    }
  };

  const handleResultClick = (productId) => {
    setShowDropdown(false);
    setLocalValue('');
    setSearchResults([]);
    navigate(`/products/${productId}`);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [showDropdown]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={`search-bar${compact ? ' compact' : ''}`} ref={dropdownRef}>
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
          <button onClick={handleClear} className="clear-search-btn" aria-label="Xóa">
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

      {/* Live Search Dropdown */}
      {liveSearch && showDropdown && (
        <div className="search-dropdown">
          {isSearching ? (
            <div className="search-dropdown-loading">
              <div className="spinner"></div>
              <span>Đang tìm kiếm...</span>
            </div>
          ) : searchResults.length > 0 ? (
            <>
              {searchResults.map((product) => (
                <div
                  key={product.id}
                  className="search-result-item"
                  onClick={() => handleResultClick(product.id)}
                >
                  <div className="search-result-image">
                    <img
                      src={product.primary_image || product.image_url || '/placeholder.png'}
                      alt={product.name}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/60x60?text=No+Image';
                      }}
                    />
                  </div>
                  <div className="search-result-info">
                    <div className="search-result-name">{product.name}</div>
                    <div className="search-result-price">{formatPrice(product.price)}</div>
                  </div>
                </div>
              ))}
              <div className="search-dropdown-footer">
                <button
                  className="view-all-btn"
                  onClick={() => {
                    setShowDropdown(false);
                    const current = value !== undefined ? value : localValue;
                    if (onSubmit) onSubmit(current);
                  }}
                >
                  Xem tất cả kết quả →
                </button>
              </div>
            </>
          ) : (
            <div className="search-dropdown-empty">
              Không tìm thấy sản phẩm nào
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
