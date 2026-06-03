import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import BottomNav from '../components/layout/BottomNav';
import { useToast } from '../components/ui/Toast';
import api from '../services/api';

const MemberDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

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
      <div className="min-h-screen bg-[#0A0A0F]">
        <Navbar />
        <main className="pt-6 px-4 max-w-md mx-auto space-y-4">
          <div className="h-4 w-24 bg-[#1a1a24] rounded animate-pulse mb-4"></div>
          <div className="bg-[#111118] card-border rounded-xl p-6 flex flex-col items-center">
            <div className="w-[72px] h-[72px] rounded-full bg-[#1a1a24] animate-pulse mb-4"></div>
            <div className="h-6 w-40 bg-[#1a1a24] rounded animate-pulse mb-2"></div>
            <div className="h-5 w-20 bg-[#1a1a24] rounded animate-pulse"></div>
          </div>
        </main>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-[#0A0A0F]">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center text-on-surface-variant gap-4 min-h-[60vh]">
          <span className="material-symbols-outlined text-[48px] text-[#6B6B80]/30">person_off</span>
          <p className="text-[16px] text-[#6B6B80]">Member not found.</p>
          <Link to="/members" className="text-primary-container hover:underline">Go back to members</Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] pb-24 text-on-surface font-body-md">
      <Navbar />
      
      <main className="pt-6 px-4 max-w-md mx-auto space-y-4">
        <nav className="flex items-center gap-2 mb-2">
          <Link to="/members" className="text-[13px] text-[#6B6B80] hover:text-primary-container transition-colors">Members</Link>
          <span className="text-[#3A3A4A] text-[13px]">/</span>
          <span className="text-[13px] text-[#6B6B80] truncate max-w-[200px]">{member.name}</span>
        </nav>

        <section className="ultra-dark-card rounded-xl p-card-padding-x flex flex-col items-center text-center">
          <div className="w-[72px] h-[72px] rounded-full bg-[rgba(255,107,26,0.15)] border-2 border-[rgba(255,107,26,0.3)] flex items-center justify-center mb-3">
            <span className="font-bold text-[24px] text-primary-container">{member.name.substring(0,2).toUpperCase()}</span>
          </div>
          <h2 className="font-headline-sm text-headline-sm text-[#EEEEF0] mt-3">{member.name}</h2>
          
          <div className={`mt-2 inline-flex items-center px-3 py-1 rounded-full ${member.isActive ? 'bg-secondary-container/20 border border-secondary-container/30' : 'bg-red-500/20 border border-red-500/30'}`}>
            <span className={`w-1.5 h-1.5 rounded-full mr-2 ${member.isActive ? 'bg-secondary' : 'bg-red-500'}`}></span>
            <span className={`font-label-md text-label-md ${member.isActive ? 'text-secondary' : 'text-red-500'}`}>{member.isActive ? 'Active' : 'Inactive'}</span>
          </div>
          
          <p className="mt-2 text-[12px] text-[#6B6B80]">Member since {new Date(member.joiningDate).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</p>
          
          <div className="w-full mt-6 space-y-3">
            <button 
              onClick={() => navigate(`/members/${id}/edit`)}
              className="w-full h-[36px] bg-[#FF6B1A] text-[#EEEEF0] rounded-lg font-label-md text-label-md hover:brightness-110 active:scale-95 transition-all"
            >
              Edit Member
            </button>
            <button 
              onClick={handleToggleStatus}
              className="w-full h-[36px] bg-transparent border border-[#3A3A4A] text-on-surface-variant rounded-lg font-label-md text-label-md hover:bg-surface-container-highest transition-all active:scale-95"
            >
              {member.isActive ? 'Deactivate' : 'Activate'}
            </button>
            <button 
              onClick={handleDelete}
              className="w-full h-[36px] border border-[#EF4444] text-[#EF4444] rounded-lg font-label-md text-label-md flex items-center justify-center gap-2 hover:bg-[#EF4444]/10 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
              Delete Member
            </button>
          </div>
        </section>

        <section className="flex flex-wrap gap-2 justify-center">
          <div className="px-4 py-1.5 bg-[rgba(255,255,255,0.04)] border border-outline-variant/30 rounded-full">
            <span className="text-[13px] text-[#6B6B80] capitalize">{member.classType.toLowerCase()} Training</span>
          </div>
          <div className="px-4 py-1.5 bg-[rgba(255,255,255,0.04)] border border-outline-variant/30 rounded-full">
            <span className="text-[13px] text-[#6B6B80] capitalize">{member.category.toLowerCase()}</span>
          </div>
        </section>

        <section className="ultra-dark-card rounded-xl p-card-padding-x">
          <div className="pb-3 mb-4 border-b divider-white-05">
            <h3 className="font-label-md text-label-md text-[#6B6B80] tracking-[0.1em] uppercase">MEMBER DETAILS</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary-container text-[20px]">call</span>
                <span className="font-label-md text-label-md text-[#6B6B80]">Phone Number</span>
              </div>
              <span className="font-body-md text-body-md text-[#EEEEF0]">{member.phone}</span>
            </div>
            <hr className="divider-white-05" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary-container text-[20px]">cake</span>
                <span className="font-label-md text-label-md text-[#6B6B80]">Age</span>
              </div>
              <span className="font-body-md text-body-md text-[#EEEEF0]">{member.age}</span>
            </div>
            <hr className="divider-white-05" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary-container text-[20px]">location_on</span>
                <span className="font-label-md text-label-md text-[#6B6B80]">Location</span>
              </div>
              <span className="font-body-md text-body-md text-[#EEEEF0]">{member.location}</span>
            </div>
            <hr className="divider-white-05" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary-container text-[20px]">fitness_center</span>
                <span className="font-label-md text-label-md text-[#6B6B80]">Class Type</span>
              </div>
              <span className="px-3 py-0.5 rounded bg-primary-container/20 text-primary-container font-label-md text-label-md border border-primary-container/30 capitalize">
                {member.classType.toLowerCase()}
              </span>
            </div>
            <hr className="divider-white-05" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary-container text-[20px]">person</span>
                <span className="font-label-md text-label-md text-[#6B6B80]">Category</span>
              </div>
              <span className="px-3 py-0.5 rounded bg-secondary-container/20 text-secondary font-label-md text-label-md border border-secondary-container/30 capitalize">
                {member.category.toLowerCase()}
              </span>
            </div>
            <hr className="divider-white-05" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary-container text-[20px]">calendar_month</span>
                <span className="font-label-md text-label-md text-[#6B6B80]">Joining Date</span>
              </div>
              <span className="font-body-md text-body-md text-[#EEEEF0]">
                {new Date(member.joiningDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>
        </section>

        {/* Guardian Details — only shown when data exists */}
        {(member.guardianName || member.guardianPhone) && (
          <section className="ultra-dark-card rounded-xl p-card-padding-x">
            <div className="pb-3 mb-4 border-b divider-white-05">
              <h3 className="font-label-md text-label-md text-[#6B6B80] tracking-[0.1em] uppercase">GUARDIAN DETAILS</h3>
            </div>
            <div className="space-y-4">
              {member.guardianName && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary-container text-[20px]">supervisor_account</span>
                    <span className="font-label-md text-label-md text-[#6B6B80]">Guardian Name</span>
                  </div>
                  <span className="font-body-md text-body-md text-[#EEEEF0]">{member.guardianName}</span>
                </div>
              )}
              {member.guardianName && member.guardianPhone && <hr className="divider-white-05" />}
              {member.guardianPhone && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary-container text-[20px]">phone_forwarded</span>
                    <span className="font-label-md text-label-md text-[#6B6B80]">Guardian Phone</span>
                  </div>
                  <span className="font-body-md text-body-md text-[#EEEEF0]">{member.guardianPhone}</span>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default MemberDetail;
