import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { NotificationProvider } from './context/NotificationContext'; 
import { RegistrationProvider } from './context/RegistrationContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/common/ProtectedRoute';

import EntryScreen from './pages/onboarding/EntryScreen';
import RoleScreen from './pages/onboarding/RoleScreen';
import GuestScreen from './pages/onboarding/GuestScreen';
import LoginScreen from './pages/onboarding/LoginScreen';
import RoleChooserScreen from './pages/onboarding/RoleChooserScreen';

import StudentLayout from './pages/student/StudentLayout';
import HomeScreen from './pages/student/HomeScreen';
import EventDetailScreen from './pages/student/EventDetailScreen';
import SocietyProfileScreen from './pages/student/SocietyProfileScreen'; // ADD THIS
import CalendarScreen from './pages/student/CalendarScreen';
import NotificationsScreen from './pages/student/NotificationsScreen';
import ChatScreen from './pages/student/ChatScreen';
import SocietiesScreen from './pages/student/SocietiesScreen';

import SocietyLayout from './pages/society/SocietyLayout';
import DashboardScreen from './pages/society/DashboardScreen';
import CreateEventScreen from './pages/society/CreateEventScreen';
import AttendeesScreen from './pages/society/AttendeesScreen';
import QRCheckinScreen from './pages/society/QRCheckinScreen';
import TaskBoardScreen from './pages/society/TaskBoardScreen';
import UpdatesToHeadScreen from './pages/society/UpdatesToHeadScreen';

import SocietyHeadLayout from './pages/societyHead/SocietyHeadLayout';
import SHDashboardScreen from './pages/societyHead/DashboardScreen';
import SHAnalyticsScreen from './pages/societyHead/AnalyticsScreen';
import SHEventsScreen from './pages/societyHead/EventsScreen';
import SHTeamScreen from './pages/societyHead/TeamScreen';
import SHRecruitmentScreen from './pages/societyHead/RecruitmentScreen';
import SHReportsScreen from './pages/societyHead/ReportsScreen';
import SHPOCUpdatesScreen from './pages/societyHead/POCUpdatesScreen';
import SHProfileScreen from './pages/societyHead/ProfileScreen';
import ManagePocScreen from './pages/societyHead/ManagePocScreen';


export default function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <ToastProvider>
        <NotificationProvider>
          <RegistrationProvider>
        <BrowserRouter>
          <Routes>
            {/* Onboarding */}
            <Route path="/" element={<EntryScreen />} />
            <Route path="/role" element={<RoleScreen />} />
            <Route path="/guest" element={<GuestScreen />} />
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/choose-role" element={<RoleChooserScreen />} />

            {/* Student flow — protected, role = Student (guest allowed) */}
            <Route
              path="/student"
              element={
                <ProtectedRoute role="Student" allowGuest={true}>
                  <StudentLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<HomeScreen />} />
              <Route path="event/:id" element={<EventDetailScreen />} />
              <Route path="society/:id" element={<SocietyProfileScreen />} /> {/* ADD THIS */}
              <Route path="societies" element={<SocietiesScreen />} />
              <Route path="calendar" element={<CalendarScreen />} />
              <Route path="notifications" element={<NotificationsScreen />} />
              <Route path="chat" element={<ChatScreen />} />
            </Route>

            {/* Society POC flow — protected, role = Society POC */}
            <Route
              path="/society"
              element={
                <ProtectedRoute role="Society POC">
                  <SocietyLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardScreen />} />
              <Route path="create" element={<CreateEventScreen />} />
              <Route path="attendees" element={<AttendeesScreen />} />
              <Route path="qr" element={<QRCheckinScreen />} />
              <Route path="tasks" element={<TaskBoardScreen />} />
              <Route path="updates-to-head" element={<UpdatesToHeadScreen />} />
            </Route>

            {/* Society Head flow — protected, role = Society Head */}
            <Route
              path="/society-head"
              element={
                <ProtectedRoute role="Society Head">
                  <SocietyHeadLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<SHDashboardScreen />} />
              <Route path="analytics" element={<SHAnalyticsScreen />} />
              <Route path="events" element={<SHEventsScreen />} />
              <Route path="team" element={<SHTeamScreen />} />
              <Route path="recruitment" element={<SHRecruitmentScreen />} />
              <Route path="reports" element={<SHReportsScreen />} />
              <Route path="poc-updates" element={<SHPOCUpdatesScreen />} />
              <Route path="manage-poc" element={<ManagePocScreen />} />
              <Route path="profile" element={<SHProfileScreen />} />
            </Route>
          </Routes>
        </BrowserRouter>
        </RegistrationProvider>
        </NotificationProvider>
      </ToastProvider>
    </AuthProvider>
    </ThemeProvider>
  );
}