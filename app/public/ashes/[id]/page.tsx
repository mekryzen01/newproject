'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { db, AshesRecord, TempleSettings } from '@/lib/db';
import { formatThaiDate } from '@/lib/utils';
import { Loader2, Heart, Award, ShieldAlert, Sparkles, BookOpen } from 'lucide-react';

// Serene Buddhist Quotes on Impermanence & Virtue
const DHARMA_QUOTES = [
  {
    bali: 'รูปัง ชีระติ มัจจานัง นามะโคตตัง นะ ชีระติ',
    thai: 'ร่างกายของสัตว์ทั้งหลายย่อมร่วงโรยแตกดับไป แต่คุณงามความดีและชื่อเสียงเกียรติคุณหาได้สิ้นสูญเสื่อมสลายไปไม่'
  },
  {
    bali: 'อนิจจา วะตะ สังขารา อุปปาทะวะยะธัมมิโน',
    thai: 'สังขารทั้งหลายไม่เที่ยงหนอ มีความเกิดขึ้นและมีความเสื่อมสลายไปเป็นธรรมดา เมื่อเกิดขึ้นแล้วย่อมดับไป การระงับสังขารเหล่านั้นเสียได้เป็นสุข'
  },
  {
    bali: 'อัปปะมาเทนะ สัมปาเทถะ',
    thai: 'ท่านทั้งหลายจงยังประโยชน์ตนและประโยชน์ผู้อื่นให้ถึงพร้อมด้วยความไม่ประมาทเถิด'
  },
  {
    bali: 'ปุญญัง โจเรหิ ทูหะรัง',
    thai: 'บุญกุศลและคุณงามความดีที่ได้สั่งสมไว้ดีแล้ว โจรขโมยไม่สามารถแย่งชิงหรือลักเอาไปได้'
  }
];

export default function PublicAshesDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [record, setRecord] = React.useState<AshesRecord | null>(null);
  const [settings, setSettings] = React.useState<TempleSettings | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [quoteIndex, setQuoteIndex] = React.useState(0);

  React.useEffect(() => {
    // Select a stable random quote based on the record ID hash
    if (id) {
      let hash = 0;
      for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
      }
      setQuoteIndex(Math.abs(hash) % DHARMA_QUOTES.length);
    }
  }, [id]);

  React.useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [list, config] = await Promise.all([
          db.ashes.list(),
          db.settings.get()
        ]);
        const found = list.find(r => r.id === id);
        setRecord(found || null);
        setSettings(config || null);
      } catch (err) {
        console.error('Failed to load public ashes detail', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#110e08] flex flex-col items-center justify-center text-amber-500">
        <Loader2 className="size-10 animate-spin text-amber-500 mb-4" />
        <p className="text-sm font-bold tracking-wide animate-pulse">กำลังโหลดหน้าประวัติรำลึกความดี...</p>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="min-h-screen bg-[#110e08] flex flex-col items-center justify-center text-amber-500/80 p-6 text-center">
        <ShieldAlert className="size-16 text-red-500/80 mb-4 animate-bounce" />
        <h2 className="text-xl font-extrabold font-heading text-amber-100">ไม่พบประวัติอัฐิผู้วายชนม์</h2>
        <p className="text-xs text-amber-700/60 mt-2 max-w-sm">ข้อมูลนี้อาจถูกย้าย หรือลบออกจากระบบของทางวัดเรียบร้อยแล้ว</p>
      </div>
    );
  }

  const quote = DHARMA_QUOTES[quoteIndex];

  return (
    <div className="min-h-screen bg-[#0e0c08] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(197,160,89,0.12),rgba(0,0,0,0))] flex items-center justify-center p-4 sm:p-8 font-sans">
      {/* Decorative Gold Frame Wrapper */}
      <div className="max-w-xl w-full bg-[#181510] border-4 border-amber-600/40 rounded-3xl p-6 sm:p-10 relative overflow-hidden shadow-2xl shadow-amber-950/20">
        {/* Subtle Gold Corner Ornaments */}
        <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-amber-600/60 rounded-tl-lg" />
        <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-amber-600/60 rounded-tr-lg" />
        <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-amber-600/60 rounded-bl-lg" />
        <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-amber-600/60 rounded-br-lg" />

        {/* Serene Lotus Vector Graphic placeholder / icon */}
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-600/20 to-amber-700/30 flex items-center justify-center text-amber-400/90 shadow-inner border-2 border-amber-500/30 mb-6">
            {/* Serene Glowing Lotus Emblem */}
            <Sparkles className="size-10 animate-pulse" />
          </div>

          <span className="text-[10px] text-amber-500/60 tracking-[0.2em] uppercase font-bold">
            ประดิษฐาน ณ {settings?.templeName || 'ศาสนสถาน'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black font-heading text-amber-200 mt-2 tracking-wide">
            {record.deceased_name}
          </h1>
          <div className="w-28 h-0.5 bg-gradient-to-r from-transparent via-amber-600/60 to-transparent my-4" />
        </div>

        {/* Withdrawn status warning banner */}
        {record.status === 'withdrawn' && (
          <div className="mt-2 mb-4 p-4 bg-red-950/20 border border-red-500/35 rounded-2xl text-center text-xs space-y-1">
            <span className="font-bold text-red-400 block text-sm">🍂 อัญเชิญอัฐิถอนออกจากวัดแล้ว</span>
            <p className="text-amber-100/70 leading-relaxed text-[11px]">
              อัฐินี้ได้รับการทำพิธีอัญเชิญถอนออกจากตู้/ล็อกของวัดไปแล้ว<br />
              เมื่อวันที่ <strong>{record.withdraw_date ? formatThaiDate(record.withdraw_date) : '-'}</strong> โดยญาติผู้อัญเชิญ: <strong>{record.withdraw_by || '-'}</strong>
              {record.withdraw_reason && <span> ({record.withdraw_reason})</span>}
            </p>
          </div>
        )}

        {/* Biography timeline */}
        <div className="mt-6 bg-[#1f1b14] border border-amber-900/40 p-5 rounded-2xl space-y-4">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-amber-500/50 block font-semibold">วันชาตะ (เกิด)</span>
              <strong className="text-amber-100 font-bold">-</strong>
            </div>
            <div className="space-y-1 text-right">
              <span className="text-amber-500/50 block font-semibold">วันมรณะ (ละสังขาร)</span>
              <strong className="text-amber-100 font-bold">{formatThaiDate(record.death_date)}</strong>
            </div>
          </div>

          <div className="border-t border-amber-900/30 pt-3 text-xs grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-amber-500/50 block font-semibold">สถานที่สถิตอัฐิ</span>
              <strong className="text-amber-300 font-extrabold">ล็อก/ตู้ที่ {record.niche_code}</strong>
            </div>
            <div className="space-y-1 text-right">
              <span className="text-amber-500/50 block font-semibold">วันที่นำอัฐิฝากวัด</span>
              <strong className="text-amber-100 font-medium">{formatThaiDate(record.deposit_date)}</strong>
            </div>
          </div>

          <div className="border-t border-amber-900/30 pt-3 text-xs">
            <span className="text-amber-500/50 block font-semibold mb-1">ญาติผู้ดูแลประสานงาน</span>
            <div className="flex justify-between items-center bg-[#1c1811] px-3.5 py-2.5 rounded-lg border border-amber-950">
              <span className="font-semibold text-amber-100">{record.relative_name}</span>
              <span className="font-sans text-amber-400 font-bold">{record.relative_phone || '-'}</span>
            </div>
          </div>

          {record.notes && (
            <div className="border-t border-amber-900/30 pt-3 text-xs">
              <span className="text-amber-500/50 block font-semibold mb-1.5 flex items-center gap-1">
                <Award className="size-3.5 text-amber-500" />
                ประวัติคุณงามความดี / บันทึกรำลึก
              </span>
              <p className="text-amber-100/80 leading-relaxed bg-[#181510] p-3 rounded-lg border border-amber-950 font-medium text-[11px] whitespace-pre-line">
                {record.notes}
              </p>
            </div>
          )}
        </div>

        {/* Consolation Dharma quote card */}
        <div className="mt-6 border border-amber-900/30 bg-gradient-to-br from-[#1b1710] to-[#120f0a] p-5 rounded-2xl text-center space-y-3">
          <BookOpen className="size-5 text-amber-500 mx-auto" />
          <h4 className="text-[11px] text-amber-400 font-extrabold uppercase tracking-widest">
            {quote.bali}
          </h4>
          <p className="text-xs text-amber-100/60 leading-loose italic max-w-sm mx-auto font-medium">
            "{quote.thai}"
          </p>
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center text-[10px] text-amber-700/40 dark:text-amber-500/30 flex items-center justify-center gap-1">
          <span>ดูแลและจัดทำระบบโดย {settings?.templeName || 'วัดดงหนองเป็ด'}</span>
        </div>
      </div>
    </div>
  );
}
