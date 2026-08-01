'use client';

import React from 'react';
import {
  Package,
  Plus,
  Search,
  Loader2,
  Trash,
  X,
  Edit,
  ClipboardList,
  UserCheck,
  CheckCircle,
  Phone,
  MapPin,
  QrCode,
  ScanLine
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInventoryController } from '@/app/Controllers/useInventoryController';
import { CustomDialog } from '@/components/ui/custom-dialog';
import { usePermission } from '@/lib/usePermission';
import { formatThaiDate } from '@/lib/utils';
import { ThaiDatePicker } from '@/components/ui/thai-date-picker';
import { ImageLightbox } from '@/components/ui/image-lightbox';

export default function InventoryManagement() {
  const { permissions, role } = usePermission();
  const [lightboxImage, setLightboxImage] = React.useState<string | null>(null);
  const {
    activeTab,
    setActiveTab,
    inventory,
    loading,
    search,
    setSearch,
    selectedCategory,
    setSelectedCategory,
    isItemModalOpen,
    setIsItemModalOpen,
    currentItem,
    isBorrowModalOpen,
    setIsBorrowModalOpen,
    currentBorrow,
    isSaving,
    alertState,
    confirmState,
    setConfirmState,
    handleOpenAddItemModal,
    handleOpenEditItemModal,
    handleDeleteItem,
    handleSaveItem,
    handleOpenAddBorrowModal,
    handleReturnItem,
    handleSaveBorrow,
    handleDeleteBorrow,
    updateItemFormFields,
    updateBorrowFormFields,
    filteredInventory,
    filteredBorrows,
    users
  } = useInventoryController();

  const [isUploadingPhoto, setIsUploadingPhoto] = React.useState(false);
  const [isScannerOpen, setIsScannerOpen] = React.useState(false);
  const [scanAlert, setScanAlert] = React.useState<{ show: boolean; title: string; description: string; variant: 'success' | 'destructive' | 'warning' } | null>(null);

  // Play a brief success beep
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.value = 800; // Hz
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.2);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.2);
    } catch (e) {
      console.warn('AudioContext beep failed', e);
    }
  };

  const handlePrintQR = (item: any) => {
    const printWindow = window.open('', '_blank', 'width=350,height=350');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>พิมพ์ QR Code: ${item.name}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              margin: 0;
              font-family: sans-serif;
              text-align: center;
              padding: 20px;
            }
            img {
              width: 180px;
              height: 180px;
              margin-bottom: 15px;
            }
            h1 {
              font-size: 16px;
              margin: 5px 0;
              font-weight: bold;
            }
            p {
              font-size: 11px;
              color: #555;
              margin: 2px 0;
            }
          </style>
        </head>
        <body>
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(item.id)}" onload="window.print(); window.close();" />
          <h1>${item.name}</h1>
          <p>หมวดหมู่: ${item.category}</p>
          <p>รหัสพัสดุ: ${item.id}</p>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleScanSuccess = (decodedText: string) => {
    setIsScannerOpen(false);
    playBeep();

    const targetItem = inventory.find(i => i.id === decodedText || i.name === decodedText);
    if (!targetItem) {
      setScanAlert({
        show: true,
        title: 'ไม่พบข้อมูลครุภัณฑ์',
        description: `รหัสพัสดุ "${decodedText}" ไม่ตรงกับรายการใดในระบบวัด`,
        variant: 'destructive'
      });
      return;
    }

    if (activeTab === 'inventory') {
      if (targetItem.available_qty <= 0) {
        setScanAlert({
          show: true,
          title: 'ครุภัณฑ์ไม่เพียงพอให้ยืม',
          description: `"${targetItem.name}" ในคลังถูกยืมไปทั้งหมดแล้ว (คงเหลือ 0 ชิ้น)`,
          variant: 'warning'
        });
        return;
      }
      // Open add borrow modal with this item selected!
      handleOpenAddBorrowModal(targetItem.id);
    } else {
      // Find active borrows
      const activeRecords = filteredBorrows.filter(b => b.item_id === targetItem.id && b.status !== 'returned');
      if (activeRecords.length === 0) {
        setScanAlert({
          show: true,
          title: 'ไม่มีรายการยืมค้างไว้',
          description: `ไม่พบรายการยืมค้างคืนสำหรับ "${targetItem.name}" ของผู้ใดในขณะนี้`,
          variant: 'warning'
        });
      } else if (activeRecords.length === 1) {
        // Open return confirmation directly
        handleReturnItem(activeRecords[0]);
      } else {
        // Multiple borrowers: set search key to locate
        setSearch(targetItem.name);
        setScanAlert({
          show: true,
          title: 'พบรายการยืมค้างหลายราย',
          description: `มีผู้ยืม "${targetItem.name}" ค้างไว้ทั้งหมด ${activeRecords.length} ราย ระบบได้ทำการกรองตารางแสดงผลเฉพาะรายการของสิ่งของชิ้นนี้ กรุณาเลือกคนที่จะรับคืน`,
          variant: 'warning'
        });
      }
    }
  };

  React.useEffect(() => {
    let scannerRef: any = null;
    if (isScannerOpen) {
      import('html5-qrcode').then((module) => {
        const scanner = new module.Html5QrcodeScanner(
          "qr-reader",
          { fps: 15, qrbox: { width: 220, height: 220 } },
          /* verbose= */ false
        );
        scannerRef = scanner;
        scanner.render(
          (text) => {
            handleScanSuccess(text);
            scanner.clear().catch(console.error);
          },
          (err) => {
            // Ignore normal scan failure ticks
          }
        );
      }).catch(console.error);

      return () => {
        if (scannerRef) {
          scannerRef.clear().catch(console.error);
        }
      };
    }
  }, [isScannerOpen]);

  return (
    <div className="space-y-6">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-heading text-amber-900 dark:text-amber-200">
            ระบบครุภัณฑ์วัดและการยืม-คืนสิ่งของ
          </h2>
          <p className="text-xs text-amber-700/50 dark:text-amber-400/50">
            บริหารจัดการทรัพย์สินของส่วนรวมภายในวัด (เต็นท์, โต๊ะ, เก้าอี้, เครื่องครัว) และระบบการยืมของชาวบ้าน
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsScannerOpen(true)}
            className="bg-amber-100 hover:bg-amber-200 text-amber-900 dark:bg-amber-950/40 dark:hover:bg-amber-950/70 dark:text-amber-200 border border-amber-300/40 dark:border-amber-950/40 font-bold text-xs py-5 px-5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <ScanLine className="size-4 text-amber-600 dark:text-amber-500" />
            สแกน QR
          </Button>
          {(permissions.canCreate || role === 'member') && (
            <>
              {activeTab === 'inventory' ? (
                <Button
                  onClick={handleOpenAddItemModal}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-5 px-5 rounded-xl flex items-center gap-1.5 border-none shadow-md shadow-amber-500/10 cursor-pointer"
                >
                  <Plus className="size-4" />
                  เพิ่มครุภัณฑ์ใหม่
                </Button>
              ) : (
                <Button
                  onClick={() => handleOpenAddBorrowModal()}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-5 px-5 rounded-xl flex items-center gap-1.5 border-none shadow-md shadow-amber-600/10 cursor-pointer"
                >
                  <Plus className="size-4" />
                  ลงทะเบียนยืมของ
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Center Alert Notification Modal */}
      {alertState && alertState.show && (
        <CustomDialog
          show={alertState.show}
          type="alert"
          variant={alertState.variant}
          title={alertState.title}
          description={alertState.description}
          onConfirm={() => {}}
        />
      )}

      {/* Center Confirm Deletion/Action Modal */}
      {confirmState && confirmState.show && (
        <CustomDialog
          show={confirmState.show}
          type="confirm"
          variant="destructive"
          title={confirmState.title}
          description={confirmState.description}
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
          confirmText="ยืนยัน"
          cancelText="ยกเลิก"
        />
      )}

      {/* QR Scanner Modal */}
      {isScannerOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/40 dark:border-amber-950/30 p-6 max-w-sm w-full relative shadow-2xl">
            <button 
              onClick={() => setIsScannerOpen(false)}
              className="absolute top-4 right-4 text-amber-800/40 hover:text-amber-800/80 dark:text-amber-500/40 dark:hover:text-amber-200 cursor-pointer p-1"
            >
              <X className="size-5" />
            </button>
            <h3 className="text-base font-extrabold text-amber-950 dark:text-amber-100 font-heading mb-4 flex items-center gap-1.5">
              <ScanLine className="size-5 text-amber-500" />
              สแกน QR Code พัสดุวัด
            </h3>
            <p className="text-xs text-amber-700/60 dark:text-amber-400/50 mb-5 leading-relaxed">
              ส่องกล้องไปที่ QR Code ของสิ่งของวัดเพื่อทำรายการยืม หรือ คืนโดยอัตโนมัติ
            </p>
            <div className="overflow-hidden rounded-xl bg-amber-50/10 dark:bg-amber-950/5 border border-amber-200/30 dark:border-amber-950/20 max-w-full">
              <div id="qr-reader" className="w-full"></div>
            </div>
            <div className="mt-5 text-center">
              <Button 
                onClick={() => setIsScannerOpen(false)}
                variant="outline"
                className="w-full text-xs font-bold py-2 border-amber-200 hover:bg-amber-500/10 cursor-pointer"
              >
                ยกเลิกและปิดกล้อง
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Scan Alert Dialog */}
      {scanAlert && scanAlert.show && (
        <CustomDialog
          show={scanAlert.show}
          type="alert"
          variant={scanAlert.variant}
          title={scanAlert.title}
          description={scanAlert.description}
          onConfirm={() => setScanAlert(null)}
        />
      )}

      {/* Tabs selection */}
      <div className="flex border-b border-amber-200/50 dark:border-amber-950/40">
        <button
          onClick={() => { setActiveTab('inventory'); setSearch(''); }}
          className={`pb-3.5 px-6 font-bold text-sm tracking-wide border-b-2 transition-all cursor-pointer ${
            activeTab === 'inventory'
              ? 'border-amber-500 text-amber-900 dark:text-amber-200'
              : 'border-transparent text-amber-800/40 hover:text-amber-800/60 dark:text-amber-500/40'
          }`}
        >
          <span className="flex items-center gap-2">
            <Package className="size-4" />
            คลังครุภัณฑ์และวัสดุวัด
          </span>
        </button>
        <button
          onClick={() => { setActiveTab('borrow'); setSearch(''); }}
          className={`pb-3.5 px-6 font-bold text-sm tracking-wide border-b-2 transition-all cursor-pointer ${
            activeTab === 'borrow'
              ? 'border-amber-500 text-amber-900 dark:text-amber-200'
              : 'border-transparent text-amber-800/40 hover:text-amber-800/60 dark:text-amber-500/40'
          }`}
        >
          <span className="flex items-center gap-2">
            <ClipboardList className="size-4" />
            สมุดบันทึกการยืม-คืนของ
          </span>
        </button>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-[#15110a] p-4 rounded-xl border border-amber-200/40 dark:border-amber-950/30">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-amber-700/40 dark:text-amber-500/30">
            <Search className="size-4" />
          </div>
          <input
            type="text"
            placeholder={activeTab === 'inventory' ? 'ค้นหาตามชื่อ, หมวดหมู่, สถานที่เก็บ...' : 'ค้นหาตามชื่อผู้ยืม, เบอร์ติดต่อ, สิ่งของ...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-amber-200/60 dark:border-amber-950 bg-amber-50/10 dark:bg-[#1a150e] text-amber-950 dark:text-amber-100 placeholder-amber-700/30 dark:placeholder-amber-500/20 text-xs outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
          />
        </div>
        {activeTab === 'inventory' && (
          <div className="w-full sm:w-48 shrink-0">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200/60 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
            >
              <option value="all">ทุกหมวดหมู่ (All)</option>
              <option value="อุปกรณ์จัดงาน">อุปกรณ์จัดงาน</option>
              <option value="เครื่องเสียง">ระบบเครื่องเสียง</option>
              <option value="เครื่องครัว">เครื่องครัววัด</option>
              <option value="ของตกแต่งพิธี">ของตกแต่งพิธี</option>
              <option value="อื่น ๆ">หมวดหมู่อื่น ๆ</option>
            </select>
          </div>
        )}
      </div>

      {/* Tabs View logic */}
      {loading ? (
        <div className="p-12 text-center animate-pulse-subtle">
          <Loader2 className="size-8 text-amber-500 animate-spin mx-auto mb-2" />
          <p className="text-xs font-bold text-amber-700/65">กำลังโหลดคลังวัสดุ...</p>
        </div>
      ) : activeTab === 'inventory' ? (
        /* Inventory Item list */
        filteredInventory.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed border-amber-200/20 rounded-xl bg-white dark:bg-[#15110a] animate-fade-in">
            <Package className="size-12 mx-auto text-amber-200 dark:text-amber-900/35 mb-2.5" />
            <p className="text-sm text-amber-800/50 dark:text-amber-500/40">ไม่พบครุภัณฑ์ตามเงื่อนไข</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in">
            {filteredInventory.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/40 dark:border-amber-950/30 p-6 shadow-md shadow-amber-100/5 hover:translate-y-[-2px] transition-all"
              >
                <div className="flex gap-4 items-start mb-4">
                  {item.image_url && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={item.image_url}
                      className="w-16 h-16 rounded-xl object-cover border border-amber-200/40 dark:border-amber-950/30 cursor-zoom-in hover:opacity-90 transition-opacity"
                      alt={item.name}
                      onClick={() => setLightboxImage(item.image_url || null)}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  )}
                  <div className="flex-1">
                    <span className="px-2.5 py-0.5 rounded-[4px] text-[9px] font-bold bg-amber-500/10 text-amber-900 dark:text-amber-400">
                      {item.category}
                    </span>
                    <h3 className="font-extrabold text-base text-amber-950 dark:text-amber-100 mt-2 font-heading">
                      {item.name}
                    </h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                    item.condition === 'excellent'
                      ? 'bg-emerald-500/10 text-emerald-600'
                      : item.condition === 'good'
                      ? 'bg-sky-500/10 text-sky-600'
                      : item.condition === 'fair'
                      ? 'bg-amber-500/10 text-amber-600'
                      : 'bg-red-500/10 text-red-600'
                  }`}>
                    {item.condition === 'excellent' ? 'ดีมาก' : item.condition === 'good' ? 'สภาพดี' : item.condition === 'fair' ? 'พอใช้' : 'ชำรุด'}
                  </span>
                </div>

                {/* Stock status detail */}
                <div className="bg-amber-50/20 dark:bg-amber-950/5 border border-amber-100/50 dark:border-amber-950/60 p-4 rounded-xl flex justify-between items-center my-4 text-xs">
                  <div>
                    <span className="text-amber-800/50 dark:text-amber-500/50 block">พร้อมใช้งาน</span>
                    <strong className="text-lg font-extrabold text-amber-950 dark:text-amber-200">{item.available_qty}</strong>
                    <span className="text-[10px] text-amber-800/40"> / {item.total_qty} ชิ้น</span>
                  </div>
                  <div className="text-right">
                    <span className="text-amber-800/50 dark:text-amber-500/50 block">ถูกยืมไป</span>
                    <strong className="text-lg font-extrabold text-amber-800/80 dark:text-amber-400">
                      {item.total_qty - item.available_qty}
                    </strong>
                    <span className="text-[10px] text-amber-800/40"> ชิ้น</span>
                  </div>
                </div>

                {item.location && (
                  <div className="text-[11px] text-amber-800/70 dark:text-amber-400/70 flex items-center gap-1.5 mb-4 px-1 animate-fade-in">
                    <MapPin className="size-3.5 text-amber-600 dark:text-amber-500 shrink-0" />
                    <span>สถานที่เก็บ: <strong className="font-semibold text-amber-950 dark:text-amber-200">{item.location}</strong></span>
                  </div>
                )}

                {/* Actions */}
                {(permissions.canEdit || permissions.canDelete || role === 'member') && (
                  <div className="flex gap-2 mt-6 pt-4 border-t border-amber-100/50 dark:border-amber-950/40">
                    <Button
                      variant="outline"
                      onClick={() => handlePrintQR(item)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 border-amber-200 hover:bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs font-bold cursor-pointer"
                      title="พิมพ์ QR Code ติดสติกเกอร์สำหรับพัสดุชิ้นนี้"
                    >
                      <QrCode className="size-3.5 text-amber-600 dark:text-amber-500" />
                      พิมพ์ QR
                    </Button>
                    {(permissions.canEdit || role === 'member') && (
                      <Button
                        variant="outline"
                        onClick={() => handleOpenEditItemModal(item)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 border-amber-200 hover:bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs font-bold cursor-pointer"
                      >
                        <Edit className="size-3.5" />
                        แก้ไข
                      </Button>
                    )}
                    {permissions.canDelete && (
                      <Button
                        variant="destructive"
                        onClick={() => handleDeleteItem(item.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold cursor-pointer"
                      >
                        <Trash className="size-3.5" />
                        ลบ
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        /* Borrow Logs */
        filteredBorrows.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed border-amber-200/20 rounded-xl bg-white dark:bg-[#15110a] animate-fade-in">
            <ClipboardList className="size-12 mx-auto text-amber-200 dark:text-amber-900/35 mb-2.5" />
            <p className="text-sm text-amber-800/50 dark:text-amber-500/40">ไม่พบประวัติการยืม-คืนตามเงื่อนไข</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/40 dark:border-amber-950/30 p-6 shadow-md shadow-amber-100/5 animate-fade-in">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-amber-200/30 dark:border-amber-950/30 text-amber-800/60 dark:text-amber-500/65 font-bold">
                  <th className="py-3.5 px-3">ผู้ยืม / เบอร์โทร</th>
                  <th className="py-3.5 px-3">รายการครุภัณฑ์</th>
                  <th className="py-3.5 px-3 text-center">จำนวนยืม</th>
                  <th className="py-3.5 px-3">วันที่ยืม</th>
                  <th className="py-3.5 px-3">กำหนดคืน</th>
                  <th className="py-3.5 px-3">ผู้ให้ยืม</th>
                  <th className="py-3.5 px-3">สถานะ</th>
                  {(permissions.canEdit || role === 'member') && <th className="py-3.5 px-3 text-center">จัดการคืน</th>}
                  {permissions.canDelete && <th className="py-3.5 px-3 text-right">ลบ</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100/40 dark:divide-amber-950/20">
                {filteredBorrows.map((record) => (
                  <tr key={record.id} className="hover:bg-amber-50/10 dark:hover:bg-amber-950/5 transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-amber-950 dark:text-amber-100">{record.borrower_name}</div>
                      <div className="text-[10px] text-amber-700/50 dark:text-amber-500/40 mt-0.5 flex items-center gap-1">
                        <Phone className="size-3" /> {record.borrower_phone}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-amber-900 dark:text-amber-300">{record.item_name}</td>
                    <td className="py-3.5 px-3 text-center font-bold text-amber-950 dark:text-amber-200">{record.borrow_qty} ชิ้น</td>
                    <td className="py-3.5 px-3 text-amber-800/70 dark:text-amber-400">{formatThaiDate(record.borrow_date)}</td>
                    <td className="py-3.5 px-3 text-amber-800/70 dark:text-amber-400">
                      {formatThaiDate(record.due_date)}
                      {record.status === 'overdue' && <span className="text-[9px] font-bold text-red-500 block">เลยกำหนดส่ง</span>}
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-amber-900 dark:text-amber-300">
                      {record.created_by ? (
                        users.find(u => u.id === record.created_by)?.fullName || 'เจ้าหน้าที่วัด'
                      ) : (
                        <span className="text-amber-800/30 dark:text-amber-500/25 italic">ไม่ระบุ</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold ${
                        record.status === 'returned'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : record.status === 'overdue'
                          ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }`}>
                        {record.status === 'returned' ? 'คืนของแล้ว' : record.status === 'overdue' ? 'เกินกำหนดคืน' : 'กำลังยืม'}
                      </span>
                      {record.return_date && (
                        <span className="text-[9px] text-amber-800/40 block mt-0.5">
                          คืนเมื่อ: {formatThaiDate(record.return_date)}
                          {record.returned_by && ` โดย ${users.find(u => u.id === record.returned_by)?.fullName || 'เจ้าหน้าที่'}`}
                        </span>
                      )}
                    </td>
                    {(permissions.canEdit || role === 'member') && (
                      <td className="py-3.5 px-3 text-center">
                        {record.status !== 'returned' ? (
                          <Button
                            size="xs"
                            onClick={() => handleReturnItem(record)}
                            className="bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center gap-1 mx-auto font-bold cursor-pointer"
                          >
                            <UserCheck className="size-3" />
                            รับคืน
                          </Button>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px] flex items-center justify-center gap-1">
                            <CheckCircle className="size-3" /> เสร็จสิ้น
                          </span>
                        )}
                      </td>
                    )}
                    {permissions.canDelete && (
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => handleDeleteBorrow(record.id)}
                          className="p-1 rounded text-red-600 hover:bg-red-500/10 cursor-pointer"
                        >
                          <Trash className="size-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Add / Edit Inventory Item Modal */}
      {isItemModalOpen && currentItem && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/50 dark:border-amber-950/40 shadow-2xl w-full max-w-md overflow-hidden animate-scale-up">
            <div className="h-1.5 bg-linear-to-r from-amber-400 to-amber-600" />
            <div className="p-6 border-b border-amber-100 dark:border-amber-950 flex justify-between items-center bg-amber-50/20 dark:bg-amber-950/5">
              <h3 className="font-bold text-base text-amber-900 dark:text-amber-200 font-heading">
                {currentItem.name ? 'แก้ไขข้อมูลครุภัณฑ์วัด' : 'ลงทะเบียนบันทึกทรัพย์สินครุภัณฑ์ใหม่'}
              </h3>
              <button
                onClick={() => setIsItemModalOpen(false)}
                className="p-1.5 rounded-lg text-amber-800 dark:text-amber-400 hover:bg-amber-500/10 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-6 space-y-4">
              {/* Item Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">ชื่อทรัพย์สิน / ครุภัณฑ์</label>
                <input
                  type="text"
                  required
                  value={currentItem.name || ''}
                  onChange={(e) => updateItemFormFields('name', e.target.value)}
                  placeholder="เช่น เต็นท์พับโครงขาว ขนาด 3x6"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">หมวดหมู่ทรัพย์สิน</label>
                <select
                  value={currentItem.category || 'อุปกรณ์จัดงาน'}
                  onChange={(e) => updateItemFormFields('category', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
                >
                  <option value="อุปกรณ์จัดงาน">อุปกรณ์จัดงาน (เต็นท์, โต๊ะ, เก้าอี้)</option>
                  <option value="เครื่องเสียง">ระบบเครื่องเสียงและไมโครโฟน</option>
                  <option value="เครื่องครัว">เครื่องครัวและถ้วยชามวัด</option>
                  <option value="ของตกแต่งพิธี">วัสดุจัดตกแต่งและของมงคลพิธี</option>
                  <option value="อื่น ๆ">หมวดหมู่อื่น ๆ</option>
                </select>
              </div>

              {/* Image Upload / URL */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">
                  รูปภาพครุภัณฑ์ (รองรับ JPG, PNG, WEBP)
                </label>
                <div className="flex items-center gap-4">
                  {/* Preview Box */}
                  <div className="w-16 h-16 rounded-xl border-2 border-amber-200 dark:border-amber-950 bg-amber-50/30 dark:bg-amber-950/10 overflow-hidden flex items-center justify-center shrink-0 text-amber-300 dark:text-amber-700">
                    {isUploadingPhoto ? (
                      <Loader2 className="size-6 animate-spin text-amber-500" />
                    ) : currentItem.image_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={currentItem.image_url}
                        className="w-full h-full object-cover"
                        alt="preview"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <Package className="size-8 text-amber-200 dark:text-amber-900/35" />
                    )}
                  </div>

                  {/* Controls */}
                  <div className="flex-1 space-y-1.5">
                    <label
                      htmlFor="item-photo-upload"
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-amber-400 dark:border-amber-700 bg-amber-50/20 dark:bg-amber-950/10 text-xs font-bold text-amber-700 dark:text-amber-400 cursor-pointer hover:bg-amber-500/10 transition-colors ${
                        isUploadingPhoto ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                      <span>{isUploadingPhoto ? 'กำลังอัปโหลด...' : 'อัปโหลดรูปภาพ...'}</span>
                    </label>
                    <input
                      id="item-photo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={isUploadingPhoto}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

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
                            updateItemFormFields('image_url', data.path);
                          } else {
                            alert(data.error || 'ไม่สามารถอัปโหลดรูปภาพได้');
                          }
                        } catch (err: any) {
                          console.error('Upload photo error:', err);
                          alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์เพื่ออัปโหลดรูปภาพ');
                        } finally {
                          setIsUploadingPhoto(false);
                        }
                      }}
                    />
                    {currentItem.image_url && (
                      <button
                        type="button"
                        disabled={isUploadingPhoto}
                        onClick={() => updateItemFormFields('image_url', '')}
                        className="text-[10px] text-red-500 hover:underline cursor-pointer block disabled:opacity-50 text-left bg-transparent border-none p-0"
                      >
                        ลบรูปภาพออก
                      </button>
                    )}
                  </div>
                </div>

                {/* Manual Link Input */}
                <div className="pt-1">
                  <label className="text-[10px] font-bold text-amber-800/60 dark:text-amber-500/50">หรือกรอกลิงก์ที่อยู่รูปภาพโดยตรง (Image URL)</label>
                  <input
                    type="text"
                    value={currentItem.image_url || ''}
                    onChange={(e) => updateItemFormFields('image_url', e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    placeholder="เช่น https://domain.com/item.jpg"
                  />
                </div>
              </div>

              {/* Total Qty */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">จำนวนทั้งหมดในคลัง (ชิ้น)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={currentItem.total_qty || ''}
                  onChange={(e) => updateItemFormFields('total_qty', Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              {/* Location */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">สถานที่ / ห้องที่จัดเก็บ</label>
                <input
                  type="text"
                  value={currentItem.location || ''}
                  onChange={(e) => updateItemFormFields('location', e.target.value)}
                  placeholder="เช่น โรงเก็บเรือนแก้ว, ห้องพัสดุศาลา 1"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              {/* Condition */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">สภาพปัจจุบัน</label>
                <select
                  value={currentItem.condition || 'excellent'}
                  onChange={(e) => updateItemFormFields('condition', e.target.value as 'excellent' | 'good' | 'fair' | 'damaged')}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
                >
                  <option value="excellent">ดีเยี่ยม (ของใหม่มือหนึ่ง)</option>
                  <option value="good">ดีมาก (พร้อมใช้งานทั่วไป)</option>
                  <option value="fair">พอใช้ (เริ่มเสื่อมสภาพ)</option>
                  <option value="damaged">ชำรุด (ต้องซ่อมแซมใหญ่)</option>
                </select>
              </div>

              {/* Form buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t border-amber-100 dark:border-amber-950 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsItemModalOpen(false)}
                  className="py-2.5 px-4 text-xs font-bold border-amber-200 hover:bg-amber-500/10 text-amber-800 dark:text-amber-400 cursor-pointer"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-2.5 px-5 rounded-lg flex items-center gap-1 border-none shadow-md shadow-amber-500/10 cursor-pointer"
                >
                  {isSaving && <Loader2 className="size-3.5 animate-spin" />}
                  บันทึกข้อมูล
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register Borrow Modal */}
      {isBorrowModalOpen && currentBorrow && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#15110a] rounded-2xl border border-amber-200/50 dark:border-amber-950/40 shadow-2xl w-full max-w-md overflow-hidden animate-scale-up">
            <div className="h-1.5 bg-linear-to-r from-amber-400 to-amber-600" />
            <div className="p-6 border-b border-amber-100 dark:border-amber-950 flex justify-between items-center bg-amber-50/20 dark:bg-amber-950/5">
              <h3 className="font-bold text-base text-amber-900 dark:text-amber-200 font-heading">
                ลงสมุดบันทึกการยืมทรัพย์สินวัด
              </h3>
              <button
                onClick={() => setIsBorrowModalOpen(false)}
                className="p-1.5 rounded-lg text-amber-800 dark:text-amber-400 hover:bg-amber-500/10 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBorrow} className="p-6 space-y-4">
              {/* Borrower Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">ชื่อ-นามสกุล ผู้ยืม (ชาวบ้าน/ผู้นำชุมชน)</label>
                <input
                  type="text"
                  required
                  value={currentBorrow.borrower_name || ''}
                  onChange={(e) => updateBorrowFormFields('borrower_name', e.target.value)}
                  placeholder="ระบุชื่อจริง เช่น นายสมศักดิ์ สุขใจ"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              {/* Borrower Phone */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">เบอร์โทรติดต่อผู้ยืม</label>
                <input
                  type="text"
                  required
                  value={currentBorrow.borrower_phone || ''}
                  onChange={(e) => updateBorrowFormFields('borrower_phone', e.target.value)}
                  placeholder="08X-XXX-XXXX"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              {/* Select Item to Borrow */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">เลือกครุภัณฑ์ที่ต้องการยืม</label>
                <select
                  required
                  value={currentBorrow.item_id || ''}
                  onChange={(e) => updateBorrowFormFields('item_id', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
                >
                  <option value="">-- เลือกครุภัณฑ์ --</option>
                  {inventory.map((item) => (
                    <option key={item.id} value={item.id} disabled={item.available_qty <= 0}>
                      {item.name} (ในคลังเหลือ: {item.available_qty} ชิ้น)
                    </option>
                  ))}
                </select>
              </div>

              {/* Borrow Qty */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">จำนวนที่ต้องการยืม (ชิ้น)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={currentBorrow.borrow_qty || ''}
                  onChange={(e) => updateBorrowFormFields('borrow_qty', Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-950 bg-white dark:bg-[#110e08] text-amber-950 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Borrow Date */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">วันที่ยืมของ</label>
                  <ThaiDatePicker
                    required
                    value={currentBorrow.borrow_date || ''}
                    onChange={(val) => updateBorrowFormFields('borrow_date', val)}
                  />
                </div>

                {/* Due Date */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-amber-900/80 dark:text-amber-300">กำหนดส่งคืนวัด</label>
                  <ThaiDatePicker
                    required
                    value={currentBorrow.due_date || ''}
                    onChange={(val) => updateBorrowFormFields('due_date', val)}
                  />
                </div>
              </div>

              {/* Form buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t border-amber-100 dark:border-amber-950 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsBorrowModalOpen(false)}
                  className="py-2.5 px-4 text-xs font-bold border-amber-200 hover:bg-amber-500/10 text-amber-800 dark:text-amber-400 cursor-pointer"
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-2.5 px-5 rounded-lg flex items-center gap-1 border-none shadow-md shadow-amber-500/10 cursor-pointer"
                >
                  {isSaving && <Loader2 className="size-3.5 animate-spin" />}
                  บันทึกข้อมูล
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ImageLightbox src={lightboxImage} onClose={() => setLightboxImage(null)} />
    </div>
  );
}
