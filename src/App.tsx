import { CircularProgress, Box } from '@mui/material'
import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { isAuthenticated } from './context/AuthContext'
import Layout from './components/Layout'
import TableSkeleton from './components/skeletons/TableSkeleton'
import DashboardSkeleton from './components/skeletons/DashboardSkeleton'

const Login = lazy(() => import('./pages/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Works = lazy(() => import('./pages/Works'))
const Items = lazy(() => import('./pages/Items'))
const Patrons = lazy(() => import('./pages/Patrons'))
const Loans = lazy(() => import('./pages/Loans'))
const Holds = lazy(() => import('./pages/Holds'))
const Fines = lazy(() => import('./pages/Fines'))
const Libraries = lazy(() => import('./pages/Libraries'))
const Profiles = lazy(() => import('./pages/Profiles'))
const Reports = lazy(() => import('./pages/Reports'))
const Notifications = lazy(() => import('./pages/Notifications'))
const Observability = lazy(() => import('./pages/Observability'))

function LoginFallback() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
      <CircularProgress />
    </Box>
  )
}

function Protected() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  return <Layout />
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <Suspense fallback={<LoginFallback />}>
            <Login />
          </Suspense>
        }
      />
      <Route element={<Protected />}>
        <Route
          path="/"
          element={
            <Suspense fallback={<DashboardSkeleton />}>
              <Dashboard />
            </Suspense>
          }
        />
        <Route
          path="/works"
          element={
            <Suspense fallback={<TableSkeleton columns={6} rows={5} />}>
              <Works />
            </Suspense>
          }
        />
        <Route
          path="/items"
          element={
            <Suspense fallback={<TableSkeleton columns={6} rows={5} />}>
              <Items />
            </Suspense>
          }
        />
        <Route
          path="/patrons"
          element={
            <Suspense fallback={<TableSkeleton columns={6} rows={5} />}>
              <Patrons />
            </Suspense>
          }
        />
        <Route
          path="/loans"
          element={
            <Suspense fallback={<TableSkeleton columns={7} rows={5} />}>
              <Loans />
            </Suspense>
          }
        />
        <Route
          path="/holds"
          element={
            <Suspense fallback={<TableSkeleton columns={6} rows={5} />}>
              <Holds />
            </Suspense>
          }
        />
        <Route
          path="/fines"
          element={
            <Suspense fallback={<TableSkeleton columns={6} rows={5} />}>
              <Fines />
            </Suspense>
          }
        />
        <Route
          path="/libraries"
          element={
            <Suspense fallback={<TableSkeleton columns={4} rows={5} />}>
              <Libraries />
            </Suspense>
          }
        />
        <Route
          path="/profiles"
          element={
            <Suspense fallback={<TableSkeleton columns={6} rows={5} />}>
              <Profiles />
            </Suspense>
          }
        />
        <Route
          path="/reports"
          element={
            <Suspense fallback={<TableSkeleton columns={6} rows={5} />}>
              <Reports />
            </Suspense>
          }
        />
        <Route
          path="/notifications"
          element={
            <Suspense fallback={<TableSkeleton columns={5} rows={5} />}>
              <Notifications />
            </Suspense>
          }
        />
        <Route
          path="/observability"
          element={
            <Suspense fallback={<TableSkeleton columns={5} rows={5} />}>
              <Observability />
            </Suspense>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}