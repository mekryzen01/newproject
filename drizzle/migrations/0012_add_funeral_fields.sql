-- Migration: เพิ่มฟิลด์ข้อมูลจัดตั้งศพให้ตรงกับแบบฟอร์มกระดาษ "ทะเบียนแจ้งขอตั้งบำเพ็ญกุศลศพ"

-- ๑. ประวัติผู้เสียชีวิต (เพิ่มเติม)
ALTER TABLE funeral_arrangements ADD COLUMN IF NOT EXISTS deceased_id_card text;           -- เลขประจำตัวประชาชน
ALTER TABLE funeral_arrangements ADD COLUMN IF NOT EXISTS deceased_nationality text;       -- สัญชาติ
ALTER TABLE funeral_arrangements ADD COLUMN IF NOT EXISTS deceased_birthdate text;          -- วันเกิด (วัน/เดือน/พ.ศ.)
ALTER TABLE funeral_arrangements ADD COLUMN IF NOT EXISTS deceased_occupation text;         -- อาชีพ

-- ๒. รายละเอียดการเสียชีวิต
ALTER TABLE funeral_arrangements ADD COLUMN IF NOT EXISTS death_date text;                  -- เสียชีวิตเมื่อวันที่
ALTER TABLE funeral_arrangements ADD COLUMN IF NOT EXISTS death_time text;                  -- เวลาเสียชีวิต
ALTER TABLE funeral_arrangements ADD COLUMN IF NOT EXISTS death_cause text;                 -- สาเหตุการเสียชีวิต
ALTER TABLE funeral_arrangements ADD COLUMN IF NOT EXISTS death_location text;              -- สถานที่เสียชีวิต

-- ๓. รายละเอียดผู้แจ้ง
ALTER TABLE funeral_arrangements ADD COLUMN IF NOT EXISTS reporter_name text;               -- ชื่อ-นามสกุลผู้แจ้ง
ALTER TABLE funeral_arrangements ADD COLUMN IF NOT EXISTS reporter_age integer;             -- อายุผู้แจ้ง
ALTER TABLE funeral_arrangements ADD COLUMN IF NOT EXISTS reporter_relation text;           -- ความเกี่ยวข้องกับผู้เสียชีวิต
ALTER TABLE funeral_arrangements ADD COLUMN IF NOT EXISTS reporter_address text;            -- ที่อยู่ บ้านเลขที่
ALTER TABLE funeral_arrangements ADD COLUMN IF NOT EXISTS reporter_moo text;                -- หมู่บ้าน
ALTER TABLE funeral_arrangements ADD COLUMN IF NOT EXISTS reporter_tambon text;             -- ตำบล
ALTER TABLE funeral_arrangements ADD COLUMN IF NOT EXISTS reporter_amphoe text;             -- อำเภอ
ALTER TABLE funeral_arrangements ADD COLUMN IF NOT EXISTS reporter_province text;           -- จังหวัด
ALTER TABLE funeral_arrangements ADD COLUMN IF NOT EXISTS reporter_phone text;              -- เบอร์โทรศัพท์ผู้แจ้ง

-- เฉพาะเจ้าหน้าที่
ALTER TABLE funeral_arrangements ADD COLUMN IF NOT EXISTS chant_nights integer;             -- สวดอภิธรรม จำนวน...คืน
ALTER TABLE funeral_arrangements ADD COLUMN IF NOT EXISTS cremation_location text;          -- สถานที่ฌาปนกิจศพ
ALTER TABLE funeral_arrangements ADD COLUMN IF NOT EXISTS register_no text;                 -- ลำดับที่ (running number)
ALTER TABLE funeral_arrangements ADD COLUMN IF NOT EXISTS register_year integer;            -- ปี พ.ศ. ที่ลงทะเบียน
