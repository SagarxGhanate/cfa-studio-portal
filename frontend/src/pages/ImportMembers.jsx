import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import Navbar from '../components/layout/Navbar';
import BottomNav from '../components/layout/BottomNav';
import { useToast } from '../components/ui/Toast';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const ImportMembers = () => {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [stats, setStats] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const dragCounterRef = useRef(0);
  const toast = useToast();
  const navigate = useNavigate();

  const parseExcelDate = (excelDate) => {
    if (!excelDate) return null;
    // If it's already a JS Date
    if (excelDate instanceof Date) return excelDate;
    // If it's a number (Excel serial date)
    if (typeof excelDate === 'number') {
      // Excel epoch is Jan 1, 1900. Formula adjustment for JS
      return new Date((excelDate - (25567 + 2)) * 86400 * 1000);
    }
    // Try to parse string
    const parsed = new Date(excelDate);
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  const isValidFileType = (f) => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv', // .csv
    ];
    const ext = f.name?.toLowerCase().split('.').pop();
    return validTypes.includes(f.type) || ['xlsx', 'xls', 'csv'].includes(ext);
  };

  const processFile = (uploadedFile) => {
    if (!uploadedFile) return;
    if (!isValidFileType(uploadedFile)) {
      toast.error('Invalid file type. Please upload .xlsx, .xls, or .csv files.');
      return;
    }

    setFile(uploadedFile);
    setLoading(true);
    setStats(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        // Convert to JSON
        const rawData = XLSX.utils.sheet_to_json(ws);
        
        // Map columns to our schema
        const mappedData = rawData.map(row => {
          // Attempt to find right columns regardless of exact header casing
          const findVal = (keys) => {
            const key = Object.keys(row).find(k => keys.includes(k.toLowerCase().trim()));
            return key ? row[key] : '';
          };

          const rawDate = findVal(['joining date', 'date', 'joining', 'joiningdate']);
          const dateObj = parseExcelDate(rawDate) || new Date();

          return {
            name: findVal(['name', 'full name', 'member name']),
            phone: findVal(['phone', 'mobile', 'contact', 'number']),
            age: parseInt(findVal(['age', 'years']), 10) || 0,
            location: findVal(['location', 'address', 'area', 'city']),
            society: findVal(['society', 'apartment', 'building']),
            joiningDate: dateObj.toISOString(),
            classType: findVal(['class type', 'class', 'type', 'classtype']).toString().toUpperCase().includes('PERSONAL') ? 'PERSONAL' : 'GROUP',
            category: (findVal(['category', 'group']).toString().toUpperCase() || 'ADULTS'),
            isActive: String(findVal(['status', 'active'])).toLowerCase() !== 'inactive',
            guardianName: findVal(['guardian name', 'guardian', 'parent']),
            guardianPhone: findVal(['guardian phone', 'parent phone']),
            avatar: findVal(['avatar', 'photo', 'image', 'profile pic']) || null,
          };
        }).filter(m => m.name && m.phone); // Require at least name and phone

        setPreviewData(mappedData);
      } catch (err) {
        toast.error('Failed to parse Excel file. Make sure it is valid.');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(uploadedFile);
  };

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    processFile(uploadedFile);
  };

  // Drag & Drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processFile(droppedFile);
      // Reset the hidden file input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleImportClick = () => {
    if (previewData.length === 0) return;
    setShowConfirm(true);
  };

  const handleConfirmImport = async () => {
    setShowConfirm(false);
    setImporting(true);
    try {
      const res = await api.post('/members/bulk', { members: previewData });
      if (res.data.success) {
        toast.success(res.data.message);
        setStats(res.data.data);
        if (res.data.data.created > 0) {
          setTimeout(() => navigate('/members'), 2000);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to import members');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      {
        'Name': 'John Doe',
        'Phone': '9876543210',
        'Age': 25,
        'Location': 'Mumbai',
        'Society': 'Lodha Palava',
        'Joining Date': '2024-01-15',
        'Class Type': 'GROUP',
        'Category': 'ADULTS',
        'Guardian Name': '',
        'Guardian Phone': '',
        'Status': 'Active',
        'Avatar': ''
      }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Members");
    XLSX.writeFile(wb, "CFA_Members_Import_Template.xlsx");
  };

  return (
    <div className="min-h-screen bg-[#0e0e0e]">
      <Navbar />

      <main className="max-w-[1440px] mx-auto px-container-margin py-8 pb-24">
        <div className="mb-8">
          <h1 className="font-display-lg text-display-lg text-on-surface">Import Members</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">Upload an Excel (.xlsx, .xls) file to bulk add members.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Section */}
          <div className="lg:col-span-1 space-y-6">
            <div className="card-surface rounded-xl p-6">
              <h3 className="font-bold text-white mb-4">Upload File</h3>
              
              <div 
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer ${
                  isDragging 
                    ? 'border-primary-container bg-primary-container/10 scale-[1.02] shadow-[0_0_24px_rgba(255,107,26,0.15)]' 
                    : 'border-outline-variant hover:bg-[rgba(255,255,255,0.02)]'
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept=".xlsx, .xls, .csv" 
                  className="hidden" 
                />
                <span className={`material-symbols-outlined text-[40px] mb-3 transition-colors ${isDragging ? 'text-primary-container' : 'text-[#6B6B80]'}`}>
                  {isDragging ? 'file_download' : 'upload_file'}
                </span>
                <p className="text-[14px] font-medium text-white mb-1">
                  {isDragging ? 'Drop your file here' : file ? file.name : 'Drag & drop or click to upload'}
                </p>
                <p className="text-[12px] text-[#6B6B80]">
                  {isDragging ? 'Release to upload' : file ? `${(file.size / 1024).toFixed(1)} KB` : 'Supports .xlsx, .xls, .csv'}
                </p>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <button 
                  onClick={downloadTemplate}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-outline-variant text-[#EEEEF0] text-[13px] font-medium hover:bg-surface-container-high transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  Download Template
                </button>
                
                <button 
                  onClick={handleImportClick}
                  disabled={previewData.length === 0 || importing}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary-container text-white text-[13px] font-bold hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {importing ? (
                    <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                  ) : (
                    <span className="material-symbols-outlined text-[18px]">publish</span>
                  )}
                  {importing ? 'Importing...' : `Import ${previewData.length} Members`}
                </button>
              </div>
            </div>

            {/* Import Stats/Errors */}
            {stats && (
              <div className="card-surface rounded-xl p-6">
                <h3 className="font-bold text-white mb-4">Import Results</h3>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[13px] text-[#6B6B80]">Successfully Added</span>
                  <span className="text-[14px] font-bold text-[#4ae176]">{stats.created}</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[13px] text-[#6B6B80]">Skipped / Failed</span>
                  <span className="text-[14px] font-bold text-[#EF4444]">{stats.skipped}</span>
                </div>

                {stats.errors?.length > 0 && (
                  <div className="mt-4 border-t border-outline-variant pt-4">
                    <p className="text-[12px] font-medium text-[#EF4444] mb-2">Error Details:</p>
                    <ul className="text-[11px] text-[#6B6B80] space-y-1 max-h-[150px] overflow-y-auto">
                      {stats.errors.map((err, i) => <li key={i}>• {err}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Preview Section */}
          <div className="lg:col-span-2">
            <div className="card-surface rounded-xl flex flex-col h-full min-h-[500px]">
              <div className="p-4 border-b border-outline-variant flex justify-between items-center">
                <h3 className="font-bold text-white">Data Preview</h3>
                <span className="text-[12px] text-on-surface-variant bg-surface-container px-2 py-1 rounded">
                  {previewData.length} rows found
                </span>
              </div>
              
              <div className="flex-1 overflow-auto">
                {loading ? (
                  <div className="h-full flex items-center justify-center text-on-surface-variant">
                    <span className="material-symbols-outlined animate-spin text-[24px] mr-2">progress_activity</span>
                    Parsing file...
                  </div>
                ) : previewData.length > 0 ? (
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#262626] sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3 text-[11px] uppercase tracking-wider text-[#6B6B80] font-bold border-b border-outline-variant whitespace-nowrap">Name</th>
                        <th className="px-4 py-3 text-[11px] uppercase tracking-wider text-[#6B6B80] font-bold border-b border-outline-variant whitespace-nowrap">Phone</th>
                        <th className="px-4 py-3 text-[11px] uppercase tracking-wider text-[#6B6B80] font-bold border-b border-outline-variant whitespace-nowrap">Location</th>
                        <th className="px-4 py-3 text-[11px] uppercase tracking-wider text-[#6B6B80] font-bold border-b border-outline-variant whitespace-nowrap">Class Type</th>
                        <th className="px-4 py-3 text-[11px] uppercase tracking-wider text-[#6B6B80] font-bold border-b border-outline-variant whitespace-nowrap">Category</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/50">
                      {previewData.slice(0, 100).map((row, i) => (
                        <tr key={i} className="hover:bg-surface-container-high/20 transition-colors">
                          <td className="px-4 py-3 text-[13px] text-white whitespace-nowrap">{row.name}</td>
                          <td className="px-4 py-3 text-[13px] text-[#EEEEF0] whitespace-nowrap">{row.phone}</td>
                          <td className="px-4 py-3 text-[13px] text-on-surface-variant whitespace-nowrap">{row.location}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-surface-container text-[#EEEEF0] border border-outline-variant">
                              {row.classType}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-surface-container text-[#EEEEF0] border border-outline-variant">
                              {row.category}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-[48px] text-[#6B6B80]/30 mb-2">table_view</span>
                    <p className="text-[14px]">Upload a file to preview data</p>
                  </div>
                )}
                {previewData.length > 100 && (
                  <div className="text-center py-3 text-[12px] text-[#6B6B80] border-t border-outline-variant">
                    Showing first 100 rows...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1a1a] border border-[rgba(255,255,255,0.08)] rounded-2xl p-8 max-w-[420px] w-full mx-4 shadow-[0_16px_64px_rgba(0,0,0,0.6)]">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-primary-container/15 flex items-center justify-center mb-4 border border-primary-container/25">
                <span className="material-symbols-outlined text-[28px] text-primary-container">group_add</span>
              </div>
              <h3 className="text-[18px] font-bold text-white mb-2">Confirm Import</h3>
              <p className="text-[14px] text-[#6B6B80] mb-1">You are adding</p>
              <p className="text-[32px] font-bold text-primary-container mb-1">{previewData.length}</p>
              <p className="text-[14px] text-[#6B6B80] mb-6">members into your database</p>
              
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-2.5 rounded-lg border border-outline-variant text-[#EEEEF0] text-[13px] font-medium hover:bg-surface-container-high transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmImport}
                  className="flex-1 py-2.5 rounded-lg bg-primary-container text-white text-[13px] font-bold hover:opacity-90 transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">check</span>
                  Add Members
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default ImportMembers;
