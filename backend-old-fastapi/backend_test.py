import requests
import sys
from datetime import datetime

class SchoolAttendanceAPITester:
    def __init__(self, base_url="https://attendance-hub-1107.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_student_id = None
        self.test_qr_code = None

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except Exception:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        success, response = self.run_test(
            "Root API Endpoint",
            "GET",
            "api/",
            200
        )
        return success

    def test_admin_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "api/auth/login",
            200,
            data={"username": "admin", "password": "admin123"}
        )
        if success and response.get('success') and response.get('role') == 'admin':
            print(f"   ✓ Admin logged in as: {response.get('name')}")
            return True
        return False

    def test_teacher_login(self):
        """Test teacher login"""
        success, response = self.run_test(
            "Teacher Login",
            "POST",
            "api/auth/login",
            200,
            data={"username": "guru", "password": "guru123"}
        )
        if success and response.get('success') and response.get('role') == 'teacher':
            print(f"   ✓ Teacher logged in as: {response.get('name')}")
            return True
        return False

    def test_invalid_login(self):
        """Test invalid login credentials"""
        success, response = self.run_test(
            "Invalid Login (Should Fail)",
            "POST",
            "api/auth/login",
            401,
            data={"username": "invalid", "password": "wrong"}
        )
        return success

    def test_get_students(self):
        """Test getting all students"""
        success, response = self.run_test(
            "Get All Students",
            "GET",
            "api/students",
            200
        )
        if success and isinstance(response, list):
            print(f"   ✓ Found {len(response)} students")
            if len(response) > 0:
                self.test_student_id = response[0].get('id')
                self.test_qr_code = response[0].get('qr_code')
                print(f"   ✓ Sample student: {response[0].get('name')} (NIS: {response[0].get('nis')})")
            return True
        return False

    def test_get_students_by_class(self):
        """Test filtering students by class"""
        success, response = self.run_test(
            "Get Students by Class Filter",
            "GET",
            "api/students",
            200,
            params={"class_name": "X IPA 1"}
        )
        if success and isinstance(response, list):
            print(f"   ✓ Found {len(response)} students in X IPA 1")
            return True
        return False

    def test_search_students(self):
        """Test searching students"""
        success, response = self.run_test(
            "Search Students by Name",
            "GET",
            "api/students",
            200,
            params={"search": "Ahmad"}
        )
        if success and isinstance(response, list):
            print(f"   ✓ Search returned {len(response)} results")
            return True
        return False

    def test_create_student(self):
        """Test creating a new student"""
        timestamp = datetime.now().strftime("%H%M%S")
        success, response = self.run_test(
            "Create New Student",
            "POST",
            "api/students",
            200,
            data={
                "nis": f"TEST{timestamp}",
                "name": f"Test Student {timestamp}",
                "class_name": "X IPA 1",
                "gender": "L"
            }
        )
        if success and response.get('id'):
            self.test_student_id = response.get('id')
            self.test_qr_code = response.get('qr_code')
            print(f"   ✓ Created student with ID: {self.test_student_id}")
            print(f"   ✓ Generated QR Code: {self.test_qr_code}")
            return True
        return False

    def test_create_duplicate_student(self):
        """Test creating duplicate student (should fail)"""
        success, response = self.run_test(
            "Create Duplicate Student (Should Fail)",
            "POST",
            "api/students",
            400,
            data={
                "nis": "101",  # Existing NIS from seed data
                "name": "Duplicate Test",
                "class_name": "X IPA 1",
                "gender": "L"
            }
        )
        return success

    def test_update_student(self):
        """Test updating a student"""
        if not self.test_student_id:
            print("   ⚠️  Skipped - No test student ID available")
            return True
        
        success, response = self.run_test(
            "Update Student",
            "PUT",
            f"api/students/{self.test_student_id}",
            200,
            data={"name": "Updated Test Student"}
        )
        if success and response.get('name') == "Updated Test Student":
            print(f"   ✓ Student updated successfully")
            return True
        return False

    def test_scan_attendance_qr(self):
        """Test scanning attendance with QR code"""
        if not self.test_qr_code:
            print("   ⚠️  Skipped - No test QR code available")
            return True
        
        success, response = self.run_test(
            "Scan Attendance with QR Code",
            "POST",
            "api/attendance/scan",
            200,
            data={
                "qr_code": self.test_qr_code,
                "status": "Hadir",
                "recorded_by": "Test Guru"
            }
        )
        if success and response.get('success'):
            print(f"   ✓ Attendance recorded: {response.get('message')}")
            return True
        return False

    def test_scan_attendance_nis(self):
        """Test scanning attendance with NIS"""
        success, response = self.run_test(
            "Scan Attendance with NIS",
            "POST",
            "api/attendance/scan",
            200,
            data={
                "nis": "101",  # Using seed data NIS
                "status": "Hadir",
                "recorded_by": "Test Guru"
            }
        )
        if success and response.get('success'):
            print(f"   ✓ Attendance recorded via NIS")
            return True
        return False

    def test_scan_invalid_code(self):
        """Test scanning with invalid QR code"""
        success, response = self.run_test(
            "Scan Invalid QR Code (Should Fail)",
            "POST",
            "api/attendance/scan",
            404,
            data={
                "qr_code": "INVALID-QR-CODE-999",
                "status": "Hadir"
            }
        )
        return success

    def test_get_attendance(self):
        """Test getting attendance records"""
        today = datetime.now().strftime("%Y-%m-%d")
        success, response = self.run_test(
            "Get Attendance Records",
            "GET",
            "api/attendance",
            200,
            params={"date": today}
        )
        if success and isinstance(response, list):
            print(f"   ✓ Found {len(response)} attendance records for today")
            return True
        return False

    def test_get_attendance_by_class(self):
        """Test filtering attendance by class"""
        today = datetime.now().strftime("%Y-%m-%d")
        success, response = self.run_test(
            "Get Attendance by Class Filter",
            "GET",
            "api/attendance",
            200,
            params={"date": today, "class_name": "X IPA 1"}
        )
        if success and isinstance(response, list):
            print(f"   ✓ Found {len(response)} attendance records for X IPA 1")
            return True
        return False

    def test_get_attendance_by_status(self):
        """Test filtering attendance by status"""
        today = datetime.now().strftime("%Y-%m-%d")
        success, response = self.run_test(
            "Get Attendance by Status Filter",
            "GET",
            "api/attendance",
            200,
            params={"date": today, "status": "Hadir"}
        )
        if success and isinstance(response, list):
            print(f"   ✓ Found {len(response)} 'Hadir' records")
            return True
        return False

    def test_manual_attendance(self):
        """Test manual attendance recording"""
        if not self.test_student_id:
            print("   ⚠️  Skipped - No test student ID available")
            return True
        
        today = datetime.now().strftime("%Y-%m-%d")
        success, response = self.run_test(
            "Manual Attendance Recording",
            "POST",
            "api/attendance/manual",
            200,
            data={
                "student_id": self.test_student_id,
                "date": today,
                "status": "Sakit",
                "recorded_by": "Test Admin"
            }
        )
        if success and response.get('success'):
            print(f"   ✓ Manual attendance recorded")
            return True
        return False

    def test_dashboard_stats(self):
        """Test dashboard statistics"""
        today = datetime.now().strftime("%Y-%m-%d")
        success, response = self.run_test(
            "Get Dashboard Stats",
            "GET",
            "api/dashboard/stats",
            200,
            params={"date": today}
        )
        if success and 'total_students' in response:
            print(f"   ✓ Total Students: {response.get('total_students')}")
            print(f"   ✓ Hadir: {response.get('hadir')}, Sakit: {response.get('sakit')}, Izin: {response.get('izin')}, Alpa: {response.get('alpa')}")
            print(f"   ✓ Total Classes: {response.get('total_classes')}")
            return True
        return False

    def test_delete_student(self):
        """Test deleting a student"""
        if not self.test_student_id:
            print("   ⚠️  Skipped - No test student ID available")
            return True
        
        success, response = self.run_test(
            "Delete Student",
            "DELETE",
            f"api/students/{self.test_student_id}",
            200
        )
        if success and response.get('success'):
            print(f"   ✓ Student deleted successfully")
            return True
        return False

    def test_seed_demo_data(self):
        """Test seeding demo data"""
        success, response = self.run_test(
            "Seed Demo Data",
            "POST",
            "api/students/seed-demo",
            200
        )
        if success and response.get('success'):
            print(f"   ✓ {response.get('message')}")
            return True
        return False

def main():
    print("=" * 70)
    print("🏫 SCHOOL ATTENDANCE SYSTEM - BACKEND API TESTING")
    print("=" * 70)
    
    tester = SchoolAttendanceAPITester()

    # Test sequence
    print("\n📋 SECTION 1: API Health & Authentication")
    print("-" * 70)
    tester.test_root_endpoint()
    tester.test_admin_login()
    tester.test_teacher_login()
    tester.test_invalid_login()

    print("\n📋 SECTION 2: Student Management")
    print("-" * 70)
    tester.test_get_students()
    tester.test_get_students_by_class()
    tester.test_search_students()
    tester.test_create_student()
    tester.test_create_duplicate_student()
    tester.test_update_student()

    print("\n📋 SECTION 3: Attendance Scanning & Recording")
    print("-" * 70)
    tester.test_scan_attendance_qr()
    tester.test_scan_attendance_nis()
    tester.test_scan_invalid_code()
    tester.test_manual_attendance()

    print("\n📋 SECTION 4: Attendance Recap & Filtering")
    print("-" * 70)
    tester.test_get_attendance()
    tester.test_get_attendance_by_class()
    tester.test_get_attendance_by_status()

    print("\n📋 SECTION 5: Dashboard & Statistics")
    print("-" * 70)
    tester.test_dashboard_stats()

    print("\n📋 SECTION 6: Data Management")
    print("-" * 70)
    tester.test_seed_demo_data()
    tester.test_delete_student()

    # Print final results
    print("\n" + "=" * 70)
    print(f"📊 FINAL TEST RESULTS")
    print("=" * 70)
    print(f"✅ Tests Passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"❌ Tests Failed: {tester.tests_run - tester.tests_passed}/{tester.tests_run}")
    
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    print(f"📈 Success Rate: {success_rate:.1f}%")
    print("=" * 70)

    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())
