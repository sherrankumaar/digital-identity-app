from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import secrets
import asyncio
import resend
from bson import ObjectId

ROOT_DIR = Path(__file__).parent

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Resend configuration
resend.api_key = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')

# JWT configuration
JWT_SECRET = os.environ.get('JWT_SECRET', secrets.token_hex(32))
JWT_ALGORITHM = "HS256"

# Create the main app
app = FastAPI(title="e-Identity Poland - Digital Identity Management System")

# Create routers
api_router = APIRouter(prefix="/api")
auth_router = APIRouter(prefix="/auth", tags=["Authentication"])
users_router = APIRouter(prefix="/users", tags=["Users"])
services_router = APIRouter(prefix="/services", tags=["Services"])
admin_router = APIRouter(prefix="/admin", tags=["Admin"])

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    pesel: Optional[str] = None
    date_of_birth: Optional[str] = None
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class OTPVerify(BaseModel):
    email: EmailStr
    otp: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    pesel: Optional[str] = None
    date_of_birth: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

class PasswordReset(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

class ComplaintCreate(BaseModel):
    title: str
    description: str
    category: str
    location: Optional[str] = None

class BankVerificationRequest(BaseModel):
    bank_name: str
    account_purpose: str

# ==================== HELPER FUNCTIONS ====================

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=24),
        "type": "access"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def generate_otp() -> str:
    return ''.join([str(secrets.randbelow(10)) for _ in range(6)])

async def send_otp_email(email: str, otp: str, name: str = "User"):
    """Send OTP via Resend email service"""
    html_content = f"""
    <div style="font-family: 'IBM Plex Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #09090b; padding: 40px; color: #fafafa;">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #ffffff; font-size: 24px; margin: 0;">e-Identity Poland</h1>
            <p style="color: #a1a1aa; font-size: 14px;">Digital Identity Management System</p>
        </div>
        <div style="background-color: #18181b; border: 1px solid #27272a; padding: 30px; text-align: center;">
            <p style="color: #a1a1aa; margin-bottom: 20px;">Hello {name},</p>
            <p style="color: #fafafa; margin-bottom: 20px;">Your verification code is:</p>
            <div style="background-color: #09090b; border: 2px solid #ffffff; padding: 20px; display: inline-block; margin: 20px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #ffffff;">{otp}</span>
            </div>
            <p style="color: #a1a1aa; font-size: 14px; margin-top: 20px;">This code expires in 10 minutes.</p>
            <p style="color: #a1a1aa; font-size: 12px; margin-top: 30px;">If you didn't request this code, please ignore this email.</p>
        </div>
        <p style="color: #71717a; font-size: 12px; text-align: center; margin-top: 30px;">
            © 2026 e-Identity Poland. All rights reserved.
        </p>
    </div>
    """
    
    params = {
        "from": SENDER_EMAIL,
        "to": [email],
        "subject": "Your e-Identity Verification Code",
        "html": html_content
    }
    
    try:
        result = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"OTP email sent to {email}, email_id: {result.get('id')}")
        return True
    except Exception as e:
        logger.error(f"Failed to send OTP email: {str(e)}")
        return False

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_admin_user(request: Request) -> dict:
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ==================== AUTH ENDPOINTS ====================

@auth_router.post("/register")
async def register(user_data: UserCreate, response: Response):
    email = user_data.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Generate OTP
    otp = generate_otp()
    otp_expires = datetime.now(timezone.utc) + timedelta(minutes=10)
    
    # Store pending registration
    pending_user = {
        "email": email,
        "password_hash": hash_password(user_data.password),
        "name": user_data.name,
        "pesel": user_data.pesel,
        "date_of_birth": user_data.date_of_birth,
        "phone": user_data.phone,
        "otp": otp,
        "otp_expires": otp_expires.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.pending_registrations.delete_many({"email": email})
    await db.pending_registrations.insert_one(pending_user)
    
    # Send OTP email
    email_sent = await send_otp_email(email, otp, user_data.name)
    
    return {
        "message": "Registration initiated. Please verify your email with the OTP sent.",
        "email": email,
        "otp_sent": email_sent
    }

@auth_router.post("/verify-otp")
async def verify_otp(data: OTPVerify, response: Response):
    email = data.email.lower()
    pending = await db.pending_registrations.find_one({"email": email})
    
    if not pending:
        raise HTTPException(status_code=400, detail="No pending registration found")
    
    if pending.get("otp") != data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    otp_expires = datetime.fromisoformat(pending["otp_expires"])
    if datetime.now(timezone.utc) > otp_expires:
        raise HTTPException(status_code=400, detail="OTP expired")
    
    # Create user
    user_doc = {
        "email": pending["email"],
        "password_hash": pending["password_hash"],
        "name": pending["name"],
        "pesel": pending.get("pesel") or generate_mock_pesel(),
        "date_of_birth": pending.get("date_of_birth") or "1990-01-15",
        "phone": pending.get("phone"),
        "address": None,
        "role": "user",
        "verified": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    # Clean up pending registration
    await db.pending_registrations.delete_one({"email": email})
    
    # Generate mock data for the user
    await generate_user_mock_data(user_id, user_doc["name"])
    
    # Create tokens
    access_token = create_access_token(user_id, email, "user")
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=86400, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    return {
        "message": "Email verified successfully",
        "user": {
            "_id": user_id,
            "email": email,
            "name": user_doc["name"],
            "role": "user"
        },
        "access_token": access_token
    }

@auth_router.post("/login")
async def login(user_data: UserLogin, response: Response, request: Request):
    email = user_data.email.lower()
    
    # Check brute force
    client_ip = request.client.host if request.client else "unknown"
    identifier = f"{client_ip}:{email}"
    
    attempts = await db.login_attempts.find_one({"identifier": identifier})
    if attempts and attempts.get("count", 0) >= 5:
        lockout_until = datetime.fromisoformat(attempts["lockout_until"])
        if datetime.now(timezone.utc) < lockout_until:
            raise HTTPException(status_code=429, detail="Too many failed attempts. Try again in 15 minutes.")
        else:
            await db.login_attempts.delete_one({"identifier": identifier})
    
    user = await db.users.find_one({"email": email})
    if not user:
        await increment_login_attempts(identifier)
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(user_data.password, user["password_hash"]):
        await increment_login_attempts(identifier)
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Clear failed attempts
    await db.login_attempts.delete_one({"identifier": identifier})
    
    user_id = str(user["_id"])
    access_token = create_access_token(user_id, email, user.get("role", "user"))
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=86400, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    return {
        "message": "Login successful",
        "user": {
            "_id": user_id,
            "email": user["email"],
            "name": user["name"],
            "role": user.get("role", "user"),
            "pesel": user.get("pesel"),
            "date_of_birth": user.get("date_of_birth")
        },
        "access_token": access_token
    }

async def increment_login_attempts(identifier: str):
    attempts = await db.login_attempts.find_one({"identifier": identifier})
    if attempts:
        new_count = attempts.get("count", 0) + 1
        update = {"$set": {"count": new_count}}
        if new_count >= 5:
            update["$set"]["lockout_until"] = (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()
        await db.login_attempts.update_one({"identifier": identifier}, update)
    else:
        await db.login_attempts.insert_one({
            "identifier": identifier,
            "count": 1,
            "created_at": datetime.now(timezone.utc).isoformat()
        })

@auth_router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Logged out successfully"}

@auth_router.get("/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return user

@auth_router.post("/resend-otp")
async def resend_otp(data: PasswordReset):
    email = data.email.lower()
    pending = await db.pending_registrations.find_one({"email": email})
    
    if not pending:
        raise HTTPException(status_code=400, detail="No pending registration found")
    
    otp = generate_otp()
    otp_expires = datetime.now(timezone.utc) + timedelta(minutes=10)
    
    await db.pending_registrations.update_one(
        {"email": email},
        {"$set": {"otp": otp, "otp_expires": otp_expires.isoformat()}}
    )
    
    email_sent = await send_otp_email(email, otp, pending.get("name", "User"))
    
    return {"message": "New OTP sent", "otp_sent": email_sent}

# ==================== USER ENDPOINTS ====================

@users_router.get("/profile")
async def get_profile(request: Request):
    user = await get_current_user(request)
    return user

@users_router.put("/profile")
async def update_profile(data: UserUpdate, request: Request):
    user = await get_current_user(request)
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if update_data:
        await db.users.update_one(
            {"_id": ObjectId(user["_id"])},
            {"$set": update_data}
        )
    
    updated_user = await db.users.find_one({"_id": ObjectId(user["_id"])}, {"_id": 0, "password_hash": 0})
    updated_user["_id"] = user["_id"]
    return updated_user

# ==================== MOCK DATA GENERATORS ====================

def generate_mock_pesel() -> str:
    """Generate a mock PESEL number"""
    import random
    year = random.randint(80, 99)
    month = random.randint(1, 12)
    day = random.randint(1, 28)
    serial = random.randint(1000, 9999)
    control = random.randint(0, 9)
    return f"{year:02d}{month:02d}{day:02d}{serial}{control}"

async def generate_user_mock_data(user_id: str, name: str):
    """Generate mock data for a new user"""
    
    # Health records
    health_records = [
        {
            "user_id": user_id,
            "record_id": str(uuid.uuid4()),
            "type": "visit",
            "date": "2025-11-15",
            "hospital": "Szpital Kliniczny w Warszawie",
            "doctor": "Dr. Anna Kowalska",
            "diagnosis": "Routine checkup - all results normal",
            "prescriptions": ["Vitamin D 2000IU"]
        },
        {
            "user_id": user_id,
            "record_id": str(uuid.uuid4()),
            "type": "vaccination",
            "date": "2025-09-20",
            "hospital": "Centrum Medyczne Medicover",
            "doctor": "Dr. Piotr Nowak",
            "diagnosis": "Flu vaccination",
            "prescriptions": []
        },
        {
            "user_id": user_id,
            "record_id": str(uuid.uuid4()),
            "type": "lab_test",
            "date": "2025-08-10",
            "hospital": "Laboratorium Diagnostyczne ALAB",
            "doctor": "Dr. Maria Wiśniewska",
            "diagnosis": "Blood test - complete blood count",
            "results": {"hemoglobin": "14.5 g/dL", "wbc": "7.2 K/uL", "platelets": "250 K/uL"}
        }
    ]
    await db.health_records.insert_many(health_records)
    
    # Pension records
    pension_record = {
        "user_id": user_id,
        "account_number": f"ZUS-{secrets.token_hex(4).upper()}",
        "total_contributions": 125000.00,
        "years_of_service": 15,
        "estimated_monthly_pension": 3200.00,
        "retirement_age": 65,
        "contribution_history": [
            {"year": 2024, "amount": 12000.00, "employer": "Tech Corp Sp. z o.o."},
            {"year": 2023, "amount": 11500.00, "employer": "Tech Corp Sp. z o.o."},
            {"year": 2022, "amount": 10800.00, "employer": "Digital Solutions S.A."},
            {"year": 2021, "amount": 10200.00, "employer": "Digital Solutions S.A."},
            {"year": 2020, "amount": 9600.00, "employer": "StartUp Polska"}
        ]
    }
    await db.pension_records.insert_one(pension_record)
    
    # Police records (summons/fines)
    police_records = [
        {
            "user_id": user_id,
            "record_id": str(uuid.uuid4()),
            "type": "fine",
            "date": "2025-06-15",
            "description": "Speeding - 65 km/h in 50 km/h zone",
            "amount": 500.00,
            "status": "paid",
            "location": "ul. Marszałkowska, Warszawa"
        },
        {
            "user_id": user_id,
            "record_id": str(uuid.uuid4()),
            "type": "summons",
            "date": "2025-10-20",
            "description": "Witness testimony required - Case #2025/WA/4521",
            "court": "Sąd Rejonowy dla Warszawy-Mokotowa",
            "hearing_date": "2026-02-15",
            "status": "pending"
        }
    ]
    await db.police_records.insert_many(police_records)
    
    # Bank verifications
    bank_verification = {
        "user_id": user_id,
        "verification_id": str(uuid.uuid4()),
        "bank_name": "PKO Bank Polski",
        "status": "verified",
        "verified_at": "2025-10-01",
        "account_type": "personal"
    }
    await db.bank_verifications.insert_one(bank_verification)

# ==================== SERVICES ENDPOINTS ====================

# Health Services
@services_router.get("/health/records")
async def get_health_records(request: Request):
    user = await get_current_user(request)
    records = await db.health_records.find({"user_id": user["_id"]}, {"_id": 0}).to_list(100)
    return {"records": records}

@services_router.get("/health/records/{record_id}")
async def get_health_record(record_id: str, request: Request):
    user = await get_current_user(request)
    record = await db.health_records.find_one({"user_id": user["_id"], "record_id": record_id}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    return record

# Pension Services
@services_router.get("/pension/account")
async def get_pension_account(request: Request):
    user = await get_current_user(request)
    record = await db.pension_records.find_one({"user_id": user["_id"]}, {"_id": 0})
    if not record:
        # Generate mock data if not exists
        await generate_user_mock_data(user["_id"], user["name"])
        record = await db.pension_records.find_one({"user_id": user["_id"]}, {"_id": 0})
    return record

@services_router.get("/pension/contributions")
async def get_pension_contributions(request: Request):
    user = await get_current_user(request)
    record = await db.pension_records.find_one({"user_id": user["_id"]}, {"_id": 0})
    if not record:
        return {"contributions": []}
    return {"contributions": record.get("contribution_history", [])}

# Police Services
@services_router.get("/police/records")
async def get_police_records(request: Request):
    user = await get_current_user(request)
    records = await db.police_records.find({"user_id": user["_id"]}, {"_id": 0}).to_list(100)
    return {"records": records}

@services_router.post("/police/complaints")
async def create_complaint(data: ComplaintCreate, request: Request):
    user = await get_current_user(request)
    
    complaint = {
        "complaint_id": str(uuid.uuid4()),
        "user_id": user["_id"],
        "user_name": user["name"],
        "title": data.title,
        "description": data.description,
        "category": data.category,
        "location": data.location,
        "status": "submitted",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "reference_number": f"KP/{datetime.now().year}/{secrets.token_hex(4).upper()}"
    }
    
    await db.police_complaints.insert_one(complaint)
    
    return {
        "message": "Complaint submitted successfully",
        "reference_number": complaint["reference_number"],
        "complaint_id": complaint["complaint_id"]
    }

@services_router.get("/police/complaints")
async def get_complaints(request: Request):
    user = await get_current_user(request)
    complaints = await db.police_complaints.find({"user_id": user["_id"]}, {"_id": 0}).to_list(100)
    return {"complaints": complaints}

# Bank Verification Services
@services_router.get("/bank/verifications")
async def get_bank_verifications(request: Request):
    user = await get_current_user(request)
    verifications = await db.bank_verifications.find({"user_id": user["_id"]}, {"_id": 0}).to_list(100)
    return {"verifications": verifications}

@services_router.post("/bank/verify")
async def request_bank_verification(data: BankVerificationRequest, request: Request):
    user = await get_current_user(request)
    
    verification = {
        "verification_id": str(uuid.uuid4()),
        "user_id": user["_id"],
        "bank_name": data.bank_name,
        "account_purpose": data.account_purpose,
        "status": "pending",
        "requested_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.bank_verifications.insert_one(verification)
    
    # Simulate approval after creation (in real system this would be async)
    await db.bank_verifications.update_one(
        {"verification_id": verification["verification_id"]},
        {"$set": {"status": "verified", "verified_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {
        "message": "Identity verification successful",
        "verification_id": verification["verification_id"],
        "status": "verified"
    }

# Government Services
@services_router.get("/government/services")
async def get_government_services(request: Request):
    await get_current_user(request)
    
    services = [
        {
            "id": "tax",
            "name": "Tax Services",
            "name_pl": "Usługi Podatkowe",
            "description": "Access tax declarations and payments",
            "description_pl": "Dostęp do deklaracji i płatności podatkowych",
            "status": "available"
        },
        {
            "id": "documents",
            "name": "Document Services",
            "name_pl": "Usługi Dokumentów",
            "description": "Request official documents and certificates",
            "description_pl": "Wnioskuj o oficjalne dokumenty i zaświadczenia",
            "status": "available"
        },
        {
            "id": "social",
            "name": "Social Benefits",
            "name_pl": "Świadczenia Społeczne",
            "description": "Apply for social benefits and assistance",
            "description_pl": "Wnioskuj o świadczenia i pomoc społeczną",
            "status": "available"
        },
        {
            "id": "registry",
            "name": "Civil Registry",
            "name_pl": "Urząd Stanu Cywilnego",
            "description": "Birth, marriage, and death certificates",
            "description_pl": "Akty urodzenia, małżeństwa i zgonu",
            "status": "available"
        }
    ]
    
    return {"services": services}

# ==================== ADMIN ENDPOINTS ====================

@admin_router.get("/users")
async def admin_get_users(request: Request):
    await get_admin_user(request)
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    
    # Add _id back as string
    all_users = await db.users.find({}).to_list(1000)
    for i, user in enumerate(all_users):
        users[i]["_id"] = str(user["_id"])
    
    return {"users": users}

@admin_router.get("/users/{user_id}")
async def admin_get_user(user_id: str, request: Request):
    await get_admin_user(request)
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user["_id"] = str(user["_id"])
    user.pop("password_hash", None)
    return user

@admin_router.delete("/users/{user_id}")
async def admin_delete_user(user_id: str, request: Request):
    admin = await get_admin_user(request)
    
    if admin["_id"] == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    result = await db.users.delete_one({"_id": ObjectId(user_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Clean up user data
    await db.health_records.delete_many({"user_id": user_id})
    await db.pension_records.delete_many({"user_id": user_id})
    await db.police_records.delete_many({"user_id": user_id})
    await db.police_complaints.delete_many({"user_id": user_id})
    await db.bank_verifications.delete_many({"user_id": user_id})
    
    return {"message": "User deleted successfully"}

@admin_router.put("/users/{user_id}/role")
async def admin_update_user_role(user_id: str, request: Request):
    await get_admin_user(request)
    body = await request.json()
    new_role = body.get("role")
    
    if new_role not in ["user", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    result = await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"role": new_role}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": f"User role updated to {new_role}"}

@admin_router.get("/stats")
async def admin_get_stats(request: Request):
    await get_admin_user(request)
    
    total_users = await db.users.count_documents({})
    admin_users = await db.users.count_documents({"role": "admin"})
    total_complaints = await db.police_complaints.count_documents({})
    pending_complaints = await db.police_complaints.count_documents({"status": "submitted"})
    total_verifications = await db.bank_verifications.count_documents({})
    
    return {
        "total_users": total_users,
        "admin_users": admin_users,
        "regular_users": total_users - admin_users,
        "total_complaints": total_complaints,
        "pending_complaints": pending_complaints,
        "total_bank_verifications": total_verifications
    }

@admin_router.get("/complaints")
async def admin_get_all_complaints(request: Request):
    await get_admin_user(request)
    complaints = await db.police_complaints.find({}, {"_id": 0}).to_list(1000)
    return {"complaints": complaints}

@admin_router.put("/complaints/{complaint_id}/status")
async def admin_update_complaint_status(complaint_id: str, request: Request):
    await get_admin_user(request)
    body = await request.json()
    new_status = body.get("status")
    
    if new_status not in ["submitted", "under_review", "resolved", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    result = await db.police_complaints.update_one(
        {"complaint_id": complaint_id},
        {"$set": {"status": new_status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    return {"message": f"Complaint status updated to {new_status}"}

# ==================== ROOT ENDPOINT ====================

@api_router.get("/")
async def root():
    return {"message": "e-Identity Poland API", "version": "1.0.0"}

# ==================== STARTUP EVENT ====================

@app.on_event("startup")
async def startup_event():
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.pending_registrations.create_index("email")
    await db.health_records.create_index("user_id")
    await db.pension_records.create_index("user_id")
    await db.police_records.create_index("user_id")
    await db.police_complaints.create_index("user_id")
    await db.bank_verifications.create_index("user_id")
    
    # Seed admin user
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@eidentity.pl")
    admin_password = os.environ.get("ADMIN_PASSWORD", "Admin123!")
    
    existing_admin = await db.users.find_one({"email": admin_email})
    if not existing_admin:
        admin_user = {
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "System Administrator",
            "pesel": "00000000000",
            "date_of_birth": "1985-01-01",
            "role": "admin",
            "verified": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_user)
        logger.info(f"Admin user created: {admin_email}")
    elif not verify_password(admin_password, existing_admin["password_hash"]):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password)}}
        )
        logger.info(f"Admin password updated: {admin_email}")
    
    # Write test credentials
    os.makedirs("/app/memory", exist_ok=True)
    with open("/app/memory/test_credentials.md", "w") as f:
        f.write("# Test Credentials\n\n")
        f.write("## Admin Account\n")
        f.write(f"- Email: {admin_email}\n")
        f.write(f"- Password: {admin_password}\n")
        f.write("- Role: admin\n\n")
        f.write("## Auth Endpoints\n")
        f.write("- POST /api/auth/register\n")
        f.write("- POST /api/auth/verify-otp\n")
        f.write("- POST /api/auth/login\n")
        f.write("- POST /api/auth/logout\n")
        f.write("- GET /api/auth/me\n")
    
    logger.info("e-Identity Poland API started successfully")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# Include routers
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(services_router)
api_router.include_router(admin_router)
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get("FRONTEND_URL", "http://localhost:3000"), "https://e-identity-pl.preview.emergentagent.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
