import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import BottomNav from '../components/layout/BottomNav';
import AttendanceCalendar from '../components/members/AttendanceCalendar';
import { useToast } from '../components/ui/Toast';
import useAuthStore from '../store/authStore';
import api from '../services/api';

const MemberDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLightbox, setShowLightbox] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const toast = useToast();
  const user = useAuthStore((s) => s.user);
  const isViewer = user?.role === 'VIEWER';

  useEffect(() => {
    const fetchMember = async () => {
      try {
        const res = await api.get(`/members/${id}`);
        if (res.data.success) {
          setMember(res.data.data);
        }
      } catch (err) {
        toast.error('Failed to load member details');
      } finally {
        setLoading(false);
      }
    };
    fetchMember();
  }, [id]);

  // Fetch attendance records for PERSONAL members
  useEffect(() => {
    if (member && member.classType === 'PERSONAL') {
      const fetchAttendance = async () => {
        setAttendanceLoading(true);
        try {
          const res = await api.get(`/attendance/${id}`);
          if (res.data.success) {
            setAttendanceRecords(res.data.data.records);
          }
        } catch (err) {
          console.error('Failed to fetch attendance:', err);
        } finally {
          setAttendanceLoading(false);
        }
      };
      fetchAttendance();
    }
  }, [member, id]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this member?')) {
      try {
        await api.delete(`/members/${id}`);
        toast.success('Member deleted successfully');
        navigate('/members');
      } catch (err) {
        toast.error('Failed to delete member');
      }
    }
  };

  const handleToggleStatus = async () => {
    try {
      const res = await api.patch(`/members/${id}/status`);
      if (res.data.success) {
        setMember(res.data.data);
        toast.success(`Member ${res.data.data.isActive ? 'activated' : 'deactivated'}`);
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0e0e0e]">
        <Navbar />
        <main className="pt-6 px-4 max-w-2xl mx-auto space-y-4">
          <div className="h-4 w-24 bg-[#333333] rounded animate-pulse mb-4"></div>
          <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden">
            <div className="h-[200px] bg-[#333333] animate-pulse"></div>
            <div className="p-6 flex flex-col items-center">
              <div className="w-[120px] h-[120px] rounded-full bg-[#333333] animate-pulse -mt-[80px] border-4 border-[#1a1a1a]"></div>
              <div className="h-6 w-40 bg-[#333333] rounded animate-pulse mt-4"></div>
              <div className="h-5 w-20 bg-[#333333] rounded animate-pulse mt-2"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-[#0e0e0e]">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center text-on-surface-variant gap-4 min-h-[60vh]">
          <span className="material-symbols-outlined text-[48px] text-[#6B6B80]/30">person_off</span>
          <p className="text-[16px] text-[#6B6B80]">Member not found.</p>
          <Link to="/members" className="text-primary-container hover:underline">Go back to members</Link>
        </main>
      </div>
    );
  }

  const joinDate = new Date(member.joiningDate);
  const daysSinceJoining = Math.floor((new Date() - joinDate) / (1000 * 60 * 60 * 24));

  const DetailRow = ({ icon, label, value, badge, badgeColor }) => (
    <div className="flex items-center justify-between py-3.5">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[rgba(249,115,22,0.08)] flex items-center justify-center">
          <span className="material-symbols-outlined text-primary-container text-[18px]">{icon}</span>
        </div>
        <span className="text-[13px] text-[#78716c] font-medium">{label}</span>
      </div>
      {badge ? (
        <span className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase border ${badgeColor}`}>
          {value}
        </span>
      ) : (
        <span className="text-[14px] text-[#e5e2e1] font-medium">{value}</span>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0e0e0e] pb-24 text-on-surface font-body-md">
      <Navbar />
      
      {/* Photo Lightbox */}
      {showLightbox && member.avatar && (
        <div 
          className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-fadeIn cursor-pointer"
          onClick={() => setShowLightbox(false)}
        >
          <button 
            className="absolute top-6 right-6 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
            onClick={() => setShowLightbox(false)}
          >
            <span className="material-symbols-outlined text-white text-[24px]">close</span>
          </button>
          <img 
            src={member.avatar} 
            alt={member.name} 
            className="w-[95vw] md:w-auto md:max-w-[80vw] h-auto max-h-[85vh] rounded-2xl object-contain shadow-[0_0_50px_rgba(0,0,0,0.8)]"
            onClick={(e) => e.stopPropagation()}
          />
          <p className="absolute bottom-8 text-white/60 text-[13px] font-medium">{member.name}</p>
        </div>
      )}

      <main className="pt-6 px-4 max-w-2xl mx-auto space-y-5">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 mb-2">
          <Link to="/members" className="text-[13px] text-[#6B6B80] hover:text-primary-container transition-colors flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Members
          </Link>
          <span className="text-[#3A3A4A] text-[13px]">/</span>
          <span className="text-[13px] text-[#6B6B80] truncate max-w-[200px]">{member.name}</span>
        </nav>

        {/* ━━━ Hero Card ━━━ */}
        <section className="rounded-2xl overflow-hidden bg-[#1a1a1a] border border-white/[0.06]">
          {/* Gradient banner */}
          <div className="h-[140px] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#f97316]/30 via-[#ea580c]/15 to-[#0e0e0e]/80"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(249,115,22,0.25)_0%,transparent_60%)]"></div>
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#1a1a1a] to-transparent"></div>
            
            {/* Action buttons on banner */}
            {!isViewer && (
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <button 
                  onClick={() => navigate(`/members/${id}/edit`)}
                  className="h-8 px-4 bg-white/10 backdrop-blur-md rounded-full text-[12px] font-bold text-white hover:bg-white/20 transition-all flex items-center gap-1.5 border border-white/10"
                >
                  <span className="material-symbols-outlined text-[15px]">edit</span>
                  Edit
                </button>
              </div>
            )}
          </div>

          {/* Profile info */}
          <div className="px-6 pb-6 flex flex-col items-center text-center -mt-[80px] relative z-10">
            {/* Avatar */}
            {member.avatar ? (
              <div 
                className="w-[160px] h-[160px] rounded-full cursor-pointer group relative"
                onClick={() => setShowLightbox(true)}
              >
                <img 
                  src={member.avatar} 
                  alt={member.name} 
                  className="w-full h-full rounded-full object-cover border-[6px] border-[#1a1a1a] shadow-xl group-hover:brightness-110 transition-all duration-300"
                />
                <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-[32px] opacity-0 group-hover:opacity-100 transition-opacity">zoom_in</span>
                </div>
              </div>
            ) : (
              <div className="w-[160px] h-[160px] rounded-full bg-gradient-to-br from-[#f97316]/20 to-[#ea580c]/10 border-[6px] border-[#1a1a1a] flex items-center justify-center shadow-xl">
                <span className="font-bold text-[48px] text-primary-container font-headline">{member.name.substring(0,2).toUpperCase()}</span>
              </div>
            )}

            <h2 className="font-headline text-[22px] font-bold text-[#e5e2e1] mt-4 tracking-tight">{member.name}</h2>
            
            {/* Status badge */}
            <div className={`mt-2 inline-flex items-center px-3.5 py-1.5 rounded-full gap-2 ${member.isActive ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
              <span className={`w-2 h-2 rounded-full ${member.isActive ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`}></span>
              <span className={`text-[11px] font-bold tracking-wider uppercase ${member.isActive ? 'text-emerald-400' : 'text-red-400'}`}>{member.isActive ? 'Active' : 'Inactive'}</span>
            </div>
            
            <p className="mt-2 text-[12px] text-[#78716c]">Member since {joinDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })} · {daysSinceJoining} days</p>

            {/* Quick tags */}
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              <div className="px-3.5 py-1.5 bg-[rgba(249,115,22,0.08)] border border-[rgba(249,115,22,0.15)] rounded-lg">
                <span className="text-[12px] text-primary-container font-medium capitalize flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">fitness_center</span>
                  {member.classType.toLowerCase()}
                </span>
              </div>
              <div className="px-3.5 py-1.5 bg-[rgba(253,186,116,0.08)] border border-[rgba(253,186,116,0.15)] rounded-lg">
                <span className="text-[12px] text-secondary font-medium capitalize flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">group</span>
                  {member.category.toLowerCase()}
                </span>
              </div>
              {member.society && (
                <div className="px-3.5 py-1.5 bg-[rgba(141,205,255,0.08)] border border-[rgba(141,205,255,0.15)] rounded-lg">
                  <span className="text-[12px] text-tertiary font-medium flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">apartment</span>
                    {member.society}
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ━━━ Details Card ━━━ */}
        <section className="rounded-2xl bg-[#1a1a1a] border border-white/[0.06] p-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary-container text-[18px]">badge</span>
            <h3 className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#78716c]">Member Details</h3>
          </div>
          
          <div className="divide-y divide-white/[0.04]">
            <DetailRow icon="call" label="Phone" value={member.phone} />
            <DetailRow icon="cake" label="Age" value={`${member.age} years`} />
            <DetailRow icon="location_on" label="Location" value={member.location} />
            <DetailRow 
              icon="fitness_center" 
              label="Class Type" 
              value={member.classType.toLowerCase()} 
              badge 
              badgeColor="bg-primary-container/10 text-primary-container border-primary-container/20" 
            />
            <DetailRow 
              icon="person" 
              label="Category" 
              value={member.category.toLowerCase()} 
              badge 
              badgeColor="bg-secondary/10 text-secondary border-secondary/20" 
            />
            <DetailRow 
              icon="calendar_month" 
              label="Joined" 
              value={joinDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} 
            />
            {member.society && (
              <DetailRow icon="apartment" label="Society" value={member.society} />
            )}
          </div>
        </section>

        {/* ━━━ Guardian Card ━━━ */}
        {(member.guardianName || member.guardianPhone) && (
          <section className="rounded-2xl bg-[#1a1a1a] border border-white/[0.06] p-6">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-primary-container text-[18px]">family_restroom</span>
              <h3 className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#78716c]">Guardian Details</h3>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {member.guardianName && (
                <DetailRow icon="supervisor_account" label="Guardian Name" value={member.guardianName} />
              )}
              {member.guardianPhone && (
                <DetailRow icon="phone_forwarded" label="Guardian Phone" value={member.guardianPhone} />
              )}
            </div>
          </section>
        )}

        {/* ━━━ Attendance Calendar ━━━ */}
        {member.classType === 'PERSONAL' && (
          <section className="rounded-2xl bg-[#1a1a1a] border border-white/[0.06] p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary-container text-[18px]">event_available</span>
              <h3 className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#78716c]">Attendance Record</h3>
            </div>
            {attendanceLoading ? (
              <div className="flex items-center justify-center py-12">
                <span className="material-symbols-outlined animate-spin text-[24px] text-[#6B6B80]">progress_activity</span>
              </div>
            ) : attendanceRecords.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <span className="material-symbols-outlined text-[40px] text-[#6B6B80]/20 mb-3">calendar_today</span>
                <p className="text-[13px] text-[#6B6B80]">No attendance records yet</p>
              </div>
            ) : (
              <AttendanceCalendar
                records={attendanceRecords}
                readOnly={true}
                showFullYear={true}
                accentColor="#f97316"
              />
            )}
          </section>
        )}

        {/* ━━━ Actions Card ━━━ */}
        {!isViewer && (
          <section className="rounded-2xl bg-[#1a1a1a] border border-white/[0.06] p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary-container text-[18px]">settings</span>
              <h3 className="text-[11px] font-bold tracking-[0.15em] uppercase text-[#78716c]">Actions</h3>
            </div>
            <div className="space-y-3">
              <button 
                onClick={() => navigate(`/members/${id}/edit`)}
                className="w-full h-[44px] bg-gradient-to-r from-[#f97316] to-[#ea580c] text-white rounded-xl font-medium text-[14px] hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[rgba(249,115,22,0.15)]"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
                Edit Member
              </button>
              <button 
                onClick={handleToggleStatus}
                className="w-full h-[44px] bg-transparent border border-[#44403c] text-[#a8a29e] rounded-xl font-medium text-[14px] hover:bg-white/[0.03] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">{member.isActive ? 'toggle_off' : 'toggle_on'}</span>
                {member.isActive ? 'Deactivate Member' : 'Activate Member'}
              </button>
              <button 
                onClick={handleDelete}
                className="w-full h-[44px] border border-red-500/30 text-red-400 rounded-xl font-medium text-[14px] flex items-center justify-center gap-2 hover:bg-red-500/5 transition-all active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
                Delete Member
              </button>
            </div>
          </section>
        )}
      </main>

      <BottomNav />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default MemberDetail;
