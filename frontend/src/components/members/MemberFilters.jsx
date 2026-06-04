import { useState } from 'react';

const MemberFilters = ({ isOpen, onClose, onApply, filters, allLocations, allSocieties }) => {
  const [localFilters, setLocalFilters] = useState({
    location: filters.location || '',
    society: filters.society || '',
    classType: filters.classType || '',
    category: filters.category || '',
    status: filters.status || '',
  });
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [newLocation, setNewLocation] = useState('');
  const [showAddSociety, setShowAddSociety] = useState(false);
  const [newSociety, setNewSociety] = useState('');

  if (!isOpen) return null;

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleClear = () => {
    const cleared = { location: '', society: '', classType: '', category: '', status: '' };
    setLocalFilters(cleared);
    onApply(cleared);
    onClose();
  };

  const handleAddLocation = () => {
    if (newLocation.trim()) {
      setLocalFilters({ ...localFilters, location: newLocation.trim() });
      setNewLocation('');
      setShowAddLocation(false);
    }
  };

  const handleAddSociety = () => {
    if (newSociety.trim()) {
      setLocalFilters({ ...localFilters, society: newSociety.trim() });
      setNewSociety('');
      setShowAddSociety(false);
    }
  };

  // Count active filters
  const activeCount = Object.values(localFilters).filter(v => v).length;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fadeIn"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center z-50">
        <div 
          className="bg-[#1a1a1a] border border-[rgba(255,255,255,0.07)] rounded-t-[20px] md:rounded-[16px] w-full md:max-w-[420px] max-h-[85vh] overflow-y-auto animate-slideUp"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle bar (mobile) */}
          <div className="flex justify-center pt-3 md:hidden">
            <div className="w-10 h-1 bg-[#6B6B80]/30 rounded-full"></div>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary-container text-[22px]">filter_list</span>
              <h3 className="text-[18px] font-bold text-[#EEEEF0]">Filters</h3>
              {activeCount > 0 && (
                <span className="bg-primary-container text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {activeCount}
                </span>
              )}
            </div>
            <button 
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[rgba(255,255,255,0.05)] transition-colors"
            >
              <span className="material-symbols-outlined text-[#6B6B80] text-[20px]">close</span>
            </button>
          </div>

          <div className="px-6 pb-6 flex flex-col gap-6">

            {/* ====== LOCATION ====== */}
            <section>
              <div className="border-b border-outline-variant/30 pb-2 mb-3">
                <h4 className="text-[11px] uppercase tracking-wider text-[#6B6B80] font-bold">Location</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setLocalFilters({ ...localFilters, location: '' })}
                  className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all border ${
                    !localFilters.location 
                      ? 'bg-primary-container text-white border-primary-container' 
                      : 'bg-transparent text-[#6B6B80] border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)]'
                  }`}
                >
                  All
                </button>
                {allLocations.map((loc) => (
                  <button
                    key={loc}
                    onClick={() => setLocalFilters({ ...localFilters, location: loc })}
                    className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all border ${
                      localFilters.location === loc 
                        ? 'bg-primary-container text-white border-primary-container' 
                        : 'bg-transparent text-[#6B6B80] border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)]'
                    }`}
                  >
                    {loc}
                  </button>
                ))}

                {/* Add Location */}
                {!showAddLocation ? (
                  <button
                    onClick={() => setShowAddLocation(true)}
                    className="px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all border border-dashed border-[rgba(255,255,255,0.12)] text-[#6B6B80] hover:text-primary-container hover:border-primary-container/40 flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">add</span>
                    Add
                  </button>
                ) : (
                  <div className="flex items-center gap-2 w-full mt-1">
                    <input
                      type="text"
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddLocation()}
                      placeholder="Enter location..."
                      autoFocus
                      className="flex-1 h-[34px] bg-[#262626] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 text-[13px] text-[#EEEEF0] placeholder-[#6B6B80]/50 outline-none focus:border-primary-container transition-colors"
                    />
                    <button
                      onClick={handleAddLocation}
                      className="h-[34px] px-3 bg-primary-container text-white rounded-lg text-[12px] font-bold hover:opacity-90 active:scale-95 transition-all"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => { setShowAddLocation(false); setNewLocation(''); }}
                      className="h-[34px] px-2 text-[#6B6B80] hover:text-[#EEEEF0] transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* ====== SOCIETY ====== */}
            <section>
              <div className="border-b border-outline-variant/30 pb-2 mb-3">
                <h4 className="text-[11px] uppercase tracking-wider text-[#6B6B80] font-bold">Society / Apartment</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setLocalFilters({ ...localFilters, society: '' })}
                  className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all border ${
                    !localFilters.society 
                      ? 'bg-primary-container text-white border-primary-container' 
                      : 'bg-transparent text-[#6B6B80] border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)]'
                  }`}
                >
                  All
                </button>
                {(allSocieties || []).map((soc) => (
                  <button
                    key={soc}
                    onClick={() => setLocalFilters({ ...localFilters, society: soc })}
                    className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all border ${
                      localFilters.society === soc 
                        ? 'bg-primary-container text-white border-primary-container' 
                        : 'bg-transparent text-[#6B6B80] border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)]'
                    }`}
                  >
                    {soc}
                  </button>
                ))}

                {/* Add Society */}
                {!showAddSociety ? (
                  <button
                    onClick={() => setShowAddSociety(true)}
                    className="px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all border border-dashed border-[rgba(255,255,255,0.12)] text-[#6B6B80] hover:text-primary-container hover:border-primary-container/40 flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">add</span>
                    Add
                  </button>
                ) : (
                  <div className="flex items-center gap-2 w-full mt-1">
                    <input
                      type="text"
                      value={newSociety}
                      onChange={(e) => setNewSociety(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddSociety()}
                      placeholder="Enter society name..."
                      autoFocus
                      className="flex-1 h-[34px] bg-[#262626] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 text-[13px] text-[#EEEEF0] placeholder-[#6B6B80]/50 outline-none focus:border-primary-container transition-colors"
                    />
                    <button
                      onClick={handleAddSociety}
                      className="h-[34px] px-3 bg-primary-container text-white rounded-lg text-[12px] font-bold hover:opacity-90 active:scale-95 transition-all"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => { setShowAddSociety(false); setNewSociety(''); }}
                      className="h-[34px] px-2 text-[#6B6B80] hover:text-[#EEEEF0] transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* ====== CLASS TYPE ====== */}
            <section>
              <div className="border-b border-outline-variant/30 pb-2 mb-3">
                <h4 className="text-[11px] uppercase tracking-wider text-[#6B6B80] font-bold">Class Type</h4>
              </div>
              <div className="grid grid-cols-4 bg-[#262626] border border-[rgba(255,255,255,0.08)] rounded-[8px] p-1">
                {[
                  { value: '', label: 'All' },
                  { value: 'PERSONAL', label: 'Personal' },
                  { value: 'GROUP', label: 'Group' },
                  { value: 'STUDIO', label: 'Studio' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setLocalFilters({ ...localFilters, classType: opt.value })}
                    className={`py-2 rounded-[6px] text-[13px] transition-all ${
                      localFilters.classType === opt.value
                        ? 'bg-primary-container text-white font-bold shadow-sm'
                        : 'text-[#6B6B80] font-medium hover:text-[#EEEEF0]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </section>

            {/* ====== CATEGORY ====== */}
            <section>
              <div className="border-b border-outline-variant/30 pb-2 mb-3">
                <h4 className="text-[11px] uppercase tracking-wider text-[#6B6B80] font-bold">Category</h4>
              </div>
              <div className="grid grid-cols-4 bg-[#262626] border border-[rgba(255,255,255,0.08)] rounded-[8px] p-1">
                {[
                  { value: '', label: 'All' },
                  { value: 'TODDLERS', label: 'Toddlers' },
                  { value: 'KIDS', label: 'Kids' },
                  { value: 'ADULTS', label: 'Adults' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setLocalFilters({ ...localFilters, category: opt.value })}
                    className={`py-2 rounded-[6px] text-[13px] transition-all ${
                      localFilters.category === opt.value
                        ? 'bg-primary-container text-white font-bold shadow-sm'
                        : 'text-[#6B6B80] font-medium hover:text-[#EEEEF0]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </section>

            {/* ====== STATUS ====== */}
            <section>
              <div className="border-b border-outline-variant/30 pb-2 mb-3">
                <h4 className="text-[11px] uppercase tracking-wider text-[#6B6B80] font-bold">Status</h4>
              </div>
              <div className="grid grid-cols-3 bg-[#262626] border border-[rgba(255,255,255,0.08)] rounded-[8px] p-1">
                {[
                  { value: '', label: 'All' },
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setLocalFilters({ ...localFilters, status: opt.value })}
                    className={`py-2 rounded-[6px] text-[13px] transition-all flex items-center justify-center gap-1.5 ${
                      localFilters.status === opt.value
                        ? 'bg-primary-container text-white font-bold shadow-sm'
                        : 'text-[#6B6B80] font-medium hover:text-[#EEEEF0]'
                    }`}
                  >
                    {opt.value === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-[#4ae176]"></span>}
                    {opt.value === 'inactive' && <span className="w-1.5 h-1.5 rounded-full bg-[#ffb596]"></span>}
                    {opt.label}
                  </button>
                ))}
              </div>
            </section>

            {/* ====== ACTION BUTTONS ====== */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleClear}
                className="flex-1 h-[44px] border border-[#6B6B80]/30 text-[#6B6B80] font-medium rounded-lg hover:bg-[rgba(255,255,255,0.03)] active:scale-[0.98] transition-all text-[14px]"
              >
                Clear All
              </button>
              <button
                onClick={handleApply}
                className="flex-1 h-[44px] bg-primary-container text-white font-bold rounded-lg hover:opacity-90 active:scale-[0.98] transition-all text-[14px] flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">check</span>
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MemberFilters;
