import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import BottomNav from '../components/layout/BottomNav';
import AttendanceCalendar from '../components/members/AttendanceCalendar';
import { useToast } from '../components/ui/Toast';
import useAuthStore from '../store/authStore';
import api from '../services/api';

const STEPS = ['Select Members', 'Mark Attendance'];

const Attendance = () => {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [saving, setSaving] = useState(false);

  // Calendar state
  const [selectedDate, setSelectedDate] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [existingRecords, setExistingRecords] = useState({});

  // Fetch only PERSONAL class members
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await api.get('/members?limit=9999&classType=PERSONAL');
        if (res.data.success) {
          setMembers(res.data.data.members.filter(m => m.classType === 'PERSONAL'));
        }
      } catch (err) {
        toast.error('Failed to load members');
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, []);

  // Filter members by search
  const filteredMembers = useMemo(() => {
    if (!search.trim()) return members;
    const q = search.toLowerCase();
    return members.filter(m =>
      m.name.toLowerCase().includes(q) ||
      m.phone.includes(q)
    );
  }, [members, search]);

  // Selection handlers
  const handleToggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredMembers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredMembers.map(m => m.id)));
    }
  };

  // When a date is selected on the calendar
  const handleDateClick = (dateKey) => {
    setSelectedDate(dateKey);
  };

  // Fetch existing attendance for selected members when step 2 is entered
  useEffect(() => {
    if (step === 1 && selectedIds.size > 0) {
      const fetchExisting = async () => {
        try {
          const promises = [...selectedIds].map(id => api.get(`/attendance/${id}`));
          const results = await Promise.all(promises);
          const recordsByMember = {};
          results.forEach((res, idx) => {
            const memberId = [...selectedIds][idx];
            if (res.data.success) {
              recordsByMember[memberId] = res.data.data.records;
            }
          });
          setExistingRecords(recordsByMember);

          // Build combined records for calendar display
          const allRecords = [];
          Object.values(recordsByMember).forEach(records => {
            records.forEach(r => {
              if (!allRecords.find(ar => ar.date === r.date)) {
                allRecords.push(r);
              }
            });
          });
          setAttendanceRecords(allRecords);
        } catch (err) {
          console.error('Failed to fetch existing attendance:', err);
        }
      };
      fetchExisting();
    }
  }, [step, selectedIds]);

  // Mark all selected members as present for the selected date
  const handleMarkPresent = async () => {
    if (!selectedDate || selectedIds.size === 0) return;

    setSaving(true);
    try {
      const res = await api.post('/attendance/mark', {
        memberIds: [...selectedIds],
        date: selectedDate,
        present: true,
      });
      if (res.data.success) {
        toast.success(`Attendance marked for ${selectedIds.size} member(s) on ${formatDate(selectedDate)}`);
        // Update local records
        const newRecord = { date: selectedDate, present: true };
        setAttendanceRecords(prev => {
          const filtered = prev.filter(r => {
            const d = new Date(r.date);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            return key !== selectedDate;
          });
          return [...filtered, newRecord];
        });
        setSelectedDate(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark attendance');
    } finally {
      setSaving(false);
    }
  };

  // Mark a single member as present for the selected date
  const handleMarkSingleMember = async (memberId) => {
    if (!selectedDate) return;

    setSaving(true);
    try {
      const res = await api.post('/attendance/mark', {
        memberIds: [memberId],
        date: selectedDate,
        present: true,
      });
      if (res.data.success) {
        const member = members.find(m => m.id === memberId);
        toast.success(`${member?.name || 'Member'} marked present on ${formatDate(selectedDate)}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark attendance');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateKey) => {
    const parts = dateKey.split('-');
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const selectedMembers = useMemo(() => {
    return members.filter(m => selectedIds.has(m.id));
  }, [members, selectedIds]);

  return (
    <div className="min-h-screen bg-[#0e0e0e]">
      <Navbar />

      <main className="max-w-[1440px] mx-auto px-container-margin py-8 pb-24">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => step === 0 ? navigate('/dashboard') : setStep(0)}
            className="w-10 h-10 rounded-xl bg-[#1a1a1a] border border-white/[0.06] flex items-center justify-center hover:bg-white/[0.04] transition-colors"
          >
            <span className="material-symbols-outlined text-[20px] text-[#9ca3af]">arrow_back</span>
          </button>
          <div>
            <h1 className="font-display-lg text-display-lg text-on-surface">Add Attendance</h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
              Mark attendance for personal training members
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-3 mb-8">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-bold transition-all ${
                i === step
                  ? 'bg-primary-container/20 text-primary-container border border-primary-container/30'
                  : i < step
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-[#1a1a1a] text-[#6B6B80] border border-white/[0.06]'
              }`}>
                {i < step ? (
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                ) : (
                  <span className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-[11px] font-bold" style={{
                    borderColor: i === step ? '#f97316' : '#3A3A4A',
                    color: i === step ? '#f97316' : '#3A3A4A',
                  }}>
                    {i + 1}
                  </span>
                )}
                {label}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-[2px] rounded-full ${i < step ? 'bg-emerald-500/30' : 'bg-[#3A3A4A]'}`} />
              )}
            </div>
          ))}
        </div>

        {/* ━━━ Step 1: Select Members ━━━ */}
        {step === 0 && (
          <div className="space-y-6 animate-fadeIn">
            {/* Search + Select All */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6B80] text-[20px]">search</span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search personal members..."
                  className="w-full bg-[#1a1a1a] border border-white/[0.06] rounded-xl pl-10 pr-4 py-3 text-[14px] text-[#e5e2e1] placeholder:text-[#6B6B80] outline-none focus:border-primary-container/40 transition-colors"
                />
              </div>
              <button
                onClick={handleSelectAll}
                className={`px-4 py-3 rounded-xl text-[13px] font-bold transition-all flex items-center gap-2 border ${
                  selectedIds.size === filteredMembers.length && filteredMembers.length > 0
                    ? 'bg-primary-container/20 border-primary-container/30 text-primary-container'
                    : 'bg-[#1a1a1a] border-white/[0.06] text-[#9ca3af] hover:bg-white/[0.04]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {selectedIds.size === filteredMembers.length && filteredMembers.length > 0 ? 'check_box' : 'check_box_outline_blank'}
                </span>
                Select All ({filteredMembers.length})
              </button>
            </div>

            {/* Selected count badge */}
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-primary-container/10 border border-primary-container/20 rounded-xl animate-fadeIn">
                <span className="material-symbols-outlined text-primary-container text-[18px]">group</span>
                <span className="text-[13px] font-bold text-primary-container">{selectedIds.size} member(s) selected</span>
              </div>
            )}

            {/* Members List */}
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-[#1a1a1a] border border-white/[0.06] rounded-xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#333333] animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 bg-[#333333] rounded animate-pulse" />
                      <div className="h-3 w-24 bg-[#333333] rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="material-symbols-outlined text-[48px] text-[#6B6B80]/30 mb-3">person_off</span>
                <p className="text-[14px] text-[#6B6B80]">
                  {members.length === 0
                    ? 'No personal training members found. Add members with "Personal" class type first.'
                    : 'No members match your search.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredMembers.map(member => {
                  const isSelected = selectedIds.has(member.id);
                  return (
                    <button
                      key={member.id}
                      onClick={() => handleToggleSelect(member.id)}
                      className={`w-full text-left bg-[#1a1a1a] border rounded-xl p-4 flex items-center gap-4 transition-all active:scale-[0.98] ${
                        isSelected
                          ? 'border-primary-container/40 bg-primary-container/5 shadow-[0_0_20px_rgba(249,115,22,0.05)]'
                          : 'border-white/[0.06] hover:border-white/[0.12]'
                      }`}
                    >
                      {/* Checkbox */}
                      <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${
                        isSelected
                          ? 'bg-primary-container border-primary-container'
                          : 'border-[#404040]'
                      }`}>
                        {isSelected && (
                          <span className="material-symbols-outlined text-white text-[16px]">check</span>
                        )}
                      </div>

                      {/* Avatar */}
                      {member.avatar ? (
                        <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full object-cover border border-white/[0.06] shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary-container/15 flex items-center justify-center border border-primary-container/20 shrink-0">
                          <span className="text-[12px] font-bold text-primary-container">{member.name.substring(0, 2).toUpperCase()}</span>
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-medium text-[#e5e2e1] truncate">{member.name}</p>
                        <p className="text-[12px] text-[#6B6B80] truncate">{member.phone}</p>
                      </div>

                      {/* Status */}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${member.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                        {member.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Next button */}
            {selectedIds.size > 0 && (
              <div className="sticky bottom-20 z-40">
                <button
                  onClick={() => setStep(1)}
                  className="w-full sm:w-auto float-right px-8 py-3.5 bg-gradient-to-r from-[#f97316] to-[#ea580c] text-white rounded-xl font-bold text-[14px] hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_8px_30px_rgba(249,115,22,0.25)] flex items-center gap-2"
                >
                  Next: Select Date
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ━━━ Step 2: Mark Attendance ━━━ */}
        {step === 1 && (
          <div className="animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Calendar */}
              <div className="bg-[#1a1a1a] border border-white/[0.06] rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-5">
                  <span className="material-symbols-outlined text-primary-container text-[20px]">calendar_month</span>
                  <h3 className="text-[15px] font-bold text-[#e5e2e1]">Select Date</h3>
                </div>
                <AttendanceCalendar
                  records={attendanceRecords}
                  onToggleDate={handleDateClick}
                  accentColor="#f97316"
                />
                {selectedDate && (
                  <div className="mt-4 p-3 bg-primary-container/10 border border-primary-container/20 rounded-xl animate-fadeIn">
                    <p className="text-[13px] font-bold text-primary-container flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">event</span>
                      Selected: {formatDate(selectedDate)}
                    </p>
                  </div>
                )}
              </div>

              {/* Selected Members + Actions */}
              <div className="bg-[#1a1a1a] border border-white/[0.06] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary-container text-[20px]">group</span>
                    <h3 className="text-[15px] font-bold text-[#e5e2e1]">Selected Members ({selectedMembers.length})</h3>
                  </div>
                </div>

                {/* Members list */}
                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                  {selectedMembers.map(member => (
                    <div key={member.id} className="flex items-center gap-3 p-3 bg-[#141414] border border-white/[0.04] rounded-xl">
                      {member.avatar ? (
                        <img src={member.avatar} alt={member.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary-container/15 flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-primary-container">{member.name.substring(0, 2).toUpperCase()}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-[#e5e2e1] truncate">{member.name}</p>
                      </div>
                      {selectedDate && (
                        <button
                          onClick={() => handleMarkSingleMember(member.id)}
                          disabled={saving}
                          className="px-3 py-1.5 text-[11px] font-bold rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                        >
                          Mark Present
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Mark All Present */}
                {selectedDate && (
                  <div className="mt-6 pt-4 border-t border-white/[0.06]">
                    <button
                      onClick={handleMarkPresent}
                      disabled={saving}
                      className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl font-bold text-[14px] hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_8px_30px_rgba(16,185,129,0.2)] flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                          Saving...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[18px]">check_circle</span>
                          Mark All Present ({selectedMembers.length})
                        </>
                      )}
                    </button>
                    <p className="text-[11px] text-[#6B6B80] text-center mt-2">
                      This will mark all {selectedMembers.length} selected member(s) as present on {formatDate(selectedDate)}
                    </p>
                  </div>
                )}

                {!selectedDate && (
                  <div className="mt-6 flex flex-col items-center justify-center py-8 text-center">
                    <span className="material-symbols-outlined text-[40px] text-[#6B6B80]/20 mb-3">calendar_today</span>
                    <p className="text-[13px] text-[#6B6B80]">Select a date on the calendar to mark attendance</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <BottomNav />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

export default Attendance;
