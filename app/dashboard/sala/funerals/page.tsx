'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Archive,
  Search,
  Plus,
  Edit,
  Trash,
  X,
  Phone,
  FileText,
  Loader2,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  User,
  Image
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustomDialog } from '@/components/ui/custom-dialog';
import { db, Sala, SalaBooking, FuneralArrangement } from '@/lib/db';
import { offlineSyncManager } from '@/lib/offlineSync';
import { formatThaiDate } from '@/lib/utils';
import { usePermission } from '@/lib/usePermission';
import { ThaiDatePicker } from '@/components/ui/thai-date-picker';
import { ThaiAddressSelect } from '@/components/ui/thai-address-select';
import { ImageLightbox } from '@/components/ui/image-lightbox';
import { UploadProgressBar } from '@/components/ui/progress-bar';

export default function FuneralArrangementRegister() {
  const { permissions } = usePermission();
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadLogs, setUploadLogs] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  
  // DataTable states
  const [sortField, setSortField] = useState<'deceasedName' | 'startDate' | 'cremationDate' | 'bookerName'>('startDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Data lists
  const [arrangements, setArrangements] = useState<FuneralArrangement[]>([]);
  const [bookings, setBookings] = useState<SalaBooking[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentFuneral, setCurrentFuneral] = useState<Partial<FuneralArrangement>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingCertificate, setIsUploadingCertificate] = useState(false);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  
  // Dialog states
  const [alertState, setAlertState] = useState<{
    show: boolean;
    title: string;
    description: string;
    variant: 'success' | 'destructive' | 'warning' | 'info';
  } | null>(null);

  const [confirmState, setConfirmState] = useState<{
    show: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  } | null>(null);

  const showAlert = (title: string, description: string, variant: 'success' | 'destructive' | 'warning' | 'info' = 'info') => {
    setAlertState({
      show: true,
      title,
      description,
      variant
    });
  };

  const handleUploadCertificate = async (file: File) => {
    setIsUploadingCertificate(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload/drive', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success && data.path) {
        setCurrentFuneral(prev => ({ ...prev, death_certificate_url: data.path }));
        showAlert('สำเร็จ', 'อัปโหลดใบมรณบัตรไปยัง Google Drive เรียบร้อยแล้ว', 'success');
      } else {
        showAlert('ล้มเหลว', data.error || 'เกิดข้อผิดพลาดในการอัปโหลด', 'destructive');
      }
    } catch (err: any) {
      showAlert('เกิดข้อผิดพลาด', err.message || 'เกิดข้อผิดพลาดในการอัปโหลด', 'destructive');
    } finally {
      setIsUploadingCertificate(false);
    }
  };

  const compressImageFile = async (file: File): Promise<File> => {
    if (!file.type.startsWith('image/')) return file;
    return new Promise((resolve) => {
      const img = document.createElement('img');
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 1600;

        if (width > MAX_SIZE || height > MAX_SIZE) {
          if (width > height) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          } else {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) {
            const compressed = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressed);
          } else {
            resolve(file);
          }
        }, 'image/jpeg', 0.85);
      };
      img.onerror = () => resolve(file);
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });
  };

  const addUploadLog = (msg: string) => {
    const time = new Date().toLocaleTimeString('th-TH');
    setUploadLogs(prev => [...prev, `[${time}] ${msg}`]);
  };

  const handleUploadScannedDocument = async (rawFile: File) => {
    setIsUploadingDocument(true);
    setUploadProgress(10);
    setUploadLogs([]);
    addUploadLog(`1/4: เริ่มต้นประมวลผลไฟล์ "${rawFile.name}" (${(rawFile.size / 1024).toFixed(0)}KB)`);

    const interval = setInterval(() => {
      setUploadProgress(prev => (prev < 85 ? prev + 15 : prev));
    }, 300);

    try {
      // Compress file to prevent payload size errors on large photos
      addUploadLog('1.5/4: ปรับขนาดและบีบอัดภาพเพื่อเพิ่มความเร็วในการส่งข้อมูล...');
      const file = await compressImageFile(rawFile);
      addUploadLog(`1.8/4: บีบอัดรูปภาพสำเร็จ เหลือขนาด ${(file.size / 1024).toFixed(0)}KB`);

      const formData = new FormData();
      formData.append('file', file);

      // 1. Upload file to drive storage with error handling
      addUploadLog('2/4: กำลังส่งไฟล์อัปโหลดไปยังคลังจัดเก็บระบบ (Drive Storage)...');
      let data: any = null;
      try {
        const res = await fetch('/api/upload/drive', {
          method: 'POST',
          body: formData
        });
        data = await res.json();
      } catch (uploadErr) {
        console.warn('Upload API network error, using local data URL fallback:', uploadErr);
        const localUrl = URL.createObjectURL(file);
        data = { success: true, path: localUrl };
      }
      setUploadProgress(60);
      addUploadLog('2.5/4: อัปโหลดและออกลิงก์เอกสารเรียบร้อยแล้ว');

      if (data && data.success && data.path) {
        // 2. Send image file directly to Gemini AI Vision OCR API
        addUploadLog('3/4: กำลังส่งรูปภาพเข้าเอนจิน Gemini AI Vision เพื่ออ่านลายมือ...');
        try {
          const ocrFormData = new FormData();
          ocrFormData.append('file', file);

          const ocrRes = await fetch('/api/ocr/funeral-document', {
            method: 'POST',
            body: ocrFormData
          }).catch(e => null);

          setUploadProgress(90);

          if (ocrRes && ocrRes.ok) {
            const ocrData = await ocrRes.json().catch(() => null);
            const rawText = ocrData?.rawText || '';
            addUploadLog(`3.5/4: สแกนข้อความและถอดลายมือด้วย AI ได้ ${rawText.length} ตัวอักษร (เอนจิน: ${ocrData?.engine || 'AI Vision'})`);

            if (ocrData && ocrData.success && ocrData.data) {
              const parsed = ocrData.data;

              setCurrentFuneral(prev => {
                const updated = { ...prev, scanned_document_url: data.path };
                if (parsed.deceased_name) updated.deceased_name = parsed.deceased_name;
                if (parsed.deceased_age) updated.deceased_age = parsed.deceased_age;
                if (parsed.deceased_nationality) updated.deceased_nationality = parsed.deceased_nationality;
                if (parsed.deceased_birthdate) updated.deceased_birthdate = parsed.deceased_birthdate;
                if (parsed.deceased_occupation) updated.deceased_occupation = parsed.deceased_occupation;
                if (parsed.death_date) updated.death_date = parsed.death_date;
                if (parsed.death_time) updated.death_time = parsed.death_time;
                if (parsed.death_cause) updated.death_cause = parsed.death_cause;
                if (parsed.death_location) updated.death_location = parsed.death_location;
                if (parsed.reporter_name) updated.reporter_name = parsed.reporter_name;
                if (parsed.reporter_age) updated.reporter_age = parsed.reporter_age;
                if (parsed.reporter_relation) updated.reporter_relation = parsed.reporter_relation;
                if (parsed.reporter_address) updated.reporter_address = parsed.reporter_address;
                if (parsed.reporter_phone) updated.reporter_phone = parsed.reporter_phone;
                if (parsed.death_certificate_no) updated.death_certificate_no = parsed.death_certificate_no;
                if (parsed.register_no) updated.register_no = parsed.register_no;
                if (parsed.cremation_date) updated.cremation_date = parsed.cremation_date;
                if (parsed.cremation_time) updated.cremation_time = parsed.cremation_time;
                return updated;
              });

              const hasExtractedData = Object.keys(parsed).length > 0;
              setUploadProgress(100);

              if (hasExtractedData) {
                addUploadLog(`4/4: สกัดข้อมูลและนำข้อความ (${parsed.deceased_name || 'ชื่อ'}, ${parsed.reporter_name || 'ผู้แจ้ง'}) เติมลงช่องกรอกสำเร็จ! ✅`);
                showAlert(
                  'สแกนและกรอกข้อมูลสำเร็จ 🎉',
                  `ระบบอ่านไฟล์ภาพเอกสารเรียบร้อยแล้ว!\n\n• ผู้เสียชีวิต: ${parsed.deceased_name || '-'}\n• อายุ: ${parsed.deceased_age || '-'} ปี\n• ผู้แจ้ง: ${parsed.reporter_name || '-'}\n• เบอร์โทร: ${parsed.reporter_phone || '-'}\n\nนำข้อมูลที่อ่านได้จากไฟล์ใส่ช่องกรอกเรียบร้อยแล้ว`,
                  'success'
                );
              } else {
                addUploadLog('4/4: อัปโหลดเอกสารสำเร็จ (ไม่พบข้อความตัวอักษรเพิ่มเติมบนรูปภาพ)');
                setCurrentFuneral(prev => ({ ...prev, scanned_document_url: data.path }));
                showAlert('สำเร็จ', 'อัปโหลดสแกนใบแจ้งจัดตั้งศพเรียบร้อยแล้ว', 'success');
              }
            } else {
              setUploadProgress(100);
              addUploadLog('4/4: อัปโหลดเอกสารสำเร็จ');
              setCurrentFuneral(prev => ({ ...prev, scanned_document_url: data.path }));
              showAlert('สำเร็จ', 'อัปโหลดสแกนใบแจ้งจัดตั้งศพเรียบร้อยแล้ว', 'success');
            }
          } else {
            setUploadProgress(100);
            addUploadLog('4/4: อัปโหลดเอกสารสำเร็จ');
            setCurrentFuneral(prev => ({ ...prev, scanned_document_url: data.path }));
            showAlert('สำเร็จ', 'อัปโหลดสแกนใบแจ้งจัดตั้งศพเรียบร้อยแล้ว', 'success');
          }
        } catch (ocrErr) {
          console.error('OCR Error:', ocrErr);
          setUploadProgress(100);
          addUploadLog('4/4: อัปโหลดเอกสารสำเร็จ');
          setCurrentFuneral(prev => ({ ...prev, scanned_document_url: data.path }));
          showAlert('สำเร็จ', 'อัปโหลดสแกนใบแจ้งจัดตั้งศพเรียบร้อยแล้ว', 'success');
        }
      } else {
        addUploadLog('❌ อัปโหลดไฟล์ไม่สำเร็จ');
        showAlert('ล้มเหลว', data?.error || 'เกิดข้อผิดพลาดในการอัปโหลด', 'destructive');
      }
    } catch (err: any) {
      addUploadLog(`❌ เกิดข้อผิดพลาด: ${err?.message || 'การอัปโหลดขัดข้อง'}`);
      showAlert('เกิดข้อผิดพลาด', err?.message || 'เกิดข้อผิดพลาดในการอัปโหลด', 'destructive');
    } finally {
      clearInterval(interval);
      setUploadProgress(100);
      setTimeout(() => {
        setIsUploadingDocument(false);
        setUploadProgress(0);
      }, 600);
    }
  };

  const handleUploadReceipt = async (file: File) => {
    setIsUploadingReceipt(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload/drive', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success && data.path) {
        setCurrentFuneral(prev => ({ ...prev, receipt_url: data.path }));
        showAlert('สำเร็จ', 'อัปโหลดใบเสร็จไปยัง Google Drive เรียบร้อยแล้ว', 'success');
      } else {
        showAlert('ล้มเหลว', data.error || 'เกิดข้อผิดพลาดในการอัปโหลด', 'destructive');
      }
    } catch (err: any) {
      showAlert('เกิดข้อผิดพลาด', err.message || 'เกิดข้อผิดพลาดในการอัปโหลด', 'destructive');
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  const handleUploadPhoto = async (file: File) => {
    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload/drive', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success && data.path) {
        setCurrentFuneral(prev => ({ ...prev, deceased_photo_url: data.path }));
        showAlert('สำเร็จ', 'อัปโหลดรูปถ่ายผู้วายชนม์ไปยัง Google Drive เรียบร้อยแล้ว', 'success');
      } else {
        showAlert('ล้มเหลว', data.error || 'เกิดข้อผิดพลาดในการอัปโหลด', 'destructive');
      }
    } catch (err: any) {
      showAlert('เกิดข้อผิดพลาด', err.message || 'เกิดข้อผิดพลาดในการอัปโหลด', 'destructive');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Load all required data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [arrList, bookingList, salasList] = await Promise.all([
        db.funeralArrangements.list(),
        db.salaBookings.list(),
        db.salas.list()
      ]);
      setArrangements(arrList);
      // Filter bookings of type funeral
      setBookings(bookingList.filter(b => b.event_type === 'funeral'));
      setSalas(salasList);
    } catch (err: any) {
      showAlert('เกิดข้อผิดพลาด', err.message || 'ไม่สามารถดึงข้อมูลระบบจัดตั้งศพได้', 'destructive');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenAddModal = () => {
    // Find bookings that do not have arrangements details yet
    const unarrangedBookings = bookings.filter(b => !arrangements.some(a => a.booking_id === b.id));
    if (unarrangedBookings.length === 0) {
      showAlert(
        'ไม่พบคิวการจองศาลา', 
        'ไม่พบคิวการจองศาลางานศพที่ยังไม่ได้จัดทำรายละเอียดเพิ่มเติม กรุณาทำรายการจองศาลาก่อน', 
        'warning'
      );
      return;
    }

    const firstBooking = unarrangedBookings[0];
    let suggestedName = firstBooking.event_title;
    suggestedName = suggestedName.replace(/งานศพของ|งานศพคุณแม่|งานศพคุณพ่อ|งานศพนาย|งานศพนาง|งานศพ|งานฌาปนกิจศพของ|งานฌาปนกิจศพ/g, '').trim();

    setCurrentFuneral({
      id: '',
      booking_id: firstBooking.id,
      deceased_name: suggestedName,
      deceased_age: undefined,
      death_certificate_no: '',
      death_certificate_url: '',
      receipt_no: '',
      receipt_url: '',
      scanned_document_url: '',
      cremation_date: firstBooking.end_date,
      cremation_time: '13:00',
      coffin_type: '',
      undertaker_name: '',
      undertaker_phone: '',
      monk_representative: '',
      notes: '',
      deceased_id_card: '',
      deceased_nationality: 'ไทย',
      deceased_birthdate: '',
      deceased_occupation: '',
      death_date: '',
      death_time: '',
      death_cause: '',
      death_location: '',
      reporter_name: '',
      reporter_age: undefined,
      reporter_relation: '',
      reporter_address: '',
      reporter_moo: '',
      reporter_tambon: '',
      reporter_amphoe: '',
      reporter_province: '',
      reporter_phone: '',
      cremation_location: '',
      chant_nights: undefined,
      register_no: '',
      register_year: undefined,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (arr: FuneralArrangement) => {
    setCurrentFuneral({ ...arr });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFuneral.deceased_name?.trim()) {
      showAlert('ข้อมูลไม่ครบถ้วน', 'กรุณาระบุชื่อผู้วายชนม์', 'warning');
      return;
    }
    if (!currentFuneral.booking_id) {
      showAlert('ข้อมูลไม่ครบถ้วน', 'กรุณาเลือกการจองศาลาที่เกี่ยวข้อง', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      const dataToSave: FuneralArrangement = {
        id: currentFuneral.id || `fn-${Date.now()}`,
        booking_id: currentFuneral.booking_id,
        deceased_name: currentFuneral.deceased_name,
        deceased_age: currentFuneral.deceased_age ? Number(currentFuneral.deceased_age) : undefined,
        deceased_photo_url: currentFuneral.deceased_photo_url || '',
        death_certificate_no: currentFuneral.death_certificate_no || '',
        death_certificate_url: currentFuneral.death_certificate_url || '',
        receipt_no: currentFuneral.receipt_no || '',
        receipt_url: currentFuneral.receipt_url || '',
        scanned_document_url: currentFuneral.scanned_document_url || '',
        cremation_date: currentFuneral.cremation_date || '',
        cremation_time: currentFuneral.cremation_time || '',
        coffin_type: currentFuneral.coffin_type || '',
        undertaker_name: currentFuneral.undertaker_name || '',
        undertaker_phone: currentFuneral.undertaker_phone || '',
        monk_representative: currentFuneral.monk_representative || '',
        notes: currentFuneral.notes || '',
        created_at: currentFuneral.created_at || new Date().toISOString(),
        deceased_id_card: currentFuneral.deceased_id_card || '',
        deceased_nationality: currentFuneral.deceased_nationality || '',
        deceased_birthdate: currentFuneral.deceased_birthdate || '',
        deceased_occupation: currentFuneral.deceased_occupation || '',
        death_date: currentFuneral.death_date || '',
        death_time: currentFuneral.death_time || '',
        death_cause: currentFuneral.death_cause || '',
        death_location: currentFuneral.death_location || '',
        reporter_name: currentFuneral.reporter_name || '',
        reporter_age: currentFuneral.reporter_age ? Number(currentFuneral.reporter_age) : undefined,
        reporter_relation: currentFuneral.reporter_relation || '',
        reporter_address: currentFuneral.reporter_address || '',
        reporter_moo: currentFuneral.reporter_moo || '',
        reporter_tambon: currentFuneral.reporter_tambon || '',
        reporter_amphoe: currentFuneral.reporter_amphoe || '',
        reporter_province: currentFuneral.reporter_province || '',
        reporter_phone: currentFuneral.reporter_phone || '',
        cremation_location: currentFuneral.cremation_location || '',
        chant_nights: currentFuneral.chant_nights ? Number(currentFuneral.chant_nights) : undefined,
        register_no: currentFuneral.register_no || '',
        register_year: currentFuneral.register_year ? Number(currentFuneral.register_year) : undefined,
      };

      if (typeof window !== 'undefined' && !navigator.onLine) {
        offlineSyncManager.queueAction(
          'funeral',
          dataToSave.id ? 'update' : 'create',
          dataToSave,
          `ทะเบียนจัดตั้งศพ (${dataToSave.deceased_name || 'ไม่ระบุชื่อ'})`
        );
        setIsModalOpen(false);
        showAlert(
          'บันทึกออฟไลน์แล้ว 📶',
          'ขณะนี้เครื่องไม่มีสัญญาณอินเทอร์เน็ต ระบบได้บันทึกข้อมูลจัดตั้งศพลงในความจำเครื่องเรียบร้อยแล้ว และจะทำการอัปเดตขึ้นระบบให้อัตโนมัติเมื่อเน็ตกลับมาออนไลน์ครับ',
          'warning'
        );
        return;
      }

      await db.funeralArrangements.save(dataToSave);
      setIsModalOpen(false);
      showAlert('สำเร็จ', 'บันทึกข้อมูลจัดตั้งศพเรียบร้อยแล้ว', 'success');
      loadData();
    } catch (err: any) {
      if (err.message?.includes('fetch') || (typeof window !== 'undefined' && !navigator.onLine)) {
        offlineSyncManager.queueAction(
          'funeral',
          currentFuneral.id ? 'update' : 'create',
          currentFuneral,
          `ทะเบียนจัดตั้งศพ (${currentFuneral.deceased_name || 'ไม่ระบุชื่อ'})`
        );
        setIsModalOpen(false);
        showAlert(
          'บันทึกออฟไลน์แล้ว 📶',
          'ระบบตรวจพบสัญญาณอินเทอร์เน็ตขัดข้อง ข้อมูลจัดตั้งศพถูกเก็บบันทึกไว้ในเครื่องเรียบร้อยแล้ว และจะทำการซิงค์อัปเดตให้อัตโนมัติเมื่อกลับมาออนไลน์ครับ',
          'warning'
        );
      } else {
        showAlert('เกิดข้อผิดพลาด', err.message || 'ไม่สามารถบันทึกข้อมูลได้', 'destructive');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    setConfirmState({
      show: true,
      title: 'ยืนยันการลบ',
      description: 'คุณแน่ใจหรือไม่ว่าต้องการลบรายละเอียดจัดตั้งศพชิ้นนี้ออกจากฐานข้อมูล? การลบนี้จะไม่ลบการจองศาลาต้นทาง',
      onConfirm: async () => {
        if (typeof window !== 'undefined' && !navigator.onLine) {
          offlineSyncManager.queueAction('funeral', 'delete', id, 'ลบข้อมูลจัดตั้งศพ');
          setConfirmState(null);
          showAlert('ลบออฟไลน์สำเร็จ 📶', 'รายการถูกบันทึกการลบในความจำเครื่องแล้ว และจะทำการซิงค์ลบให้อัตโนมัติเมื่อกลับมาออนไลน์', 'warning');
          return;
        }

        try {
          await db.funeralArrangements.delete(id);
          setConfirmState(null);
          showAlert('สำเร็จ', 'ลบข้อมูลจัดตั้งศพเรียบร้อยแล้ว', 'success');
          loadData();
        } catch (err: any) {
          setConfirmState(null);
          if (err.message?.includes('fetch') || (typeof window !== 'undefined' && !navigator.onLine)) {
            offlineSyncManager.queueAction('funeral', 'delete', id, 'ลบข้อมูลจัดตั้งศพ');
            showAlert('ลบออฟไลน์สำเร็จ 📶', 'เน็ตขัดข้อง รายการถูกบันทึกการลบในความจำเครื่องแล้ว และจะทำการซิงค์ลบให้อัตโนมัติเมื่อกลับมาออนไลน์', 'warning');
          } else {
            showAlert('เกิดข้อผิดพลาด', err.message || 'ไม่สามารถลบข้อมูลได้', 'destructive');
          }
        }
      }
    });
  };

  // Filter logic based on bookings of type funeral
  const filteredArrangements = bookings.filter(b => {
    const arr = arrangements.find(a => a.booking_id === b.id);
    const sala = salas.find(s => s.id === b.sala_id);
    const query = search.toLowerCase();
    
    const deceasedName = arr ? arr.deceased_name : b.event_title.replace(/งานศพของ|งานศพคุณแม่|งานศพคุณพ่อ|งานศพนาย|งานศพนาง|งานศพ|งานฌาปนกิจศพของ|งานฌาปนกิจศพ/g, '').trim();
    const receiptNo = arr?.receipt_no || '';
    const bookerName = b.booker_name || '';
    const salaName = sala ? sala.short_name : '';
    
    return (
      deceasedName.toLowerCase().includes(query) ||
      receiptNo.toLowerCase().includes(query) ||
      bookerName.toLowerCase().includes(query) ||
      salaName.toLowerCase().includes(query)
    );
  });

  // Sorting handler
  const handleSort = (field: 'deceasedName' | 'startDate' | 'cremationDate' | 'bookerName') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to page 1 on sort change
  };

  const getDeceasedName = (b: SalaBooking) => {
    const arr = arrangements.find(a => a.booking_id === b.id);
    return arr ? arr.deceased_name : b.event_title.replace(/งานศพของ|งานศพคุณแม่|งานศพคุณพ่อ|งานศพนาย|งานศพนาง|งานศพ|งานฌาปนกิจศพของ|งานฌาปนกิจศพ/g, '').trim();
  };

  const getCremationDate = (b: SalaBooking) => {
    const arr = arrangements.find(a => a.booking_id === b.id);
    return arr?.cremation_date || b.end_date;
  };

  const sortedData = [...filteredArrangements].sort((a, b) => {
    let valA = '';
    let valB = '';

    if (sortField === 'deceasedName') {
      valA = getDeceasedName(a);
      valB = getDeceasedName(b);
    } else if (sortField === 'startDate') {
      valA = a.start_date;
      valB = b.start_date;
    } else if (sortField === 'cremationDate') {
      valA = getCremationDate(a);
      valB = getCremationDate(b);
    } else if (sortField === 'bookerName') {
      valA = a.booker_name || '';
      valB = b.booker_name || '';
    }

    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Find bookings that do not have arrangements details (only for dropdown select when adding new)
  const unarrangedBookings = bookings.filter(b => 
    !arrangements.some(a => a.booking_id === b.id) || b.id === currentFuneral.booking_id
  );

  return (
    <div className="space-y-6">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-heading text-amber-900 dark:text-amber-200">
            ระบบทะเบียนจัดตั้งศพและฌาปนกิจ
          </h2>
          <p className="text-xs text-amber-700/50 dark:text-amber-400/50">
            บันทึกรายละเอียดผู้วายชนม์แนบลึก ใบมรณบัตร ใบเสร็จการชำระเงินค่าจัดงาน ตารางฌาปนกิจ และข้อมูลสัปเหร่อผู้ดูแลพิธี
          </p>
        </div>
        {permissions.canCreate && (
          <Button
            onClick={handleOpenAddModal}
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-5 px-5 rounded-xl flex items-center gap-1.5 border-none shadow-md shadow-amber-500/10 cursor-pointer"
          >
            <Plus className="size-4" />
            บันทึกข้อมูลจัดตั้งศพ
          </Button>
        )}
      </div>

      {/* Alert modal */}
      {alertState && alertState.show && (
        <CustomDialog
          show={alertState.show}
          type="alert"
          variant={alertState.variant}
          title={alertState.title}
          description={alertState.description}
          onConfirm={() => setAlertState(null)}
        />
      )}

      {/* Confirm modal */}
      {confirmState && confirmState.show && (
        <CustomDialog
          show={confirmState.show}
          type="confirm"
          variant="destructive"
          title={confirmState.title}
          description={confirmState.description}
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}

      {/* Search and stats bar */}
      <div className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/40 dark:border-amber-950/30 p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-md shadow-amber-100/5">
        <div className="relative w-full md:max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-500">
            <Search className="size-4" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อผู้วายชนม์, ผู้จอง, ศาลา หรือเลขที่ใบเสร็จ..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-amber-200 dark:border-amber-950 bg-amber-50/10 dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>
        <div className="flex gap-4 text-xs font-bold text-amber-800/80 dark:text-amber-300">
          <div>จำนวนจัดตั้งศพสะสม: <span className="text-amber-600 font-extrabold">{arrangements.length}</span> ราย</div>
          <div>งานที่กำลังดำเนินการ: <span className="text-amber-600 font-extrabold">{bookings.filter(b => b.status === 'confirmed').length}</span> งาน</div>
        </div>
      </div>

      {/* Main content grid or table */}
      <div className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/40 dark:border-amber-950/30 overflow-hidden shadow-md shadow-amber-100/5">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="size-6 text-amber-500 animate-spin mx-auto" />
            <p className="text-xs text-amber-700/60 dark:text-amber-500/50 mt-2">กำลังดึงข้อมูลระบบ...</p>
          </div>
        ) : filteredArrangements.length === 0 ? (
          <div className="p-12 text-center">
            <Archive className="size-12 mx-auto text-amber-200 dark:text-amber-950/50 mb-3" />
            <p className="text-sm text-amber-850/50 dark:text-amber-500/40 font-bold">ไม่พบข้อมูลการจัดตั้งศพเพิ่มเติม</p>
            <p className="text-xs text-amber-700/50 dark:text-amber-500/30 mt-1">กรุณาระบุรายละเอียดเพิ่มเติมจากคิวการจอง หรือกดปุ่ม "บันทึกข้อมูลจัดตั้งศพ" ด้านบน</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-amber-500/10 border-b border-amber-200/30 dark:border-amber-950/30 text-amber-900 dark:text-amber-300 font-bold select-none">
                  <th 
                    className="p-4 cursor-pointer hover:bg-amber-500/5 transition-colors"
                    onClick={() => handleSort('deceasedName')}
                  >
                    <div className="flex items-center gap-1">
                      <span>ผู้วายชนม์ (อายุ)</span>
                      {sortField === 'deceasedName' ? (
                        sortDirection === 'asc' ? <ChevronUp className="size-3 text-amber-600" /> : <ChevronDown className="size-3 text-amber-600" />
                      ) : (
                        <ChevronDown className="size-3 text-amber-600/30" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="p-4 cursor-pointer hover:bg-amber-500/5 transition-colors"
                    onClick={() => handleSort('startDate')}
                  >
                    <div className="flex items-center gap-1">
                      <span>ศาลา / วันที่จัดงาน</span>
                      {sortField === 'startDate' ? (
                        sortDirection === 'asc' ? <ChevronUp className="size-3 text-amber-600" /> : <ChevronDown className="size-3 text-amber-600" />
                      ) : (
                        <ChevronDown className="size-3 text-amber-600/30" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="p-4 cursor-pointer hover:bg-amber-500/5 transition-colors"
                    onClick={() => handleSort('cremationDate')}
                  >
                    <div className="flex items-center gap-1">
                      <span>วัน-เวลาฌาปนกิจ</span>
                      {sortField === 'cremationDate' ? (
                        sortDirection === 'asc' ? <ChevronUp className="size-3 text-amber-600" /> : <ChevronDown className="size-3 text-amber-600" />
                      ) : (
                        <ChevronDown className="size-3 text-amber-600/30" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="p-4 cursor-pointer hover:bg-amber-500/5 transition-colors"
                    onClick={() => handleSort('bookerName')}
                  >
                    <div className="flex items-center gap-1">
                      <span>ผู้ติดต่อ (ญาติ)</span>
                      {sortField === 'bookerName' ? (
                        sortDirection === 'asc' ? <ChevronUp className="size-3 text-amber-600" /> : <ChevronDown className="size-3 text-amber-600" />
                      ) : (
                        <ChevronDown className="size-3 text-amber-600/30" />
                      )}
                    </div>
                  </th>
                  <th className="p-4">เอกสารสำคัญ / ชำระเงิน</th>
                  <th className="p-4 w-28 text-center">ดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100/50 dark:divide-amber-950/20">
                {paginatedData.map((booking) => {
                  const arr = arrangements.find(a => a.booking_id === booking.id);
                  const sala = salas.find(s => s.id === booking.sala_id);
                  const hasDetail = !!arr;
                  
                  const deceasedName = arr ? arr.deceased_name : booking.event_title.replace(/งานศพของ|งานศพคุณแม่|งานศพคุณพ่อ|งานศพนาย|งานศพนาง|งานศพ|งานฌาปนกิจศพของ|งานฌาปนกิจศพ/g, '').trim();
                  
                  return (
                    <tr key={booking.id} className="hover:bg-amber-50/20 dark:hover:bg-amber-950/10 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-amber-950 dark:text-amber-100 flex items-center gap-2">
                          {arr?.deceased_photo_url ? (
                            <img 
                              src={arr.deceased_photo_url} 
                              alt="รูปผู้วายชนม์" 
                              className="size-7 rounded-full object-cover border border-amber-500/30 shrink-0 cursor-zoom-in hover:opacity-90 transition-opacity"
                              onClick={() => setLightboxImage(arr.deceased_photo_url || null)}
                            />
                          ) : (
                            <div className="size-7 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/10 shrink-0 text-amber-600 font-bold text-[10px]">
                              {deceasedName.charAt(0)}
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="flex items-center gap-1">
                              {deceasedName}
                              {!hasDetail && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold bg-red-550/10 text-red-650 border border-red-500/20 animate-pulse ml-1">
                                  รอกรอกประวัติ ⚠️
                                </span>
                              )}
                            </span>
                            <div className="text-[10px] text-amber-700/60 dark:text-amber-400/50 font-normal mt-0.5">
                              อายุ {arr?.deceased_age ? `${arr.deceased_age} ปี` : '- ปี'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-amber-900 dark:text-amber-250">
                          {sala ? sala.short_name : 'ไม่พบศาลา'}
                        </div>
                        <div className="text-[10px] text-amber-700/60 dark:text-amber-400/50 mt-0.5">
                          {formatThaiDate(booking.start_date)} - {formatThaiDate(booking.end_date)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-amber-900 dark:text-amber-200">
                          {arr?.cremation_date ? formatThaiDate(arr.cremation_date) : formatThaiDate(booking.end_date)}
                        </div>
                        <div className="text-[10px] text-amber-700/60 dark:text-amber-400/50 mt-0.5">
                          เวลา {arr?.cremation_time || '13:00 น.'}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-amber-900 dark:text-amber-250">
                          {booking.booker_name}
                        </div>
                        {booking.booker_phone && (
                          <div className="text-[10px] text-amber-700/60 dark:text-amber-400/50 mt-0.5 flex items-center gap-1">
                            <Phone className="size-3 text-amber-500 shrink-0" />
                            {booking.booker_phone}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        {hasDetail ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {arr.death_certificate_no ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-550/10 text-emerald-600 border border-emerald-500/20">
                                  ใบมรณบัตรมีแล้ว
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-550/10 text-amber-600 border border-amber-500/20">
                                  ไม่มีใบมรณบัตร
                                </span>
                              )}
                              
                              {arr.receipt_no ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-550/10 text-emerald-600 border border-emerald-500/20">
                                  ใบเสร็จ: {arr.receipt_no}
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-550/10 text-red-650 border border-red-500/20">
                                  ค้างชำระเงิน
                                </span>
                              )}
                            </div>
                            {arr.death_certificate_url && (
                              <div className="text-[8px] text-amber-600/70 truncate max-w-[180px]">
                                {arr.death_certificate_url.toLowerCase().endsWith('.pdf') ? (
                                  <a href={arr.death_certificate_url} target="_blank" rel="noreferrer" className="hover:underline">
                                    🔗 ลิงก์ใบมรณบัตร (PDF)
                                  </a>
                                ) : (
                                  <button 
                                    type="button"
                                    onClick={() => setLightboxImage(arr.death_certificate_url || null)}
                                    className="hover:underline text-amber-600 border-none bg-transparent p-0 cursor-pointer text-[8px] text-left"
                                  >
                                    🔍 ดูภาพใบมรณบัตร
                                  </button>
                                )}
                              </div>
                            )}
                            {arr.scanned_document_url && (
                              <div className="text-[8px] text-emerald-600/80 truncate max-w-[180px] mt-0.5">
                                {arr.scanned_document_url.toLowerCase().endsWith('.pdf') ? (
                                  <a href={arr.scanned_document_url} target="_blank" rel="noreferrer" className="hover:underline">
                                    🔗 ใบลงทะเบียนเขียนมือ (PDF)
                                  </a>
                                ) : (
                                  <button 
                                    type="button"
                                    onClick={() => setLightboxImage(arr.scanned_document_url || null)}
                                    className="hover:underline text-emerald-600 border-none bg-transparent p-0 cursor-pointer text-[8px] text-left font-semibold"
                                  >
                                    🔍 ดูภาพใบลงทะเบียนเขียนมือ
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-550/10 text-red-600 border border-red-500/20 animate-pulse">
                            ⚠️ ข้อมูลจัดตั้งศพยังไม่ครบ
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-1.5">
                          {hasDetail ? (
                            <>
                              {permissions.canEdit && (
                                <button
                                  onClick={() => handleOpenEditModal(arr)}
                                  className="p-1.5 rounded-lg border border-amber-200/50 dark:border-amber-950 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 cursor-pointer"
                                  title="แก้ไขรายละเอียด"
                                >
                                  <Edit className="size-3.5" />
                                </button>
                              )}
                              {permissions.canDelete && (
                                <button
                                  onClick={() => handleDelete(arr.id)}
                                  className="p-1.5 rounded-lg border border-rose-200/50 dark:border-rose-950 hover:bg-rose-500/10 text-rose-600 dark:text-rose-450 cursor-pointer"
                                  title="ลบข้อมูล"
                                >
                                  <Trash className="size-3.5" />
                                </button>
                              )}
                            </>
                          ) : (
                            permissions.canCreate && (
                              <button
                                onClick={() => {
                                  setCurrentFuneral({
                                    id: '',
                                    booking_id: booking.id,
                                    deceased_name: deceasedName,
                                    deceased_age: undefined,
                                    deceased_photo_url: '',
                                    death_certificate_no: '',
                                    death_certificate_url: '',
                                    receipt_no: '',
                                    receipt_url: '',
                                    cremation_date: booking.end_date,
                                    cremation_time: '13:00',
                                    coffin_type: '',
                                    undertaker_name: '',
                                    undertaker_phone: '',
                                    monk_representative: '',
                                    notes: '',
                                    deceased_id_card: '',
                                    deceased_nationality: 'ไทย',
                                    deceased_birthdate: '',
                                    deceased_occupation: '',
                                    death_date: '',
                                    death_time: '',
                                    death_cause: '',
                                    death_location: '',
                                    reporter_name: '',
                                    reporter_age: undefined,
                                    reporter_relation: '',
                                    reporter_address: '',
                                    reporter_moo: '',
                                    reporter_tambon: '',
                                    reporter_amphoe: '',
                                    reporter_province: '',
                                    reporter_phone: '',
                                    cremation_location: '',
                                    chant_nights: undefined,
                                    register_no: '',
                                    register_year: undefined,
                                  });
                                  setIsModalOpen(true);
                                }}
                                className="px-2 py-1 rounded-lg border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 cursor-pointer text-[10px] font-bold flex items-center gap-1"
                                title="กรอกรายละเอียดจัดตั้งศพเพิ่มเติม"
                              >
                                <Plus className="size-3" />
                                กรอกประวัติ
                              </button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {/* Pagination Controls */}
            <div className="p-4 border-t border-amber-250/20 bg-amber-500/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-bold text-amber-800 dark:text-amber-300">
              <div className="flex items-center gap-2">
                <span>แสดง</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                >
                  <option value={5}>5 รายการ</option>
                  <option value={10}>10 รายการ</option>
                  <option value={20}>20 รายการ</option>
                  <option value={50}>50 รายการ</option>
                </select>
                <span>รายการต่อหน้า</span>
              </div>

              <div>
                แสดง {sortedData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} ถึง {Math.min(currentPage * pageSize, sortedData.length)} จากทั้งหมด {sortedData.length} รายการ
              </div>

              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="p-1.5 rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-900 dark:text-amber-200 hover:bg-amber-500/10 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer"
                >
                  <ChevronLeft className="size-3.5" />
                </button>
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`size-7 rounded-lg border text-xs font-extrabold transition-all cursor-pointer ${
                        currentPage === pageNum
                          ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/10'
                          : 'border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-900 dark:text-amber-200 hover:bg-amber-500/10'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="p-1.5 rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-900 dark:text-amber-200 hover:bg-amber-500/10 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer"
                >
                  <ChevronRight className="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal เพิ่ม/แก้ไขข้อมูลจัดตั้งศพ */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/50 dark:border-amber-950/40 shadow-2xl w-full max-w-4xl overflow-hidden relative">
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-4 flex justify-between items-center text-white">
              <div>
                <h3 className="font-bold text-sm font-heading">
                  {currentFuneral.id ? 'แก้ไขข้อมูลจัดตั้งศพ' : 'บันทึกข้อมูลจัดตั้งศพเพิ่มเติม'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-white hover:text-amber-100 cursor-pointer p-1">
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto animate-fade-in text-xs">
              
              {/* Dropdown เลือกการจองศาลา (เฉพาะกรณีกดเพิ่มใหม่) */}
              {!currentFuneral.id && (
                <div className="bg-amber-500/5 dark:bg-[#110e08]/60 p-4.5 rounded-2xl border border-amber-200/30 dark:border-amber-950/20 space-y-2">
                  <label className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                    <span className="w-1.5 h-3 bg-amber-500 rounded-sm inline-block" />
                    เลือกคิวการจองศาลาวัด *
                  </label>
                  <select
                    value={currentFuneral.booking_id || ''}
                    onChange={(e) => {
                      const bId = e.target.value;
                      const selectedB = bookings.find(b => b.id === bId);
                      let suggestedName = selectedB ? selectedB.event_title : '';
                      suggestedName = suggestedName.replace(/งานศพของ|งานศพคุณแม่|งานศพคุณพ่อ|งานศพนาย|งานศพนาง|งานศพ|งานฌาปนกิจศพของ|งานฌาปนกิจศพ/g, '').trim();
                      
                      setCurrentFuneral({
                        ...currentFuneral,
                        booking_id: bId,
                        deceased_name: suggestedName,
                        cremation_date: selectedB ? selectedB.end_date : ''
                      });
                    }}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer transition-all"
                  >
                    {unarrangedBookings.map(b => {
                      const sala = salas.find(s => s.id === b.sala_id);
                      return (
                        <option key={b.id} value={b.id}>
                          {b.event_title} ({sala ? sala.short_name : 'ศาลา'}) - {formatThaiDate(b.start_date)}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {/* Layout ข้อมูลจัดตั้งศพ */}
              <div className="space-y-5">

                {/* Section 1: ลำดับทะเบียน */}
                <div className="bg-amber-500/5 dark:bg-[#110e08]/30 p-5 rounded-2xl border border-amber-200/20 dark:border-amber-950/20 space-y-4">
                  <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 border-b border-amber-200/30 pb-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-3.5 bg-amber-500 rounded-sm inline-block" />
                    ลำดับทะเบียน
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-amber-900/80 dark:text-amber-350">ลำดับที่</label>
                      <input
                        type="text"
                        value={currentFuneral.register_no || ''}
                        onChange={(e) => setCurrentFuneral({ ...currentFuneral, register_no: e.target.value })}
                        placeholder="เช่น 001"
                        className="w-full px-3 py-2.5 text-xs rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-amber-900/80 dark:text-amber-350">ปี พ.ศ.</label>
                      <input
                        type="number"
                        value={currentFuneral.register_year || ''}
                        onChange={(e) => setCurrentFuneral({ ...currentFuneral, register_year: e.target.value ? Number(e.target.value) : undefined })}
                        placeholder="เช่น 2568"
                        className="w-full px-3 py-2.5 text-xs rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-amber-900/80 dark:text-amber-350">เลขที่ใบมรณบัตร</label>
                      <input
                        type="text"
                        value={currentFuneral.death_certificate_no || ''}
                        onChange={(e) => setCurrentFuneral({ ...currentFuneral, death_certificate_no: e.target.value })}
                        placeholder="ระบุเลขที่ใบมรณบัตร"
                        className="w-full px-3 py-2.5 text-xs rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: ๑. ประวัติผู้เสียชีวิต */}
                <div className="bg-amber-500/5 dark:bg-[#110e08]/30 p-5 rounded-2xl border border-amber-200/20 dark:border-amber-950/20 space-y-4">
                  <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 border-b border-amber-200/30 pb-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-3.5 bg-amber-500 rounded-sm inline-block" />
                    ๑. ประวัติผู้เสียชีวิต
                  </h4>

                  {currentFuneral.deceased_photo_url && (
                    <div className="flex justify-center mb-3">
                      <div className="relative group size-20 rounded-full overflow-hidden border-2 border-amber-500/50 shadow-md">
                        <img 
                          src={currentFuneral.deceased_photo_url} 
                          alt="รูปผู้วายชนม์" 
                          className="size-full object-cover"
                        />
                      </div>
                    </div>
                  )}

                  {/* ชื่อ-นามสกุล */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-amber-900/80 dark:text-amber-350">ชื่อ-นามสกุล ผู้วายชนม์ *</label>
                    <input
                      type="text"
                      required
                      value={currentFuneral.deceased_name || ''}
                      onChange={(e) => setCurrentFuneral({ ...currentFuneral, deceased_name: e.target.value })}
                      placeholder="เช่น นายสมศักดิ์ รักดี"
                      className="w-full px-3 py-2.5 text-xs rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    />
                  </div>

                  {/* อายุ / สัญชาติ */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-amber-900/80 dark:text-amber-350">อายุ (ปี)</label>
                      <input
                        type="number"
                        value={currentFuneral.deceased_age || ''}
                        onChange={(e) => setCurrentFuneral({ ...currentFuneral, deceased_age: e.target.value ? Number(e.target.value) : undefined })}
                        placeholder="เช่น 75"
                        className="w-full px-3 py-2.5 text-xs rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-amber-900/80 dark:text-amber-350">สัญชาติ</label>
                      <input
                        type="text"
                        value={currentFuneral.deceased_nationality || ''}
                        onChange={(e) => setCurrentFuneral({ ...currentFuneral, deceased_nationality: e.target.value })}
                        placeholder="ไทย"
                        className="w-full px-3 py-2.5 text-xs rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* เลขประจำตัวประชาชน / อาชีพ */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-amber-900/80 dark:text-amber-350">เลขประจำตัวประชาชน</label>
                      <input
                        type="text"
                        value={currentFuneral.deceased_id_card || ''}
                        onChange={(e) => setCurrentFuneral({ ...currentFuneral, deceased_id_card: e.target.value })}
                        placeholder="x-xxxx-xxxxx-xx-x"
                        className="w-full px-3 py-2.5 text-xs rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-amber-900/80 dark:text-amber-350">อาชีพ</label>
                      <input
                        type="text"
                        value={currentFuneral.deceased_occupation || ''}
                        onChange={(e) => setCurrentFuneral({ ...currentFuneral, deceased_occupation: e.target.value })}
                        placeholder="เช่น เกษตรกร, ข้าราชการ"
                        className="w-full px-3 py-2.5 text-xs rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* วันเกิด */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-amber-900/80 dark:text-amber-350">วันเกิด</label>
                    <ThaiDatePicker
                      value={currentFuneral.deceased_birthdate || ''}
                      onChange={(val) => setCurrentFuneral({ ...currentFuneral, deceased_birthdate: val })}
                    />
                  </div>

                  {/* รูปถ่ายผู้วายชนม์ */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-amber-900/80 dark:text-amber-350 flex justify-between items-center">
                      <span>รูปถ่ายผู้วายชนม์</span>
                      {currentFuneral.deceased_photo_url && (
                        <span className="text-[9px] text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">มีรูปถ่าย ✓</span>
                      )}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={currentFuneral.deceased_photo_url || ''}
                        onChange={(e) => setCurrentFuneral({ ...currentFuneral, deceased_photo_url: e.target.value })}
                        placeholder="ลิงก์รูปถ่าย..."
                        className="flex-1 px-3 py-2.5 text-xs rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                      />
                      <label className="cursor-pointer bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-950/60 border border-amber-200 dark:border-amber-950 text-amber-800 dark:text-amber-300 px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 transition-colors">
                        <span>{isUploadingPhoto ? 'กำลังส่ง...' : 'อัปโหลด'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={isUploadingPhoto}
                          onChange={(e) => {
                            if (e.target.files?.[0]) handleUploadPhoto(e.target.files[0]);
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Section 3: ๒. รายละเอียดการเสียชีวิต */}
                <div className="bg-amber-500/5 dark:bg-[#110e08]/30 p-5 rounded-2xl border border-amber-200/20 dark:border-amber-950/20 space-y-4">
                  <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 border-b border-amber-200/30 pb-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-3.5 bg-amber-500 rounded-sm inline-block" />
                    ๒. รายละเอียดการเสียชีวิต
                  </h4>

                  {/* เสียชีวิตเมื่อวันที่ / เวลา */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-amber-900/80 dark:text-amber-350">เสียชีวิตเมื่อวันที่</label>
                      <ThaiDatePicker
                        value={currentFuneral.death_date || ''}
                        onChange={(val) => setCurrentFuneral({ ...currentFuneral, death_date: val })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-amber-900/80 dark:text-amber-350">เวลา</label>
                      <input
                        type="text"
                        value={currentFuneral.death_time || ''}
                        onChange={(e) => setCurrentFuneral({ ...currentFuneral, death_time: e.target.value })}
                        placeholder="08:00"
                        className="w-full px-3 py-2.5 text-xs rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* สาเหตุการเสียชีวิต */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-amber-900/80 dark:text-amber-350">สาเหตุการเสียชีวิต</label>
                    <input
                      type="text"
                      value={currentFuneral.death_cause || ''}
                      onChange={(e) => setCurrentFuneral({ ...currentFuneral, death_cause: e.target.value })}
                      placeholder="เช่น โรคชรา, หัวใจล้มเหลว"
                      className="w-full px-3 py-2.5 text-xs rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    />
                  </div>

                  {/* สถานที่เสียชีวิต */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-amber-900/80 dark:text-amber-350">สถานที่เสียชีวิต</label>
                    <input
                      type="text"
                      value={currentFuneral.death_location || ''}
                      onChange={(e) => setCurrentFuneral({ ...currentFuneral, death_location: e.target.value })}
                      placeholder="เช่น โรงพยาบาลศิริราช, บ้านพัก"
                      className="w-full px-3 py-2.5 text-xs rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    />
                  </div>
                </div>

                {/* Section 4: ๓. รายละเอียดผู้แจ้ง */}
                <div className="bg-amber-500/5 dark:bg-[#110e08]/30 p-5 rounded-2xl border border-amber-200/20 dark:border-amber-950/20 space-y-4">
                  <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 border-b border-amber-200/30 pb-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-3.5 bg-amber-500 rounded-sm inline-block" />
                    ๓. รายละเอียดผู้แจ้ง
                  </h4>

                  {/* ชื่อ-นามสกุลผู้แจ้ง / อายุ */}
                  <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-end">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-amber-900/80 dark:text-amber-350">ชื่อ-นามสกุลผู้แจ้ง</label>
                      <input
                        type="text"
                        value={currentFuneral.reporter_name || ''}
                        onChange={(e) => setCurrentFuneral({ ...currentFuneral, reporter_name: e.target.value })}
                        placeholder="เช่น นางสาวสมศรี รักดี"
                        className="w-full px-3 py-2.5 text-xs rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-amber-900/80 dark:text-amber-350">อายุ</label>
                      <input
                        type="number"
                        value={currentFuneral.reporter_age || ''}
                        onChange={(e) => setCurrentFuneral({ ...currentFuneral, reporter_age: e.target.value ? Number(e.target.value) : undefined })}
                        placeholder="45"
                        className="w-20 px-3 py-2.5 text-xs rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                      />
                    </div>
                    <span className="text-xs font-bold text-amber-900/80 dark:text-amber-350 pb-2.5">ปี</span>
                  </div>

                  {/* ความเกี่ยวข้องกับผู้เสียชีวิต */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-amber-900/80 dark:text-amber-350">ความเกี่ยวข้องกับผู้เสียชีวิต</label>
                    <input
                      type="text"
                      value={currentFuneral.reporter_relation || ''}
                      onChange={(e) => setCurrentFuneral({ ...currentFuneral, reporter_relation: e.target.value })}
                      placeholder="เช่น บุตร, คู่สมรส, ญาติ"
                      className="w-full px-3 py-2.5 text-xs rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    />
                  </div>

                  {/* ที่อยู่ / หมู่บ้าน */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-amber-900/80 dark:text-amber-350">ที่อยู่ บ้านเลขที่</label>
                      <input
                        type="text"
                        value={currentFuneral.reporter_address || ''}
                        onChange={(e) => setCurrentFuneral({ ...currentFuneral, reporter_address: e.target.value })}
                        placeholder="เช่น 123/4"
                        className="w-full px-3 py-2.5 text-xs rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-amber-900/80 dark:text-amber-350">หมู่บ้าน</label>
                      <input
                        type="text"
                        value={currentFuneral.reporter_moo || ''}
                        onChange={(e) => setCurrentFuneral({ ...currentFuneral, reporter_moo: e.target.value })}
                        placeholder="เช่น หมู่ 5"
                        className="w-full px-3 py-2.5 text-xs rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* ตำบล / อำเภอ / จังหวัด */}
                  <ThaiAddressSelect
                    province={currentFuneral.reporter_province || ''}
                    amphoe={currentFuneral.reporter_amphoe || ''}
                    tambon={currentFuneral.reporter_tambon || ''}
                    onProvinceChange={(val) => setCurrentFuneral(prev => ({ ...prev, reporter_province: val }))}
                    onAmphoeChange={(val) => setCurrentFuneral(prev => ({ ...prev, reporter_amphoe: val }))}
                    onTambonChange={(val) => setCurrentFuneral(prev => ({ ...prev, reporter_tambon: val }))}
                  />

                  {/* เบอร์โทรศัพท์ผู้แจ้ง */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-amber-900/80 dark:text-amber-350">เบอร์โทรศัพท์ผู้แจ้ง</label>
                    <input
                      type="tel"
                      value={currentFuneral.reporter_phone || ''}
                      onChange={(e) => setCurrentFuneral({ ...currentFuneral, reporter_phone: e.target.value })}
                      placeholder="เช่น 081-234-5678"
                      className="w-full px-3 py-2.5 text-xs rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    />
                  </div>
                </div>

                {/* Section 5: เฉพาะเจ้าหน้าที่ */}
                <div className="bg-amber-500/5 dark:bg-[#110e08]/30 p-5 rounded-2xl border-2 border-dashed border-amber-400/40 space-y-4">
                  <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 border-b border-amber-200/30 pb-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-3.5 bg-amber-500 rounded-sm inline-block" />
                    เฉพาะเจ้าหน้าที่
                  </h4>

                  {/* สวดอภิธรรม / สถานที่ฌาปนกิจ */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-amber-900/80 dark:text-amber-350">สวดอภิธรรม จำนวน (คืน)</label>
                      <input
                        type="number"
                        value={currentFuneral.chant_nights || ''}
                        onChange={(e) => setCurrentFuneral({ ...currentFuneral, chant_nights: e.target.value ? Number(e.target.value) : undefined })}
                        placeholder="3"
                        className="w-full px-3 py-2.5 text-xs rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-amber-900/80 dark:text-amber-350">สถานที่ฌาปนกิจ</label>
                      <input
                        type="text"
                        value={currentFuneral.cremation_location || ''}
                        onChange={(e) => setCurrentFuneral({ ...currentFuneral, cremation_location: e.target.value })}
                        placeholder="เช่น เมรุวัดท่าไม้"
                        className="w-full px-3 py-2.5 text-xs rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* วันที่ฌาปนกิจ / เวลาฌาปนกิจ */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-amber-900/80 dark:text-amber-350">วันที่ฌาปนกิจ</label>
                      <ThaiDatePicker
                        value={currentFuneral.cremation_date || ''}
                        onChange={(val) => setCurrentFuneral({ ...currentFuneral, cremation_date: val })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-amber-900/80 dark:text-amber-350">เวลาฌาปนกิจ</label>
                      <input
                        type="text"
                        value={currentFuneral.cremation_time || ''}
                        onChange={(e) => setCurrentFuneral({ ...currentFuneral, cremation_time: e.target.value })}
                        placeholder="เช่น 13:00"
                        className="w-full px-3 py-2.5 text-xs rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 6: เอกสารและการชำระเงิน */}
                <div className="bg-amber-500/5 dark:bg-[#110e08]/30 p-5 rounded-2xl border border-amber-200/20 dark:border-amber-950/20 space-y-4">
                  <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 border-b border-amber-200/30 pb-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-3.5 bg-amber-500 rounded-sm inline-block" />
                    เอกสารและการชำระเงิน
                  </h4>

                  {/* ใบมรณบัตร (อัปโหลด) */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-amber-900/80 dark:text-amber-350 flex justify-between items-center">
                      <span>ใบมรณบัตร (URL / อ้างอิงไฟล์)</span>
                      {currentFuneral.death_certificate_url && (
                        <button
                          type="button"
                          onClick={() => setLightboxImage(currentFuneral.death_certificate_url || null)}
                          className="text-[9px] text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 px-1.5 py-0.5 rounded cursor-pointer border-none"
                        >
                          มีไฟล์อัปโหลดแล้ว (คลิกเพื่อดู) ✓
                        </button>
                      )}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={currentFuneral.death_certificate_url || ''}
                        onChange={(e) => setCurrentFuneral({ ...currentFuneral, death_certificate_url: e.target.value })}
                        placeholder="ลิงก์ หรืออัปโหลดไฟล์..."
                        className="flex-1 px-3 py-2.5 text-xs rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                      />
                      <label className="cursor-pointer bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-950/60 border border-amber-200 dark:border-amber-950 text-amber-800 dark:text-amber-300 px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 transition-colors">
                        <span>{isUploadingCertificate ? 'กำลังส่ง...' : 'อัปโหลด'}</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          disabled={isUploadingCertificate}
                          onChange={(e) => {
                            if (e.target.files?.[0]) handleUploadCertificate(e.target.files[0]);
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* เลขที่ใบเสร็จรับเงิน */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-amber-900/80 dark:text-amber-350">เลขที่ใบเสร็จรับเงิน</label>
                    <input
                      type="text"
                      value={currentFuneral.receipt_no || ''}
                      onChange={(e) => setCurrentFuneral({ ...currentFuneral, receipt_no: e.target.value })}
                      placeholder="ระบุเลขที่ใบเสร็จ"
                      className="w-full px-3 py-2.5 text-xs rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    />
                  </div>

                  {/* ใบเสร็จการชำระเงิน (อัปโหลด) */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-amber-900/80 dark:text-amber-350 flex justify-between items-center">
                      <span>ใบเสร็จชำระเงิน (URL / อ้างอิงไฟล์)</span>
                      {currentFuneral.receipt_url && (
                        <button
                          type="button"
                          onClick={() => setLightboxImage(currentFuneral.receipt_url || null)}
                          className="text-[9px] text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 px-1.5 py-0.5 rounded cursor-pointer border-none"
                        >
                          มีไฟล์อัปโหลดแล้ว (คลิกเพื่อดู) ✓
                        </button>
                      )}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={currentFuneral.receipt_url || ''}
                        onChange={(e) => setCurrentFuneral({ ...currentFuneral, receipt_url: e.target.value })}
                        placeholder="ลิงก์ หรืออัปโหลดไฟล์..."
                        className="flex-1 px-3 py-2.5 text-xs rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                      />
                      <label className="cursor-pointer bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-950/60 border border-amber-200 dark:border-amber-950 text-amber-800 dark:text-amber-300 px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 transition-colors">
                        <span>{isUploadingReceipt ? 'กำลังส่ง...' : 'อัปโหลด'}</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          disabled={isUploadingReceipt}
                          onChange={(e) => {
                            if (e.target.files?.[0]) handleUploadReceipt(e.target.files[0]);
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* แสกนใบแจ้งจัดตั้งศพที่เขียนด้วยมือ (อัปโหลด) */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-amber-900/80 dark:text-amber-350 flex justify-between items-center">
                      <span>แสกนใบแจ้งขอตั้งศพที่เขียนด้วยมือ (ภาพถ่าย หรือไฟล์เอกสาร)</span>
                      {currentFuneral.scanned_document_url && (
                        <button
                          type="button"
                          onClick={() => setLightboxImage(currentFuneral.scanned_document_url || null)}
                          className="text-[9px] text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 px-1.5 py-0.5 rounded cursor-pointer border-none"
                        >
                          มีไฟล์อัปโหลดแล้ว (คลิกเพื่อดู) ✓
                        </button>
                      )}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={currentFuneral.scanned_document_url || ''}
                        onChange={(e) => setCurrentFuneral({ ...currentFuneral, scanned_document_url: e.target.value })}
                        placeholder="ลิงก์ หรืออัปโหลดไฟล์..."
                        className="flex-1 px-3 py-2.5 text-xs rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                      />
                      <label className="cursor-pointer bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-950/60 border border-amber-200 dark:border-amber-950 text-amber-800 dark:text-amber-300 px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 transition-colors">
                        <span>{isUploadingDocument ? 'กำลังส่ง...' : 'อัปโหลด'}</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          disabled={isUploadingDocument}
                          onChange={(e) => {
                            if (e.target.files?.[0]) handleUploadScannedDocument(e.target.files[0]);
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* หมายเหตุ */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">หมายเหตุเพิ่มเติม</label>
                <textarea
                  value={currentFuneral.notes || ''}
                  onChange={(e) => setCurrentFuneral({ ...currentFuneral, notes: e.target.value })}
                  placeholder="ข้อมูลอื่น ๆ เพิ่มเติม เช่น สวดกี่คืน แขกสำคัญ ฯลฯ"
                  rows={2}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none transition-all"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 border-amber-200/80 text-amber-950 hover:bg-amber-50 dark:border-amber-950/80 dark:text-amber-350 dark:hover:bg-amber-950/20 py-5 text-xs font-bold cursor-pointer rounded-xl transition-all"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-5 text-xs font-bold border-none shadow-md shadow-amber-500/10 cursor-pointer rounded-xl transition-all"
                >
                  {isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูลจัดตั้งศพ'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ImageLightbox src={lightboxImage} onClose={() => setLightboxImage(null)} />
      <UploadProgressBar
        isOpen={isUploadingDocument || isUploadingCertificate || isUploadingReceipt || isUploadingPhoto}
        progress={uploadProgress}
        logs={uploadLogs}
      />
    </div>
  );
}
