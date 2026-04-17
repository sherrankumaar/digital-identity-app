import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext(null);

const translations = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    profile: 'Profile',
    services: 'Services',
    admin: 'Admin Panel',
    logout: 'Logout',
    login: 'Login',
    register: 'Register',
    
    // Auth
    welcomeBack: 'Welcome back',
    signInToContinue: 'Sign in to access your digital identity',
    email: 'Email',
    password: 'Password',
    name: 'Full Name',
    confirmPassword: 'Confirm Password',
    forgotPassword: 'Forgot password?',
    noAccount: "Don't have an account?",
    hasAccount: 'Already have an account?',
    signUp: 'Sign up',
    signIn: 'Sign in',
    createAccount: 'Create Account',
    verifyEmail: 'Verify Email',
    enterOTP: 'Enter the verification code sent to your email',
    verify: 'Verify',
    resendCode: 'Resend code',
    
    // Profile
    personalInfo: 'Personal Information',
    pesel: 'PESEL Number',
    dateOfBirth: 'Date of Birth',
    phone: 'Phone Number',
    address: 'Address',
    saveChanges: 'Save Changes',
    editProfile: 'Edit Profile',
    
    // Dashboard
    welcomeUser: 'Welcome,',
    accessServices: 'Access government services with your digital identity',
    availableServices: 'Available Services',
    recentActivity: 'Recent Activity',
    
    // Services
    healthServices: 'Health Services',
    healthDesc: 'View medical records and hospital visits',
    bankVerification: 'Bank Verification',
    bankDesc: 'Verify your identity for banking services',
    governmentServices: 'Government Services',
    govDesc: 'Access official government services',
    policeServices: 'Police Services',
    policeDesc: 'Lodge complaints and check records',
    pensionServices: 'Pension Services',
    pensionDesc: 'View pension account and contributions',
    
    // Health
    medicalRecords: 'Medical Records',
    hospitalVisits: 'Hospital Visits',
    vaccinations: 'Vaccinations',
    labTests: 'Lab Tests',
    doctor: 'Doctor',
    hospital: 'Hospital',
    date: 'Date',
    diagnosis: 'Diagnosis',
    
    // Bank
    bankName: 'Bank Name',
    accountPurpose: 'Account Purpose',
    requestVerification: 'Request Verification',
    verificationHistory: 'Verification History',
    status: 'Status',
    verified: 'Verified',
    pending: 'Pending',
    rejected: 'Rejected',
    
    // Police
    lodgeComplaint: 'Lodge Complaint',
    myComplaints: 'My Complaints',
    summonsAndFines: 'Summons & Fines',
    complaintTitle: 'Title',
    complaintDescription: 'Description',
    category: 'Category',
    location: 'Location',
    submit: 'Submit',
    referenceNumber: 'Reference Number',
    theft: 'Theft',
    fraud: 'Fraud',
    harassment: 'Harassment',
    other: 'Other',
    
    // Pension
    pensionAccount: 'Pension Account',
    accountNumber: 'Account Number',
    totalContributions: 'Total Contributions',
    yearsOfService: 'Years of Service',
    estimatedPension: 'Estimated Monthly Pension',
    retirementAge: 'Retirement Age',
    contributionHistory: 'Contribution History',
    year: 'Year',
    amount: 'Amount',
    employer: 'Employer',
    
    // Admin
    userManagement: 'User Management',
    systemStats: 'System Statistics',
    totalUsers: 'Total Users',
    adminUsers: 'Admin Users',
    regularUsers: 'Regular Users',
    totalComplaints: 'Total Complaints',
    pendingComplaints: 'Pending Complaints',
    allComplaints: 'All Complaints',
    role: 'Role',
    actions: 'Actions',
    delete: 'Delete',
    makeAdmin: 'Make Admin',
    removeAdmin: 'Remove Admin',
    
    // Common
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    confirm: 'Confirm',
    back: 'Back',
    viewDetails: 'View Details',
    noData: 'No data available',
    
    // Footer
    copyright: '© 2026 e-Identity Poland. All rights reserved.',
    digitalIdentity: 'Digital Identity Management System'
  },
  pl: {
    // Navigation
    dashboard: 'Panel Główny',
    profile: 'Profil',
    services: 'Usługi',
    admin: 'Panel Admina',
    logout: 'Wyloguj',
    login: 'Zaloguj',
    register: 'Zarejestruj',
    
    // Auth
    welcomeBack: 'Witaj ponownie',
    signInToContinue: 'Zaloguj się, aby uzyskać dostęp do swojej tożsamości cyfrowej',
    email: 'Email',
    password: 'Hasło',
    name: 'Imię i Nazwisko',
    confirmPassword: 'Potwierdź Hasło',
    forgotPassword: 'Zapomniałeś hasła?',
    noAccount: 'Nie masz konta?',
    hasAccount: 'Masz już konto?',
    signUp: 'Zarejestruj się',
    signIn: 'Zaloguj się',
    createAccount: 'Utwórz Konto',
    verifyEmail: 'Zweryfikuj Email',
    enterOTP: 'Wprowadź kod weryfikacyjny wysłany na Twój email',
    verify: 'Zweryfikuj',
    resendCode: 'Wyślij ponownie',
    
    // Profile
    personalInfo: 'Dane Osobowe',
    pesel: 'Numer PESEL',
    dateOfBirth: 'Data Urodzenia',
    phone: 'Numer Telefonu',
    address: 'Adres',
    saveChanges: 'Zapisz Zmiany',
    editProfile: 'Edytuj Profil',
    
    // Dashboard
    welcomeUser: 'Witaj,',
    accessServices: 'Uzyskaj dostęp do usług rządowych dzięki Twojej tożsamości cyfrowej',
    availableServices: 'Dostępne Usługi',
    recentActivity: 'Ostatnia Aktywność',
    
    // Services
    healthServices: 'Usługi Zdrowotne',
    healthDesc: 'Przeglądaj dokumentację medyczną i wizyty szpitalne',
    bankVerification: 'Weryfikacja Bankowa',
    bankDesc: 'Zweryfikuj tożsamość dla usług bankowych',
    governmentServices: 'Usługi Rządowe',
    govDesc: 'Dostęp do oficjalnych usług rządowych',
    policeServices: 'Usługi Policyjne',
    policeDesc: 'Składaj skargi i sprawdzaj dokumenty',
    pensionServices: 'Usługi Emerytalne',
    pensionDesc: 'Przeglądaj konto emerytalne i składki',
    
    // Health
    medicalRecords: 'Dokumentacja Medyczna',
    hospitalVisits: 'Wizyty Szpitalne',
    vaccinations: 'Szczepienia',
    labTests: 'Badania Laboratoryjne',
    doctor: 'Lekarz',
    hospital: 'Szpital',
    date: 'Data',
    diagnosis: 'Diagnoza',
    
    // Bank
    bankName: 'Nazwa Banku',
    accountPurpose: 'Cel Konta',
    requestVerification: 'Poproś o Weryfikację',
    verificationHistory: 'Historia Weryfikacji',
    status: 'Status',
    verified: 'Zweryfikowano',
    pending: 'Oczekujące',
    rejected: 'Odrzucone',
    
    // Police
    lodgeComplaint: 'Złóż Skargę',
    myComplaints: 'Moje Skargi',
    summonsAndFines: 'Wezwania i Mandaty',
    complaintTitle: 'Tytuł',
    complaintDescription: 'Opis',
    category: 'Kategoria',
    location: 'Lokalizacja',
    submit: 'Wyślij',
    referenceNumber: 'Numer Referencyjny',
    theft: 'Kradzież',
    fraud: 'Oszustwo',
    harassment: 'Nękanie',
    other: 'Inne',
    
    // Pension
    pensionAccount: 'Konto Emerytalne',
    accountNumber: 'Numer Konta',
    totalContributions: 'Suma Składek',
    yearsOfService: 'Lata Pracy',
    estimatedPension: 'Szacowana Emerytura Miesięczna',
    retirementAge: 'Wiek Emerytalny',
    contributionHistory: 'Historia Składek',
    year: 'Rok',
    amount: 'Kwota',
    employer: 'Pracodawca',
    
    // Admin
    userManagement: 'Zarządzanie Użytkownikami',
    systemStats: 'Statystyki Systemu',
    totalUsers: 'Łączna Liczba Użytkowników',
    adminUsers: 'Administratorzy',
    regularUsers: 'Zwykli Użytkownicy',
    totalComplaints: 'Łączna Liczba Skarg',
    pendingComplaints: 'Oczekujące Skargi',
    allComplaints: 'Wszystkie Skargi',
    role: 'Rola',
    actions: 'Akcje',
    delete: 'Usuń',
    makeAdmin: 'Nadaj Admina',
    removeAdmin: 'Odbierz Admina',
    
    // Common
    loading: 'Ładowanie...',
    error: 'Błąd',
    success: 'Sukces',
    cancel: 'Anuluj',
    confirm: 'Potwierdź',
    back: 'Wróć',
    viewDetails: 'Zobacz Szczegóły',
    noData: 'Brak danych',
    
    // Footer
    copyright: '© 2026 e-Identity Poland. Wszelkie prawa zastrzeżone.',
    digitalIdentity: 'System Zarządzania Tożsamością Cyfrową'
  }
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key) => {
    return translations[language][key] || key;
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'pl' : 'en');
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
