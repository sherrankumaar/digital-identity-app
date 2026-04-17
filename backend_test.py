#!/usr/bin/env python3
"""
Backend API Testing for e-Identity Poland Digital Identity Management System
Tests all endpoints including auth, services, and admin functionality
"""

import requests
import sys
import json
from datetime import datetime

class EIdentityAPITester:
    def __init__(self, base_url="https://e-identity-pl.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.session = requests.Session()

    def log_result(self, test_name, success, response_data=None, error=None):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name} - PASSED")
        else:
            self.failed_tests.append({
                "test": test_name,
                "error": error,
                "response": response_data
            })
            print(f"❌ {test_name} - FAILED: {error}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, use_admin=False):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        # Add auth token if available
        if use_admin and self.admin_token:
            test_headers['Authorization'] = f'Bearer {self.admin_token}'
        elif self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
            
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = self.session.get(url, headers=test_headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            response_data = {}
            
            try:
                response_data = response.json()
            except:
                response_data = {"text": response.text}

            if success:
                self.log_result(name, True, response_data)
                return True, response_data
            else:
                self.log_result(name, False, response_data, f"Expected {expected_status}, got {response.status_code}")
                return False, response_data

        except Exception as e:
            self.log_result(name, False, None, str(e))
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_admin_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@eidentity.pl", "password": "Admin123!"}
        )
        
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            print(f"🔑 Admin token acquired")
            return True
        return False

    def test_auth_me_admin(self):
        """Test /auth/me endpoint with admin token"""
        return self.run_test("Auth Me (Admin)", "GET", "auth/me", 200, use_admin=True)

    def test_admin_stats(self):
        """Test admin stats endpoint"""
        return self.run_test("Admin Stats", "GET", "admin/stats", 200, use_admin=True)

    def test_admin_users_list(self):
        """Test admin users list"""
        return self.run_test("Admin Users List", "GET", "admin/users", 200, use_admin=True)

    def test_government_services(self):
        """Test government services endpoint"""
        return self.run_test("Government Services", "GET", "services/government/services", 200, use_admin=True)

    def test_health_records(self):
        """Test health records endpoint"""
        return self.run_test("Health Records", "GET", "services/health/records", 200, use_admin=True)

    def test_pension_account(self):
        """Test pension account endpoint"""
        return self.run_test("Pension Account", "GET", "services/pension/account", 200, use_admin=True)

    def test_pension_contributions(self):
        """Test pension contributions endpoint"""
        return self.run_test("Pension Contributions", "GET", "services/pension/contributions", 200, use_admin=True)

    def test_police_records(self):
        """Test police records endpoint"""
        return self.run_test("Police Records", "GET", "services/police/records", 200, use_admin=True)

    def test_police_complaints_list(self):
        """Test police complaints list"""
        return self.run_test("Police Complaints List", "GET", "services/police/complaints", 200, use_admin=True)

    def test_bank_verifications(self):
        """Test bank verifications endpoint"""
        return self.run_test("Bank Verifications", "GET", "services/bank/verifications", 200, use_admin=True)

    def test_user_profile(self):
        """Test user profile endpoint"""
        return self.run_test("User Profile", "GET", "users/profile", 200, use_admin=True)

    def test_create_police_complaint(self):
        """Test creating a police complaint"""
        complaint_data = {
            "title": "Test Complaint",
            "description": "This is a test complaint for API testing",
            "category": "noise",
            "location": "Test Location, Warsaw"
        }
        return self.run_test("Create Police Complaint", "POST", "services/police/complaints", 200, data=complaint_data, use_admin=True)

    def test_bank_verification_request(self):
        """Test bank verification request"""
        verification_data = {
            "bank_name": "Test Bank",
            "account_purpose": "personal"
        }
        return self.run_test("Bank Verification Request", "POST", "services/bank/verify", 200, data=verification_data, use_admin=True)

    def test_admin_complaints_list(self):
        """Test admin complaints list"""
        return self.run_test("Admin Complaints List", "GET", "admin/complaints", 200, use_admin=True)

    def test_logout(self):
        """Test logout endpoint"""
        return self.run_test("Logout", "POST", "auth/logout", 200, use_admin=True)

    def test_unauthorized_access(self):
        """Test unauthorized access to protected endpoint"""
        # Temporarily clear token
        temp_token = self.admin_token
        self.admin_token = None
        success, _ = self.run_test("Unauthorized Access", "GET", "admin/stats", 401)
        self.admin_token = temp_token
        return success

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting e-Identity Poland Backend API Tests")
        print(f"📍 Testing against: {self.base_url}")
        print("=" * 60)

        # Test sequence
        tests = [
            self.test_root_endpoint,
            self.test_admin_login,
            self.test_auth_me_admin,
            self.test_admin_stats,
            self.test_admin_users_list,
            self.test_user_profile,
            self.test_government_services,
            self.test_health_records,
            self.test_pension_account,
            self.test_pension_contributions,
            self.test_police_records,
            self.test_police_complaints_list,
            self.test_bank_verifications,
            self.test_create_police_complaint,
            self.test_bank_verification_request,
            self.test_admin_complaints_list,
            self.test_unauthorized_access,
            self.test_logout
        ]

        for test in tests:
            try:
                test()
            except Exception as e:
                self.log_result(test.__name__, False, None, f"Exception: {str(e)}")

        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Summary:")
        print(f"✅ Passed: {self.tests_passed}/{self.tests_run}")
        print(f"❌ Failed: {len(self.failed_tests)}/{self.tests_run}")
        print(f"📈 Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")

        if self.failed_tests:
            print(f"\n❌ Failed Tests:")
            for failed in self.failed_tests:
                print(f"  - {failed['test']}: {failed['error']}")

        return self.tests_passed == self.tests_run

def main():
    """Main test execution"""
    tester = EIdentityAPITester()
    success = tester.run_all_tests()
    
    # Save results to file
    results = {
        "timestamp": datetime.now().isoformat(),
        "total_tests": tester.tests_run,
        "passed_tests": tester.tests_passed,
        "failed_tests": len(tester.failed_tests),
        "success_rate": (tester.tests_passed/tester.tests_run)*100 if tester.tests_run > 0 else 0,
        "failed_test_details": tester.failed_tests
    }
    
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())