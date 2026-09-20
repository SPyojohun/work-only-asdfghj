# Soundboard สำหรับละครและการแสดง

เว็บ Soundboard แบบ Static สำหรับเปิดเสียงประกอบละครของนักเรียน ใช้ได้บนคอมพิวเตอร์และมือถือโดยไม่ต้องมีบัญชีผู้ใช้ เซิร์ฟเวอร์ ฐานข้อมูล หรือบริการเสียเงิน

## ความสามารถ

- Card เสียงขนาดใหญ่ กดง่าย และเล่นหลายเสียงพร้อมกันได้
- ค้นหาและกรองตามหมวดหมู่
- Keyboard shortcut ที่กำหนดจาก `sounds.json`
- ปรับระดับเสียงรวม และปุ่ม STOP ALL
- หน้า Sounds สำหรับตรวจสอบรายการ configuration และหน้า Guide สำหรับผู้เริ่มต้น
- Responsive สำหรับมือถือ พร้อมเมนูแบบ drawer
- แจ้งข้อผิดพลาดกรณี JSON หรือไฟล์เสียงมีปัญหา โดยไม่ทำให้เสียงอื่นหยุดทำงาน

## โครงสร้างโปรเจกต์

```text
.
├── index.html       # โครงสร้างเว็บไซต์
├── style.css        # หน้าตาและ responsive layout
├── script.js        # การทำงานของ Soundboard
├── sounds.json      # รายการเสียงและการตั้งค่า
└── sounds/          # ใส่ไฟล์ MP3/WAV จริงไว้ที่นี่
```

ผู้ใช้ทั่วไปควรแก้เฉพาะ `sounds.json` และเพิ่มหรือลบไฟล์ใน `sounds/` เท่านั้น ไม่ต้องแก้ `script.js`

## วิธีเพิ่มเสียง

1. เตรียมไฟล์เสียง MP3 (แนะนำ 128–192 kbps) หรือ WAV
2. ใส่ไฟล์ไว้ในโฟลเดอร์ `sounds/` เช่น `sounds/door.mp3`
3. เพิ่มรายการใน array `sounds` ของ `sounds.json`

```json
{
  "id": "door",
  "name": "เสียงประตูปิด",
  "file": "sounds/door.mp3",
  "category": "เอฟเฟกต์",
  "shortcut": "7"
}
```

ค่า `id` และ `shortcut` ต้องไม่ซ้ำกับรายการอื่น หากใช้ WAV โปรดทราบว่าไฟล์จะใหญ่กว่า MP3 และอาจทำให้เว็บโหลดช้าลง

## วิธีลบเสียง

1. ลบไฟล์เสียงออกจาก `sounds/`
2. ลบ object ของเสียงนั้นออกจาก array `sounds` ใน `sounds.json`
3. Commit และ Push การเปลี่ยนแปลงขึ้น GitHub

## การปรับ Card และ Shortcut

แก้ค่าต่อไปนี้ใน `sounds.json` แล้วเปิดเว็บใหม่:

- `name` — ชื่อที่แสดงบน Card
- `file` — path ของไฟล์เสียงแบบ relative เช่น `sounds/boom.mp3`
- `category` — หมวดหมู่ที่ใช้กรอง Card
- `shortcut` — ปุ่มบนคีย์บอร์ด เช่น `1`, `Q` หรือ `Space`

## การ Deploy ด้วย GitHub Pages

1. สร้าง repository ใหม่บน GitHub
2. อัปโหลดไฟล์และโฟลเดอร์ทั้งหมดในโปรเจกต์นี้ รวมถึงไฟล์เสียงที่ต้องการใช้งาน
3. ไปที่ **Settings → Pages**
4. เลือก **Deploy from a branch**
5. เลือก branch `main` และ folder `/ (root)`
6. กด **Save** แล้วรอ URL จาก GitHub Pages

เว็บไซต์ใช้ relative path (`./sounds.json` และ `sounds/...`) จึงใช้ได้กับ URL แบบ `https://username.github.io/repository-name/`

## วิธีใช้วันแสดง

เปิด URL และตรวจสอบเสียงให้พร้อมก่อนเริ่มงาน กด Card เพื่อเล่นเสียง ใช้ shortcut บน Desktop และกด STOP ALL เมื่อจำเป็น ทุกคนที่เปิด URL เดียวกันจะเห็นรายการและชื่อ Card ชุดเดียวกัน เพราะอ่านจากไฟล์ใน GitHub repository เดียวกัน

## แก้ปัญหา

- **Unable to load sound configuration:** ตรวจ syntax ของ `sounds.json` และให้แน่ใจว่า deploy ไฟล์นี้ขึ้น GitHub แล้ว
- **FILE NOT FOUND:** ตรวจชื่อไฟล์ ตัวพิมพ์ใหญ่–เล็ก และ path ใน `file` ให้ตรงกับไฟล์จริง
- **เสียงไม่ออกบนมือถือ:** แตะ Card อย่างน้อยหนึ่งครั้งหลังเปิดหน้า และตรวจระดับเสียงของเครื่องกับแอป
- **เปิด `index.html` จากเครื่องแล้วโหลด JSON ไม่ได้:** ให้ทดสอบบน GitHub Pages หรือ local web server เพราะเบราว์เซอร์บางตัวไม่อนุญาต `fetch()` จากไฟล์ในเครื่อง

## หมายเหตุ

โปรเจกต์นี้เป็น Static Website ไม่มี backend หรือ database ดังนั้นไฟล์เสียงที่ต้องการให้ทุกคนเห็น ต้องถูก commit เข้า GitHub repository ด้วยเสมอ
