from fastapi import FastAPI, APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import io
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'school_attendance_db')]

app = FastAPI(title="Sistem Absensi Sekolah API")


async def get_db():
    return db
api_router = APIRouter(prefix="/api")

# ============ MODELS ============
class Student(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nis: str
    name: str
    class_name: str
    gender: str
    photo_url: Optional[str] = ""
    qr_code: str = Field(default_factory=lambda: f"SCH-QR-{uuid.uuid4().hex[:10].upper()}")
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class StudentCreate(BaseModel):
    nis: str
    name: str
    class_name: str
    gender: str
    photo_url: Optional[str] = ""

class StudentUpdate(BaseModel):
    nis: Optional[str] = None
    name: Optional[str] = None
    class_name: Optional[str] = None
    gender: Optional[str] = None
    photo_url: Optional[str] = None

class AttendanceScanRequest(BaseModel):
    qr_code: Optional[str] = None
    nis: Optional[str] = None
    status: Optional[str] = "Hadir"
    mode: Optional[str] = "masuk"  # masuk / pulang
    recorded_by: Optional[str] = "Guru Piket"

class AttendanceManualRequest(BaseModel):
    student_id: str
    date: str
    status: str
    recorded_by: Optional[str] = "Admin"

class SubjectScanRequest(BaseModel):
    qr_code: Optional[str] = None
    nis: Optional[str] = None
    subject_name: str
    period: int
    teacher_name: str
    status: Optional[str] = "Hadir"

class ScheduleCreate(BaseModel):
    day: str  # Senin, Selasa, Rabu, Kamis, Jumat, Sabtu
    period: int
    class_name: str
    subject_name: str
    teacher_name: str
    start_time: str
    end_time: str
    room: Optional[str] = ""

class PiketCreate(BaseModel):
    date: str
    teacher_name: str
    notes: Optional[str] = ""

class LoginRequest(BaseModel):
    username: str
    password: str

# ============ SEED ============
@app.on_event("startup")
async def startup_db():
    try:
        await db.list_collection_names()
    except Exception as e:
        logging.warning(f"MongoDB not available at startup: {e}")
        return

    try:
        count = await db.students.count_documents({})
        if count == 0:
            sample_students = [
                {"id": str(uuid.uuid4()), "nis": "101", "name": "Ahmad Fauzi", "class_name": "X IPA 1", "gender": "L", "photo_url": "", "qr_code": "SCH-QR-FAUZI101", "created_at": datetime.now(timezone.utc).isoformat()},
                {"id": str(uuid.uuid4()), "nis": "102", "name": "Siti Rahma", "class_name": "X IPA 1", "gender": "P", "photo_url": "", "qr_code": "SCH-QR-RAHMA102", "created_at": datetime.now(timezone.utc).isoformat()},
                {"id": str(uuid.uuid4()), "nis": "103", "name": "Budi Santoso", "class_name": "X IPA 1", "gender": "L", "photo_url": "", "qr_code": "SCH-QR-BUDI103", "created_at": datetime.now(timezone.utc).isoformat()},
                {"id": str(uuid.uuid4()), "nis": "201", "name": "Dewi Lestari", "class_name": "XI IPS 2", "gender": "P", "photo_url": "", "qr_code": "SCH-QR-DEWI201", "created_at": datetime.now(timezone.utc).isoformat()},
                {"id": str(uuid.uuid4()), "nis": "202", "name": "Eko Prasetyo", "class_name": "XI IPS 2", "gender": "L", "photo_url": "", "qr_code": "SCH-QR-EKO202", "created_at": datetime.now(timezone.utc).isoformat()},
                {"id": str(uuid.uuid4()), "nis": "301", "name": "Rina Melati", "class_name": "XII MIPA", "gender": "P", "photo_url": "", "qr_code": "SCH-QR-RINA301", "created_at": datetime.now(timezone.utc).isoformat()},
            ]
            await db.students.insert_many(sample_students)

        # Seed schedule if empty
        if await db.schedules.count_documents({}) == 0:
            sched = [
                {"id": str(uuid.uuid4()), "day": "Senin", "period": 1, "class_name": "X IPA 1", "subject_name": "Matematika", "teacher_name": "Bu Ani", "start_time": "07:30", "end_time": "08:15", "room": "R101"},
                {"id": str(uuid.uuid4()), "day": "Senin", "period": 2, "class_name": "X IPA 1", "subject_name": "Fisika", "teacher_name": "Pak Rudi", "start_time": "08:15", "end_time": "09:00", "room": "Lab Fisika"},
                {"id": str(uuid.uuid4()), "day": "Senin", "period": 3, "class_name": "X IPA 1", "subject_name": "Bahasa Indonesia", "teacher_name": "Bu Dewi", "start_time": "09:15", "end_time": "10:00", "room": "R101"},
                {"id": str(uuid.uuid4()), "day": "Selasa", "period": 1, "class_name": "X IPA 1", "subject_name": "Kimia", "teacher_name": "Pak Herman", "start_time": "07:30", "end_time": "08:15", "room": "Lab Kimia"},
                {"id": str(uuid.uuid4()), "day": "Selasa", "period": 2, "class_name": "XI IPS 2", "subject_name": "Ekonomi", "teacher_name": "Bu Sinta", "start_time": "08:15", "end_time": "09:00", "room": "R202"},
                {"id": str(uuid.uuid4()), "day": "Rabu", "period": 1, "class_name": "XII MIPA", "subject_name": "Biologi", "teacher_name": "Pak Adi", "start_time": "07:30", "end_time": "08:15", "room": "Lab Bio"},
            ]
            await db.schedules.insert_many(sched)

        # Seed guru piket
        if await db.guru_piket.count_documents({}) == 0:
            today_str = datetime.now().strftime("%Y-%m-%d")
            await db.guru_piket.insert_one({
                "id": str(uuid.uuid4()),
                "date": today_str,
                "teacher_name": "Bu Ani Wijaya",
                "notes": "Piket harian - fokus kelas X"
            })
        logging.info("Seed done.")
    except Exception as e:
        logging.error(f"Seed error: {e}")

# ============ ROUTES ============
@api_router.get("/")
async def root():
    return {"message": "Sistem Absensi Sekolah API v2 - Multi-Feature"}

@api_router.post("/auth/login")
async def login(req: LoginRequest):
    if req.username == "admin" and req.password == "admin123":
        return {"success": True, "token": "admin-token", "role": "admin", "name": "Administrator Sekolah"}
    elif req.username == "guru" and req.password == "guru123":
        return {"success": True, "token": "teacher-token", "role": "teacher", "name": "Ibu Guru (Piket)"}
    elif req.username == "kepsek" and req.password == "kepsek123":
        return {"success": True, "token": "kepsek-token", "role": "admin", "name": "Kepala Sekolah"}
    else:
        raise HTTPException(status_code=401, detail="Username atau password salah.")

# ============ STUDENTS ============
@api_router.get("/students", response_model=List[Student])
async def get_students(class_name: Optional[str] = None, search: Optional[str] = None):
    query = {}
    if class_name and class_name != "Semua Kelas":
        query["class_name"] = class_name
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"nis": {"$regex": search, "$options": "i"}},
            {"qr_code": {"$regex": search, "$options": "i"}}
        ]
    students = await db.students.find(query, {"_id": 0}).to_list(1000)
    return students

@api_router.post("/students", response_model=Student)
async def create_student(input: StudentCreate):
    existing = await db.students.find_one({"nis": input.nis}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail=f"Siswa dengan NIS {input.nis} sudah terdaftar.")
    student_obj = Student(**input.model_dump())
    doc = student_obj.model_dump()
    await db.students.insert_one(doc)
    doc.pop("_id", None)
    return student_obj

@api_router.put("/students/{student_id}", response_model=Student)
async def update_student(student_id: str, input: StudentUpdate):
    student = await db.students.find_one({"id": student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Siswa tidak ditemukan.")
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    if update_data:
        await db.students.update_one({"id": student_id}, {"$set": update_data})
    updated = await db.students.find_one({"id": student_id}, {"_id": 0})
    return updated

@api_router.delete("/students/{student_id}")
async def delete_student(student_id: str):
    res = await db.students.delete_one({"id": student_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Siswa tidak ditemukan.")
    await db.attendance.delete_many({"student_id": student_id})
    await db.subject_attendance.delete_many({"student_id": student_id})
    return {"success": True, "message": "Siswa berhasil dihapus."}

@api_router.post("/students/seed-demo")
async def seed_demo_students():
    await db.students.delete_many({})
    await db.attendance.delete_many({})
    await db.subject_attendance.delete_many({})
    classes = ["X IPA 1", "X IPA 2", "XI IPS 1", "XI IPS 2", "XII MIPA"]
    names = [
        ("Ahmad Fauzi", "L"), ("Siti Rahma", "P"), ("Budi Santoso", "L"),
        ("Dewi Lestari", "P"), ("Eko Prasetyo", "L"), ("Rina Melati", "P"),
        ("Joko Widodo", "L"), ("Sri Mulyani", "P"), ("Andi Pratama", "L"),
        ("Maya Sari", "P"), ("Doni Kusuma", "L"), ("Siska Amelia", "P")
    ]
    seeded = []
    nis_counter = 1001
    for idx, (name, gender) in enumerate(names):
        cls = classes[idx % len(classes)]
        nis = str(nis_counter); nis_counter += 1
        qr = f"SCH-QR-{nis}-{name.split()[0].upper()}"
        stu = {"id": str(uuid.uuid4()), "nis": nis, "name": name, "class_name": cls,
               "gender": gender, "photo_url": "", "qr_code": qr,
               "created_at": datetime.now(timezone.utc).isoformat()}
        seeded.append(stu)
    await db.students.insert_many(seeded)
    return {"success": True, "message": f"Berhasil generate {len(seeded)} siswa demo.", "count": len(seeded)}

# ============ ATTENDANCE (MASUK & PULANG) ============
@api_router.post("/attendance/scan")
async def scan_attendance(req: AttendanceScanRequest):
    now = datetime.now()
    today_str = now.strftime("%Y-%m-%d")
    time_str = now.strftime("%H:%M:%S")
    identifier = req.qr_code or req.nis
    if not identifier:
        raise HTTPException(status_code=400, detail="QR Code atau NIS wajib diisi.")

    student = await db.students.find_one({"$or": [{"qr_code": identifier}, {"nis": identifier}]}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail=f"Siswa dengan kode/NIS '{identifier}' tidak ditemukan.")

    existing = await db.attendance.find_one({"student_id": student["id"], "date": today_str}, {"_id": 0})
    mode = req.mode or "masuk"

    if mode == "pulang":
        if not existing:
            raise HTTPException(status_code=400, detail=f"{student['name']} belum absen masuk hari ini, tidak bisa absen pulang.")
        if existing.get("time_out"):
            return {"success": True, "already": True,
                    "message": f"{student['name']} sudah absen PULANG pukul {existing['time_out']}.",
                    "student": student, "attendance": existing}
        await db.attendance.update_one(
            {"student_id": student["id"], "date": today_str},
            {"$set": {"time_out": time_str, "check_out_by": req.recorded_by or "Guru Piket"}}
        )
        updated = await db.attendance.find_one({"student_id": student["id"], "date": today_str}, {"_id": 0})
        return {"success": True, "already": False,
                "message": f"✅ {student['name']} tercatat PULANG pukul {time_str}.",
                "student": student, "attendance": updated}

    # mode == masuk
    if existing:
        return {"success": True, "already": True,
                "message": f"{student['name']} ({student['class_name']}) sudah tercatat HADIR pukul {existing['time']}.",
                "student": student, "attendance": existing}

    # Deteksi terlambat otomatis (setelah 07:15)
    status = req.status or "Hadir"
    if status == "Hadir" and time_str > "07:15:00":
        status = "Terlambat"

    att_record = {
        "id": str(uuid.uuid4()), "student_id": student["id"], "nis": student["nis"],
        "student_name": student["name"], "class_name": student["class_name"],
        "date": today_str, "time": time_str, "time_out": None, "status": status,
        "recorded_by": req.recorded_by or "Guru Piket",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.attendance.insert_one(att_record)
    att_record.pop("_id", None)
    return {"success": True, "already": False,
            "message": f"Berhasil catat kehadiran: {student['name']} ({student['class_name']}) - {status}",
            "student": student, "attendance": att_record}

@api_router.get("/attendance")
async def get_attendance(date: Optional[str] = None, class_name: Optional[str] = None,
                        status: Optional[str] = None, student_id: Optional[str] = None):
    query = {}
    if date: query["date"] = date
    if class_name and class_name != "Semua Kelas": query["class_name"] = class_name
    if status and status != "Semua Status": query["status"] = status
    if student_id: query["student_id"] = student_id
    records = await db.attendance.find(query, {"_id": 0}).sort("time", -1).to_list(2000)
    return records

@api_router.post("/attendance/manual")
async def manual_attendance(req: AttendanceManualRequest):
    student = await db.students.find_one({"id": req.student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Siswa tidak ditemukan.")
    today_str = req.date or datetime.now().strftime("%Y-%m-%d")
    time_str = datetime.now().strftime("%H:%M:%S")
    existing = await db.attendance.find_one({"student_id": req.student_id, "date": today_str}, {"_id": 0})
    if existing:
        await db.attendance.update_one({"student_id": req.student_id, "date": today_str},
            {"$set": {"status": req.status, "recorded_by": req.recorded_by or "Admin"}})
        updated = await db.attendance.find_one({"student_id": req.student_id, "date": today_str}, {"_id": 0})
        return {"success": True, "message": "Status diperbarui.", "attendance": updated}
    att_record = {"id": str(uuid.uuid4()), "student_id": student["id"], "nis": student["nis"],
                  "student_name": student["name"], "class_name": student["class_name"],
                  "date": today_str, "time": time_str, "time_out": None, "status": req.status,
                  "recorded_by": req.recorded_by or "Admin",
                  "created_at": datetime.now(timezone.utc).isoformat()}
    await db.attendance.insert_one(att_record)
    att_record.pop("_id", None)
    return {"success": True, "message": "Kehadiran dicatat.", "attendance": att_record}

@api_router.delete("/attendance/{id}")
async def delete_attendance(id: str):
    res = await db.attendance.delete_one({"id": id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Data tidak ditemukan.")
    return {"success": True, "message": "Terhapus."}

# ============ ABSENSI PER MATA PELAJARAN ============
@api_router.post("/subject-attendance/scan")
async def scan_subject_attendance(req: SubjectScanRequest):
    now = datetime.now()
    today_str = now.strftime("%Y-%m-%d")
    time_str = now.strftime("%H:%M:%S")
    identifier = req.qr_code or req.nis
    if not identifier:
        raise HTTPException(status_code=400, detail="QR Code atau NIS wajib diisi.")
    student = await db.students.find_one({"$or": [{"qr_code": identifier}, {"nis": identifier}]}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail=f"Siswa '{identifier}' tidak ditemukan.")

    existing = await db.subject_attendance.find_one({
        "student_id": student["id"], "date": today_str,
        "subject_name": req.subject_name, "period": req.period}, {"_id": 0})
    if existing:
        return {"success": True, "already": True,
                "message": f"{student['name']} sudah scan {req.subject_name} jam ke-{req.period} pukul {existing['time']}.",
                "student": student, "record": existing}

    record = {"id": str(uuid.uuid4()), "student_id": student["id"], "nis": student["nis"],
              "student_name": student["name"], "class_name": student["class_name"],
              "date": today_str, "time": time_str, "subject_name": req.subject_name,
              "period": req.period, "teacher_name": req.teacher_name, "status": req.status or "Hadir",
              "created_at": datetime.now(timezone.utc).isoformat()}
    await db.subject_attendance.insert_one(record)
    record.pop("_id", None)
    return {"success": True, "already": False,
            "message": f"✅ {student['name']} tercatat hadir di {req.subject_name} jam ke-{req.period}.",
            "student": student, "record": record}

@api_router.get("/subject-attendance")
async def get_subject_attendance(date: Optional[str] = None, class_name: Optional[str] = None,
                                subject_name: Optional[str] = None, period: Optional[int] = None):
    query = {}
    if date: query["date"] = date
    if class_name and class_name != "Semua Kelas": query["class_name"] = class_name
    if subject_name: query["subject_name"] = subject_name
    if period: query["period"] = period
    records = await db.subject_attendance.find(query, {"_id": 0}).sort("time", -1).to_list(3000)
    return records

# ============ JADWAL & GURU PIKET ============
@api_router.get("/schedules")
async def get_schedules(class_name: Optional[str] = None, day: Optional[str] = None):
    query = {}
    if class_name and class_name != "Semua Kelas": query["class_name"] = class_name
    if day: query["day"] = day
    records = await db.schedules.find(query, {"_id": 0}).sort("period", 1).to_list(500)
    return records

@api_router.post("/schedules")
async def create_schedule(req: ScheduleCreate):
    doc = req.model_dump()
    doc["id"] = str(uuid.uuid4())
    await db.schedules.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.delete("/schedules/{id}")
async def delete_schedule(id: str):
    res = await db.schedules.delete_one({"id": id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Jadwal tidak ditemukan.")
    return {"success": True}

@api_router.get("/guru-piket")
async def get_guru_piket(date: Optional[str] = None):
    query = {}
    if date: query["date"] = date
    records = await db.guru_piket.find(query, {"_id": 0}).sort("date", -1).to_list(200)
    return records

@api_router.post("/guru-piket")
async def create_piket(req: PiketCreate):
    doc = req.model_dump()
    doc["id"] = str(uuid.uuid4())
    await db.guru_piket.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.delete("/guru-piket/{id}")
async def delete_piket(id: str):
    res = await db.guru_piket.delete_one({"id": id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Data piket tidak ditemukan.")
    return {"success": True}

# ============ DASHBOARD STATS ============
@api_router.get("/dashboard/stats")
async def get_dashboard_stats(date: Optional[str] = None):
    target_date = date or datetime.now().strftime("%Y-%m-%d")
    total_students = await db.students.count_documents({})
    classes = await db.students.distinct("class_name")
    attendance_today = await db.attendance.find({"date": target_date}, {"_id": 0}).to_list(2000)
    hadir_count = sum(1 for a in attendance_today if a["status"] in ["Hadir", "Terlambat"])
    terlambat_count = sum(1 for a in attendance_today if a["status"] == "Terlambat")
    sakit_count = sum(1 for a in attendance_today if a["status"] == "Sakit")
    izin_count = sum(1 for a in attendance_today if a["status"] == "Izin")
    alpa_count = sum(1 for a in attendance_today if a["status"] == "Alpa")
    sudah_pulang = sum(1 for a in attendance_today if a.get("time_out"))

    piket = await db.guru_piket.find_one({"date": target_date}, {"_id": 0})
    return {
        "date": target_date, "total_students": total_students,
        "total_classes": len(classes), "classes": classes,
        "hadir": hadir_count, "terlambat": terlambat_count,
        "sakit": sakit_count, "izin": izin_count, "alpa": alpa_count,
        "sudah_pulang": sudah_pulang,
        "belum_absen": max(0, total_students - (hadir_count + sakit_count + izin_count + alpa_count)),
        "attendance_today": attendance_today,
        "guru_piket_hari_ini": piket
    }

# ============ EXPORT EXCEL ============
@api_router.get("/export/excel")
async def export_excel(date: Optional[str] = None, class_name: Optional[str] = None,
                       start_date: Optional[str] = None, end_date: Optional[str] = None):
    query = {}
    if date:
        query["date"] = date
    elif start_date and end_date:
        query["date"] = {"$gte": start_date, "$lte": end_date}
    if class_name and class_name != "Semua Kelas":
        query["class_name"] = class_name

    records = await db.attendance.find(query, {"_id": 0}).sort("date", -1).to_list(5000)

    wb = Workbook()
    ws = wb.active
    ws.title = "Rekap Kehadiran"

    # Header title
    ws.merge_cells('A1:H1')
    ws['A1'] = "REKAP KEHADIRAN SISWA - SISTEM ABSENSI SEKOLAH"
    ws['A1'].font = Font(bold=True, size=14, color="FFFFFF")
    ws['A1'].fill = PatternFill(start_color="4F46E5", end_color="4F46E5", fill_type="solid")
    ws['A1'].alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[1].height = 28

    filter_info = f"Tanggal: {date or (start_date + ' s/d ' + end_date if start_date else 'Semua')} | Kelas: {class_name or 'Semua'}"
    ws.merge_cells('A2:H2')
    ws['A2'] = filter_info
    ws['A2'].alignment = Alignment(horizontal="center")
    ws['A2'].font = Font(italic=True, size=10)

    headers = ["No", "Tanggal", "NIS", "Nama Siswa", "Kelas", "Jam Masuk", "Jam Pulang", "Status", "Pencatat"]
    for col_idx, h in enumerate(headers, 1):
        cell = ws.cell(row=4, column=col_idx, value=h)
        cell.font = Font(bold=True, color="FFFFFF")
        cell.fill = PatternFill(start_color="4F46E5", end_color="4F46E5", fill_type="solid")
        cell.alignment = Alignment(horizontal="center", vertical="center")

    thin = Side(border_style="thin", color="D1D5DB")
    border = Border(left=thin, right=thin, top=thin, bottom=thin)

    for idx, r in enumerate(records, start=5):
        row_data = [idx - 4, r.get("date", ""), r.get("nis", ""), r.get("student_name", ""),
                    r.get("class_name", ""), r.get("time", ""), r.get("time_out") or "-",
                    r.get("status", ""), r.get("recorded_by", "")]
        for col_idx, val in enumerate(row_data, 1):
            cell = ws.cell(row=idx, column=col_idx, value=val)
            cell.border = border
            cell.alignment = Alignment(horizontal="left" if col_idx in [4] else "center", vertical="center")

    widths = [5, 12, 10, 28, 14, 12, 12, 14, 20]
    for i, w in enumerate(widths, 1):
        ws.column_dimensions[chr(64 + i)].width = w

    # Summary
    total = len(records)
    hadir = sum(1 for r in records if r.get("status") in ["Hadir", "Terlambat"])
    sakit = sum(1 for r in records if r.get("status") == "Sakit")
    izin = sum(1 for r in records if r.get("status") == "Izin")
    alpa = sum(1 for r in records if r.get("status") == "Alpa")

    summary_row = len(records) + 6
    ws.cell(row=summary_row, column=1, value="RINGKASAN:").font = Font(bold=True)
    ws.cell(row=summary_row + 1, column=1, value=f"Total Data: {total}")
    ws.cell(row=summary_row + 1, column=3, value=f"Hadir: {hadir}")
    ws.cell(row=summary_row + 1, column=4, value=f"Sakit: {sakit}")
    ws.cell(row=summary_row + 1, column=5, value=f"Izin: {izin}")
    ws.cell(row=summary_row + 1, column=6, value=f"Alpa: {alpa}")

    stream = io.BytesIO()
    wb.save(stream)
    stream.seek(0)
    filename = f"rekap_kehadiran_{date or start_date or datetime.now().strftime('%Y%m%d')}.xlsx"
    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
