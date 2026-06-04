import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import BottomNav from '../components/layout/BottomNav';
import SocietyInput from '../components/members/SocietyInput';
import { useToast } from '../components/ui/Toast';
import api from '../services/api';

const AddMember = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm({
    defaultValues: {
      isActive: true,
      classType: 'PERSONAL',
      category: 'ADULTS'
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);
  const [error, setError] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(null);
  const avatarInputRef = useRef(null);
  const navigate = useNavigate();
  const toast = useToast();

  const classType = watch('classType');
  const category = watch('category');
  const isActive = watch('isActive');

  // Read image in original size and quality (no compression)
  const getOriginalImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.');
      return;
    }
    const original = await getOriginalImage(file);
    setAvatarPreview(original);
  };

  const removeAvatar = () => {
    setAvatarPreview(null);
    if (avatarInputRef.current) avatarInputRef.current.value = '';
  };

  // Fetch existing member data for edit mode
  useEffect(() => {
    if (!isEditMode) return;

    const fetchMember = async () => {
      try {
        const res = await api.get(`/members/${id}`);
        if (res.data.success) {
          const m = res.data.data;
          // Format joining date for the date input (YYYY-MM-DD)
          const jd = m.joiningDate ? new Date(m.joiningDate).toISOString().split('T')[0] : '';
          reset({
            name: m.name || '',
            phone: m.phone || '',
            age: m.age || '',
            location: m.location || '',
            society: m.society || '',
            joiningDate: jd,
            classType: m.classType || 'PERSONAL',
            category: m.category || 'ADULTS',
            isActive: m.isActive !== undefined ? m.isActive : true,
            guardianName: m.guardianName || '',
            guardianPhone: m.guardianPhone || '',
          });
          if (m.avatar) setAvatarPreview(m.avatar);
        }
      } catch (err) {
        toast.error('Failed to load member data');
        navigate('/members');
      } finally {
        setFetching(false);
      }
    };
    fetchMember();
  }, [id, isEditMode]);

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...data,
        age: parseInt(data.age, 10),
        avatar: avatarPreview || null,
      };
      
      if (isEditMode) {
        const response = await api.put(`/members/${id}`, payload);
        if (response.data.success) {
          toast.success('Member updated successfully!');
          navigate(`/members/${id}`);
        }
      } else {
        const response = await api.post('/members', payload);
        if (response.data.success) {
          toast.success('Member added successfully!');
          navigate('/members');
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'add'} member.`;
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Show skeleton loader while fetching member data in edit mode
  if (fetching) {
    return (
      <div className="min-h-screen flex flex-col bg-[#0e0e0e] pb-[80px] md:pb-0">
        <Navbar />
        <main className="flex-1 px-container-margin py-6 flex flex-col gap-6 max-w-[600px] mx-auto w-full">
          <div className="flex flex-col gap-1">
            <div className="h-4 w-20 bg-[#333333] rounded animate-pulse"></div>
            <div className="h-7 w-48 bg-[#333333] rounded animate-pulse mt-1"></div>
          </div>
          <div className="bg-[#1a1a1a] border border-[rgba(255,255,255,0.07)] rounded-[12px] p-6 flex flex-col gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <div className="h-3 w-20 bg-[#333333] rounded animate-pulse"></div>
                <div className="h-[40px] w-full bg-[#333333] rounded-[8px] animate-pulse"></div>
              </div>
            ))}
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0e0e0e] pb-[80px] md:pb-0">
      <Navbar />
      
      <main className="flex-1 px-container-margin py-6 flex flex-col gap-6 max-w-[600px] mx-auto w-full">
        <div className="flex flex-col gap-1">
          <Link to={isEditMode ? `/members/${id}` : '/members'} className="flex items-center text-[13px] text-[#6B6B80] hover:text-on-surface transition-colors w-fit">
            <span className="material-symbols-outlined text-[16px] mr-1">arrow_back</span>
            {isEditMode ? 'Member Details' : 'Members'}
          </Link>
          <h2 className="text-[22px] font-bold text-white">{isEditMode ? 'Edit Member' : 'Add New Member'}</h2>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="bg-[#1a1a1a] border border-[rgba(255,255,255,0.07)] rounded-[12px] p-6 flex flex-col gap-8 w-full">
          <section className="flex flex-col">
            <div className="border-b border-outline-variant pb-2 mb-4">
              <h3 className="text-[11px] uppercase tracking-wider text-[#6B6B80] font-bold">Personal Information</h3>
            </div>
            
            {/* Avatar Upload */}
            <div className="flex flex-col items-center gap-3 mb-6">
              <div 
                className="relative w-[80px] h-[80px] rounded-full cursor-pointer group"
                onClick={() => avatarInputRef.current?.click()}
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full rounded-full object-cover border-2 border-primary-container/40" />
                ) : (
                  <div className="w-full h-full rounded-full bg-[#262626] border-2 border-dashed border-outline-variant flex items-center justify-center group-hover:border-primary-container/50 transition-colors">
                    <span className="material-symbols-outlined text-[28px] text-[#6B6B80] group-hover:text-primary-container transition-colors">add_a_photo</span>
                  </div>
                )}
                <div className="absolute bottom-0 right-0 w-6 h-6 bg-primary-container rounded-full flex items-center justify-center border-2 border-[#1a1a1a]">
                  <span className="material-symbols-outlined text-[14px] text-white">{avatarPreview ? 'edit' : 'add'}</span>
                </div>
              </div>
              <input 
                ref={avatarInputRef}
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleAvatarChange}
              />
              {avatarPreview ? (
                <button type="button" onClick={removeAvatar} className="text-[12px] text-red-400 hover:text-red-300 transition-colors">
                  Remove photo
                </button>
              ) : (
                <p className="text-[12px] text-[#6B6B80]">Add member photo</p>
              )}
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-[#6B6B80]">Full Name</label>
                <input 
                  {...register('name', { required: 'Name is required' })}
                  className="w-full h-[40px] bg-[#262626] border border-[rgba(255,255,255,0.08)] rounded-[8px] px-3 text-[#EEEEF0] focus:ring-1 focus:ring-primary-container outline-none transition-all" 
                  type="text" 
                  placeholder="Jonathan Wick"
                />
                {errors.name && <span className="text-red-500 text-xs">{errors.name.message}</span>}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-[#6B6B80]">Phone Number</label>
                <input 
                  {...register('phone', { required: 'Phone is required' })}
                  className="w-full h-[40px] bg-[#262626] border border-[rgba(255,255,255,0.08)] rounded-[8px] px-3 text-[#EEEEF0] focus:ring-1 focus:ring-primary-container outline-none transition-all" 
                  type="tel" 
                  placeholder="+1 (555) 012"
                />
                {errors.phone && <span className="text-red-500 text-xs">{errors.phone.message}</span>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-[#6B6B80]">Age</label>
                  <input 
                    {...register('age', { required: 'Age is required', min: 1 })}
                    className="w-full h-[40px] bg-[#262626] border border-[rgba(255,255,255,0.08)] rounded-[8px] px-3 text-[#EEEEF0] focus:ring-1 focus:ring-primary-container outline-none transition-all" 
                    type="number" 
                    placeholder="28"
                  />
                  {errors.age && <span className="text-red-500 text-xs">{errors.age.message}</span>}
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-[#6B6B80]">Location</label>
                  <input 
                    {...register('location', { required: 'Location is required' })}
                    className="w-full h-[40px] bg-[#262626] border border-[rgba(255,255,255,0.08)] rounded-[8px] px-3 text-[#EEEEF0] focus:ring-1 focus:ring-primary-container outline-none transition-all" 
                    type="text" 
                    placeholder="Mumbai, India"
                  />
                  {errors.location && <span className="text-red-500 text-xs">{errors.location.message}</span>}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-[#6B6B80]">Society / Apartment</label>
                <SocietyInput
                  value={watch('society') || ''}
                  onChange={(val) => setValue('society', val)}
                  placeholder="e.g. Lodha Palava, Hiranandani Gardens"
                />
              </div>
            </div>
          </section>

          <section className="flex flex-col">
            <div className="border-b border-outline-variant pb-2 mb-4">
              <h3 className="text-[11px] uppercase tracking-wider text-[#6B6B80] font-bold">Membership Details</h3>
            </div>
            
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[14px] font-medium text-[#EEEEF0]">Membership Status</span>
                  <span className="text-[11px] text-[#6B6B80]">{isActive ? 'Currently Active' : 'Inactive'}</span>
                </div>
                <div 
                  className={`w-12 h-6 rounded-full relative flex items-center transition-colors cursor-pointer ${isActive ? 'bg-primary-container' : 'bg-surface-container-highest'}`}
                  onClick={() => setValue('isActive', !isActive)}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute transition-all ${isActive ? 'right-1' : 'left-1'}`}></div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-medium text-[#6B6B80]">Class Type</label>
                <div className="grid grid-cols-2 bg-[#262626] border border-[rgba(255,255,255,0.08)] rounded-[8px] p-1">
                  <button 
                    type="button"
                    onClick={() => setValue('classType', 'PERSONAL')}
                    className={`py-1.5 rounded-[6px] text-[13px] transition-all ${classType === 'PERSONAL' ? 'bg-primary-container text-white font-bold' : 'text-[#6B6B80] font-medium'}`}
                  >Personal</button>
                  <button 
                    type="button"
                    onClick={() => setValue('classType', 'GROUP')}
                    className={`py-1.5 rounded-[6px] text-[13px] transition-all ${classType === 'GROUP' ? 'bg-primary-container text-white font-bold' : 'text-[#6B6B80] font-medium'}`}
                  >Group</button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-medium text-[#6B6B80]">Category</label>
                <div className="grid grid-cols-3 bg-[#262626] border border-[rgba(255,255,255,0.08)] rounded-[8px] p-1">
                  {['KIDS', 'TODDLERS', 'ADULTS'].map((cat) => (
                    <button 
                      key={cat}
                      type="button"
                      onClick={() => setValue('category', cat)}
                      className={`py-1.5 rounded-[6px] text-[13px] capitalize transition-all ${category === cat ? 'bg-primary-container text-white font-bold' : 'text-[#6B6B80] font-medium'}`}
                    >{cat.toLowerCase()}</button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-[#6B6B80]">Joining Date</label>
                <div className="relative">
                  <input 
                    {...register('joiningDate', { required: 'Date is required' })}
                    className="w-full h-[40px] bg-[#262626] border border-[rgba(255,255,255,0.08)] rounded-[8px] px-3 text-[#EEEEF0] focus:ring-1 focus:ring-primary-container outline-none transition-all [color-scheme:dark]" 
                    type="date"
                  />
                </div>
                {errors.joiningDate && <span className="text-red-500 text-xs">{errors.joiningDate.message}</span>}
              </div>
            </div>
          </section>

          {/* Guardian Details (Optional) */}
          <section className="flex flex-col">
            <div className="border-b border-outline-variant pb-2 mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-[11px] uppercase tracking-wider text-[#6B6B80] font-bold">Guardian Details</h3>
                <span className="text-[10px] text-primary-container/70 bg-primary-container/10 border border-primary-container/20 px-2 py-0.5 rounded-full font-medium">Optional</span>
              </div>
              <p className="text-[11px] text-[#6B6B80]/60 mt-1">Required for Toddlers & Kids categories</p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-[#6B6B80] flex items-center gap-1.5">
                  Guardian Name
                  <span className="text-[10px] text-[#6B6B80]/50 font-normal">(Optional)</span>
                </label>
                <input 
                  {...register('guardianName')}
                  className="w-full h-[40px] bg-[#262626] border border-[rgba(255,255,255,0.08)] rounded-[8px] px-3 text-[#EEEEF0] focus:ring-1 focus:ring-primary-container outline-none transition-all" 
                  type="text" 
                  placeholder="Parent or guardian's full name"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-[#6B6B80] flex items-center gap-1.5">
                  Guardian Phone
                  <span className="text-[10px] text-[#6B6B80]/50 font-normal">(Optional)</span>
                </label>
                <input 
                  {...register('guardianPhone')}
                  className="w-full h-[40px] bg-[#262626] border border-[rgba(255,255,255,0.08)] rounded-[8px] px-3 text-[#EEEEF0] focus:ring-1 focus:ring-primary-container outline-none transition-all" 
                  type="tel" 
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
          </section>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-outline-variant">
            <button 
              disabled={loading}
              className="w-full sm:flex-1 h-[48px] sm:h-[40px] bg-primary-container text-white font-bold rounded-lg shadow-lg active:scale-95 transition-transform disabled:opacity-70"
              type="submit"
            >
              {loading ? 'Saving...' : isEditMode ? 'Update Member' : 'Save Member'}
            </button>
            <Link 
              to={isEditMode ? `/members/${id}` : '/members'}
              className="w-full sm:flex-1 h-[40px] flex items-center justify-center border border-[#6B6B80]/30 text-[#6B6B80] font-medium rounded-lg hover:bg-[#6B6B80]/10 active:opacity-70 transition-all"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>

      <BottomNav />
    </div>
  );
};

export default AddMember;
