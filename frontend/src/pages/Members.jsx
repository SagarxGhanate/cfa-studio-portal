import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import BottomNav from '../components/layout/BottomNav';
import MemberFilters from '../components/members/MemberFilters';
import { useToast } from '../components/ui/Toast';
import api from '../services/api';

const Members = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);
  const [showWipeFinal, setShowWipeFinal] = useState(false);
  const [wipeInput, setWipeInput] = useState('');
  const [wiping, setWiping] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState(new Set());
  const menuRef = useRef(null);
  const addMenuRef = useRef(null);
  const navigate = useNavigate();
  const toast = useToast();
  const [filters, setFilters] = useState({
    location: '',
    society: '',
    classType: '',
    category: '',
    status: '',
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleStatus = async (id) => {
    try {
      const res = await api.patch(`/members/${id}/status`);
      if (res.data.success) {
        setMembers(prev => prev.map(m => m.id === id ? res.data.data : m));
        toast.success(`Member ${res.data.data.isActive ? 'activated' : 'deactivated'} successfully`);
      }
    } catch (err) {
      toast.error('Failed to update member status');
    }
    setOpenMenuId(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this member?')) {
      try {
        await api.delete(`/members/${id}`);
        setMembers(prev => prev.filter(m => m.id !== id));
        toast.success('Member deleted successfully');
      } catch (err) {
        toast.error('Failed to delete member');
      }
    }
    setOpenMenuId(null);
  };

  // Extract unique locations from members for the filter chips
  const allLocations = useMemo(() => {
    const locs = members.map(m => m.location);
    return [...new Set(locs)].sort();
  }, [members]);

  // Extract unique societies from members for the filter chips
  const allSocieties = useMemo(() => {
    const socs = members.map(m => m.society).filter(Boolean);
    return [...new Set(socs)].sort();
  }, [members]);

  // Count active filters for badge
  const activeFilterCount = Object.values(filters).filter(v => v).length;

  const fetchMembers = async (page = 1, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      const params = new URLSearchParams();
      const hasActiveFilters = Object.values(filters).some(v => v);
      if (search || hasActiveFilters) {
        if (search) params.append('search', search);
        params.append('limit', '1000'); // Show all results when searching or filtering
      } else {
        params.append('limit', '20');
        params.append('page', page.toString());
      }
      if (filters.status) params.append('status', filters.status);
      if (filters.category) params.append('category', filters.category);
      if (filters.classType) params.append('classType', filters.classType);

      const res = await api.get(`/members?${params.toString()}`);
      if (res.data.success) {
        let fetched = res.data.data.members;
        const pagination = res.data.data.pagination;
        setTotalCount(pagination.total);
        // Client-side location filter (backend doesn't have location filter param)
        if (filters.location) {
          fetched = fetched.filter(m => m.location === filters.location);
        }
        if (filters.society) {
          fetched = fetched.filter(m => m.society === filters.society);
        }
        if (append) {
          setMembers(prev => [...prev, ...fetched]);
        } else {
          setMembers(fetched);
        }
        setCurrentPage(pagination.page);
        setHasMore(pagination.page < pagination.totalPages);
      }
    } catch (err) {
      toast.error('Failed to load members. Please check your connection.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setCurrentPage(1);
      fetchMembers(1, false);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search, filters]);

  const handleLoadMore = () => {
    fetchMembers(currentPage + 1, true);
  };

  // Selection handlers
  const handleToggleSelectMode = () => {
    setSelectMode(prev => !prev);
    setSelectedMembers(new Set());
  };

  const handleSelectAll = () => {
    if (selectedMembers.size === members.length) {
      setSelectedMembers(new Set());
    } else {
      setSelectedMembers(new Set(members.map(m => m.id)));
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedMembers(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedMembers.size === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedMembers.size} selected member(s)?`)) return;
    try {
      await Promise.all([...selectedMembers].map(id => api.delete(`/members/${id}`)));
      setMembers(prev => prev.filter(m => !selectedMembers.has(m.id)));
      setTotalCount(prev => prev - selectedMembers.size);
      toast.success(`${selectedMembers.size} member(s) deleted successfully`);
      setSelectedMembers(new Set());
      setSelectMode(false);
    } catch (err) {
      toast.error('Failed to delete some members');
    }
  };

  // Close add menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target)) {
        setShowAddMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
  };

  const handleWipeAll = async () => {
    if (wipeInput.toLowerCase() !== 'delete') {
      toast.error('Please type "Delete" exactly to confirm.');
      return;
    }
    setWiping(true);
    try {
      const res = await api.delete('/members/all');
      if (res.data.success) {
        toast.success(res.data.message || 'All members deleted successfully');
        setMembers([]);
        setShowWipeFinal(false);
        setWipeInput('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to wipe data');
    } finally {
      setWiping(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <Navbar />

      <main className="max-w-[1440px] mx-auto px-container-margin py-8 pb-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h1 className="font-display-lg text-display-lg text-on-surface">CFA Members</h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">
              {totalCount > 0 ? `${totalCount} total members` : 'Manage studio residents, access levels, and billing cycles.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
              <input
                className="bg-[#111118] border border-outline-variant rounded-lg pl-10 pr-4 py-2 w-full md:w-64 focus:border-primary-container focus:ring-0 transition-colors font-body-md text-body-md text-on-surface outline-none"
                placeholder="Search members..."
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Select Mode Toggle */}
            <button
              onClick={handleToggleSelectMode}
              className={`relative p-2 rounded-lg transition-colors flex items-center justify-center border ${
                selectMode
                  ? 'bg-primary-container/20 border-primary-container/40 text-primary-container'
                  : 'bg-[#111118] border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
              }`}
              title={selectMode ? 'Exit select mode' : 'Select members'}
            >
              <span className="material-symbols-outlined">{selectMode ? 'close' : 'checklist'}</span>
            </button>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(true)}
              className="relative bg-[#111118] border border-outline-variant p-2 rounded-lg hover:bg-surface-container-high transition-colors flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-on-surface-variant">filter_list</span>
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-primary-container text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Add Member Dropdown */}
            <div className="relative" ref={addMenuRef}>
              <button
                onClick={() => setShowAddMenu(prev => !prev)}
                className="bg-primary-container text-on-primary font-label-md text-label-md px-4 py-2 h-[36px] rounded-lg font-bold hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span className="hidden sm:inline">Add Member</span>
                <span className="material-symbols-outlined text-[16px] ml-0.5">expand_more</span>
              </button>

              {showAddMenu && (
                <div className="absolute right-0 mt-2 w-[220px] bg-[#111118] border border-[rgba(255,255,255,0.08)] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-50 overflow-hidden">
                  <Link
                    to="/members/add"
                    onClick={() => setShowAddMenu(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[rgba(255,255,255,0.05)] transition-colors text-[13px] text-[#EEEEF0] font-medium border-b border-[rgba(255,255,255,0.05)]"
                  >
                    <span className="material-symbols-outlined text-[18px] text-primary-container">person_add</span>
                    Add Manually
                  </Link>
                  <Link
                    to="/members/import"
                    onClick={() => setShowAddMenu(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[rgba(255,255,255,0.05)] transition-colors text-[13px] text-[#EEEEF0] font-medium"
                  >
                    <span className="material-symbols-outlined text-[18px] text-secondary">upload_file</span>
                    Import from Excel
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Active Filter Tags */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-[12px] text-[#6B6B80] font-medium">Active filters:</span>
            {filters.location && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-container/15 border border-primary-container/25 text-[12px] text-primary-container font-medium">
                <span className="material-symbols-outlined text-[14px]">location_on</span>
                {filters.location}
                <button onClick={() => setFilters({ ...filters, location: '' })} className="ml-0.5 hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </span>
            )}
            {filters.society && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/15 border border-primary/25 text-[12px] text-primary font-medium">
                <span className="material-symbols-outlined text-[14px]">apartment</span>
                {filters.society}
                <button onClick={() => setFilters({ ...filters, society: '' })} className="ml-0.5 hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </span>
            )}
            {filters.classType && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-tertiary/15 border border-tertiary/25 text-[12px] text-tertiary font-medium">
                <span className="material-symbols-outlined text-[14px]">fitness_center</span>
                {filters.classType}
                <button onClick={() => setFilters({ ...filters, classType: '' })} className="ml-0.5 hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </span>
            )}
            {filters.category && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary/15 border border-secondary/25 text-[12px] text-secondary font-medium">
                <span className="material-symbols-outlined text-[14px]">person</span>
                {filters.category}
                <button onClick={() => setFilters({ ...filters, category: '' })} className="ml-0.5 hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </span>
            )}
            {filters.status && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-[12px] text-[#EEEEF0] font-medium">
                <span className={`w-1.5 h-1.5 rounded-full ${filters.status === 'active' ? 'bg-[#4ae176]' : 'bg-[#ffb596]'}`}></span>
                {filters.status === 'active' ? 'Active' : 'Inactive'}
                <button onClick={() => setFilters({ ...filters, status: '' })} className="ml-0.5 hover:text-white transition-colors text-[#6B6B80]">
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </span>
            )}
            <button
              onClick={() => setFilters({ location: '', society: '', classType: '', category: '', status: '' })}
              className="text-[12px] text-[#6B6B80] hover:text-primary-container transition-colors font-medium ml-1"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Selection action bar */}
        {selectMode && (
          <div className="mb-4 flex items-center gap-3 bg-[#111118] border border-outline-variant rounded-xl px-4 py-3 animate-fadeIn">
            <button
              onClick={handleSelectAll}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors border ${
                selectedMembers.size === members.length && members.length > 0
                  ? 'bg-primary-container/20 border-primary-container/40 text-primary-container'
                  : 'bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.08)] text-on-surface-variant hover:bg-[rgba(255,255,255,0.06)]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {selectedMembers.size === members.length && members.length > 0 ? 'check_box' : 'check_box_outline_blank'}
              </span>
              Select All ({members.length})
            </button>
            <span className="text-[13px] text-on-surface-variant">
              {selectedMembers.size > 0 ? `${selectedMembers.size} selected` : 'None selected'}
            </span>
            {selectedMembers.size > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="ml-auto flex items-center gap-2 px-4 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 font-bold text-[13px] rounded-lg transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
                Delete Selected ({selectedMembers.size})
              </button>
            )}
          </div>
        )}

        <div className="card-surface rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low/30">
                  {selectMode && (
                    <th className="px-3 py-4 w-[48px]">
                      <button onClick={handleSelectAll} className="flex items-center justify-center">
                        <span className={`material-symbols-outlined text-[20px] transition-colors ${
                          selectedMembers.size === members.length && members.length > 0 ? 'text-primary-container' : 'text-on-surface-variant'
                        }`}>
                          {selectedMembers.size === members.length && members.length > 0 ? 'check_box' : 'check_box_outline_blank'}
                        </span>
                      </button>
                    </th>
                  )}
                  <th className="px-card-padding-x py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Member</th>
                  <th className="px-card-padding-x py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Status</th>
                  <th className="px-card-padding-x py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Join Date</th>
                  <th className="px-card-padding-x py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Society</th>
                  <th className="px-card-padding-x py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Class Type</th>
                  <th className="px-card-padding-x py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Category</th>
                  <th className="px-card-padding-x py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      {selectMode && <td className="px-3 py-4"><div className="w-5 h-5 bg-[#1a1a24] rounded animate-pulse"></div></td>}
                      <td className="px-card-padding-x py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#1a1a24] animate-pulse"></div>
                          <div className="space-y-2">
                            <div className="h-4 w-28 bg-[#1a1a24] rounded animate-pulse"></div>
                            <div className="h-3 w-20 bg-[#1a1a24] rounded animate-pulse"></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-card-padding-x py-4"><div className="h-5 w-16 bg-[#1a1a24] rounded animate-pulse"></div></td>
                      <td className="px-card-padding-x py-4"><div className="h-4 w-20 bg-[#1a1a24] rounded animate-pulse"></div></td>
                      <td className="px-card-padding-x py-4"><div className="h-4 w-24 bg-[#1a1a24] rounded animate-pulse"></div></td>
                      <td className="px-card-padding-x py-4"><div className="h-5 w-20 bg-[#1a1a24] rounded animate-pulse"></div></td>
                      <td className="px-card-padding-x py-4"><div className="h-5 w-16 bg-[#1a1a24] rounded animate-pulse"></div></td>
                      <td className="px-card-padding-x py-4"><div className="h-5 w-6 bg-[#1a1a24] rounded animate-pulse ml-auto"></div></td>
                    </tr>
                  ))
                ) : members.length === 0 ? (
                  <tr>
                    <td colSpan={selectMode ? 8 : 7} className="px-card-padding-x py-8 text-center text-on-surface-variant">
                      No members found.
                    </td>
                  </tr>
                ) : (
                  members.map(member => (
                    <tr key={member.id} className={`hover:bg-surface-container-high/30 transition-colors cursor-pointer ${selectedMembers.has(member.id) ? 'bg-primary-container/5' : ''}`} >
                      {selectMode && (
                        <td className="px-3 py-4">
                          <button onClick={() => handleToggleSelect(member.id)} className="flex items-center justify-center">
                            <span className={`material-symbols-outlined text-[20px] transition-colors ${selectedMembers.has(member.id) ? 'text-primary-container' : 'text-on-surface-variant hover:text-on-surface'}`}>
                              {selectedMembers.has(member.id) ? 'check_box' : 'check_box_outline_blank'}
                            </span>
                          </button>
                        </td>
                      )}
                      <td className="px-card-padding-x py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center border border-outline-variant font-bold text-primary">
                            {member.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-body-lg text-body-lg font-bold text-on-surface">{member.name}</div>
                            <div className="font-label-sm text-label-sm text-on-surface-variant">{member.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-card-padding-x py-4">
                        <span className={`px-2.5 py-1 rounded-md font-label-md text-label-md font-bold ${member.isActive ? 'dim-success' : 'dim-warning'}`}>
                          {member.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-card-padding-x py-4 font-body-md text-body-md text-on-surface-variant">
                        {new Date(member.joiningDate).toLocaleDateString()}
                      </td>
                      <td className="px-card-padding-x py-4 font-body-md text-body-md text-on-surface-variant">
                        {member.society || '—'}
                      </td>
                      <td className="px-card-padding-x py-4">
                        <span className="px-2.5 py-1 rounded-md font-label-md text-label-md font-bold bg-primary-container/15 text-primary-container border border-primary-container/20 capitalize">
                          {member.classType.toLowerCase()}
                        </span>
                      </td>
                      <td className="px-card-padding-x py-4">
                        <span className="px-2.5 py-1 rounded-md font-label-md text-label-md font-bold bg-secondary/15 text-secondary border border-secondary/20 capitalize">
                          {member.category.toLowerCase()}
                        </span>
                      </td>
                      <td className="px-card-padding-x py-4 text-right">
                        <div className="relative inline-block" ref={openMenuId === member.id ? menuRef : null}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (openMenuId === member.id) {
                                setOpenMenuId(null);
                              } else {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setMenuPosition({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                                setOpenMenuId(member.id);
                              }
                            }}
                            className="p-2 hover:bg-surface-variant rounded-lg text-on-surface-variant transition-colors"
                          >
                            <span className="material-symbols-outlined">more_vert</span>
                          </button>
                        </div>

                        {openMenuId === member.id && (
                          <div
                            ref={menuRef}
                            style={{ top: menuPosition.top, right: menuPosition.right }}
                            className="fixed w-[200px] bg-[#111118] border border-[rgba(255,255,255,0.07)] rounded-xl shadow-2xl z-[100] py-1.5 animate-fadeIn"
                          >
                            <button
                              onClick={() => { navigate(`/members/${member.id}`); setOpenMenuId(null); }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[13px] text-[#EEEEF0] hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                            >
                              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">visibility</span>
                              View Details
                            </button>
                            <button
                              onClick={() => { navigate(`/members/${member.id}/edit`); setOpenMenuId(null); }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[13px] text-[#EEEEF0] hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                            >
                              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">edit</span>
                              Edit Member
                            </button>
                            <div className="mx-3 my-1.5 border-t border-[rgba(255,255,255,0.05)]"></div>
                            <button
                              onClick={() => handleToggleStatus(member.id)}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[13px] text-[#EEEEF0] hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                            >
                              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">{member.isActive ? 'person_off' : 'person'}</span>
                              {member.isActive ? 'Mark as Inactive' : 'Mark as Active'}
                            </button>
                            <button
                              onClick={() => handleDelete(member.id)}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-[13px] text-[#EF4444] hover:bg-[#EF4444]/5 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                              Delete Member
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Load More / Show count */}
          {!loading && members.length > 0 && (
            <div className="flex items-center justify-between px-card-padding-x py-4 border-t border-outline-variant/50">
              <span className="text-[13px] text-on-surface-variant">
                Showing {members.length} of {totalCount} members
              </span>
              {hasMore && !search && (
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="flex items-center gap-2 px-4 py-2 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.08)] text-[13px] text-on-surface font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {loadingMore ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                      Loading...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">expand_more</span>
                      Load More
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Danger Zone: Delete All Data */}
        <div className="mt-12 mb-8 bg-[#1a1111] border border-red-500/20 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_8px_32px_rgba(239,68,68,0.05)] overflow-hidden relative">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-red-500/5 rounded-full blur-[80px] pointer-events-none"></div>
          <div>
            <h2 className="text-[18px] font-bold text-red-500 flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined">warning</span>
              Danger Zone
            </h2>
            <p className="text-[14px] text-on-surface-variant max-w-[600px]">
              This will permanently delete all member records from the database. This action cannot be undone. All related analytics and history will be wiped.
            </p>
          </div>
          <button 
            onClick={() => setShowWipeConfirm(true)}
            className="shrink-0 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 font-bold text-[14px] rounded-xl transition-all flex items-center gap-2 active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">delete_forever</span>
            Wipe All Data
          </button>
        </div>
      </main>

      <BottomNav />

      {/* Filter Popup */}
      <MemberFilters
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={handleApplyFilters}
        filters={filters}
        allLocations={allLocations}
        allSocieties={allSocieties}
      />

      {/* Wipe Confirmation Modal 1 */}
      {showWipeConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#111118] border border-red-500/20 rounded-2xl w-full max-w-[400px] p-6 shadow-[0_20px_60px_rgba(239,68,68,0.15)] animate-slideUp">
            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mb-5 mx-auto border border-red-500/20">
              <span className="material-symbols-outlined text-[28px] text-red-500">warning</span>
            </div>
            <h3 className="text-[20px] font-bold text-white text-center mb-3">Wipe All Member Data?</h3>
            <p className="text-[14px] text-on-surface-variant text-center mb-8">
              You are about to delete <strong className="text-white">{totalCount}</strong> members. This action is irreversible and will destroy all records.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowWipeConfirm(false)}
                className="flex-1 px-4 py-3 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.08)] text-white text-[14px] font-medium rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setShowWipeConfirm(false);
                  setShowWipeFinal(true);
                }}
                className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 active:scale-[0.98] text-white text-[14px] font-bold rounded-xl transition-all shadow-[0_4px_14px_rgba(239,68,68,0.4)]"
              >
                Yes, Proceed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wipe Final Confirmation Modal 2 */}
      {showWipeFinal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0A0A0F] border border-red-500/40 rounded-3xl w-full max-w-[450px] p-8 shadow-[0_0_100px_rgba(239,68,68,0.2)] animate-slideUp relative overflow-hidden">
            {/* Animated alert background */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-red-400 to-red-600 animate-[loadBar_2s_ease-in-out_infinite]"></div>
            
            <h3 className="text-[22px] font-bold text-white mb-2">Final Confirmation</h3>
            <p className="text-[14px] text-on-surface-variant mb-6">
              To confirm the permanent deletion of all data, please type <strong className="text-white select-none">Delete</strong> below.
            </p>
            
            <input 
              type="text"
              value={wipeInput}
              onChange={(e) => setWipeInput(e.target.value)}
              placeholder="Type 'Delete' here"
              className="w-full h-[50px] bg-[#16161F] border border-red-500/30 focus:border-red-500 focus:ring-[3px] focus:ring-red-500/10 outline-none rounded-xl px-4 text-white text-center font-bold text-[16px] mb-8 transition-all"
              autoFocus
            />

            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setShowWipeFinal(false);
                  setWipeInput('');
                }}
                disabled={wiping}
                className="flex-1 px-4 py-3 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.08)] text-white text-[14px] font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleWipeAll}
                disabled={wiping || wipeInput.toLowerCase() !== 'delete'}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 active:scale-[0.98] text-white text-[14px] font-bold rounded-xl transition-all shadow-[0_4px_20px_rgba(239,68,68,0.5)] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
              >
                {wiping ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                    Deleting...
                  </>
                ) : (
                  'Confirm Wipe'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Members;
