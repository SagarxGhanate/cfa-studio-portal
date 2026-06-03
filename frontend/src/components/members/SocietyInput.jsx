import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';

const SocietyInput = ({ value, onChange, placeholder }) => {
  const [societies, setSocieties] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');
  const [addingNew, setAddingNew] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const fetchSocieties = async () => {
      try {
        const res = await api.get('/members/societies');
        if (res.data.success) {
          setSocieties(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch societies');
      }
    };
    fetchSocieties();
  }, []);

  // Sync external value changes
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
        setAddingNew(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = societies.filter(s =>
    s.toLowerCase().includes(inputValue.toLowerCase())
  );

  const exactMatch = societies.some(s => s.toLowerCase() === inputValue.toLowerCase());

  const handleSelect = (society) => {
    setInputValue(society);
    onChange(society);
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    onChange(val);
    setIsOpen(true);
  };

  const handleAddNew = () => {
    if (inputValue.trim()) {
      // Add to local list so it appears immediately
      if (!societies.includes(inputValue.trim())) {
        setSocieties(prev => [...prev, inputValue.trim()].sort());
      }
      onChange(inputValue.trim());
      setIsOpen(false);
      setAddingNew(false);
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        className="w-full h-[40px] bg-[#16161F] border border-[rgba(255,255,255,0.08)] rounded-[8px] px-3 text-[#EEEEF0] focus:ring-1 focus:ring-primary-container outline-none transition-all"
        placeholder={placeholder || "Select or type society name"}
      />

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#111118] border border-[rgba(255,255,255,0.08)] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] z-50 max-h-[220px] overflow-y-auto">
          {/* Existing societies */}
          {filtered.length > 0 ? (
            filtered.map((society) => (
              <button
                key={society}
                type="button"
                onClick={() => handleSelect(society)}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-[13px] text-[#EEEEF0] hover:bg-[rgba(255,255,255,0.06)] transition-colors first:rounded-t-xl last:rounded-b-xl"
              >
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant">apartment</span>
                {society}
              </button>
            ))
          ) : (
            <div className="px-3 py-3 text-[13px] text-[#6B6B80] text-center">
              No societies found
            </div>
          )}

          {/* Add new option */}
          {inputValue.trim() && !exactMatch && (
            <button
              type="button"
              onClick={handleAddNew}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-[13px] text-primary-container hover:bg-primary-container/5 transition-colors border-t border-[rgba(255,255,255,0.05)]"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              Add "{inputValue.trim()}"
            </button>
          )}

          {/* Show add button when input is empty and there are societies */}
          {!inputValue.trim() && societies.length > 0 && (
            <div className="px-3 py-2 text-[11px] text-[#6B6B80] border-t border-[rgba(255,255,255,0.05)]">
              Type to search or add a new society
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SocietyInput;
