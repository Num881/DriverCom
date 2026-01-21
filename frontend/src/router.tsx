import { createBrowserRouter } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import ProtectedRoute from './components/ProtectedRoute'
import CreateTrip from './pages/CreateTrip'
import MyTrips from './pages/MyTrips';
import MyBookings from './pages/MyBookings';

export const router = createBrowserRouter([
    { path: '/login', element: <Login /> },
    { path: '/register', element: <Register /> },
    {
        path: '/',
        element: (
            <ProtectedRoute>
                <Home />
            </ProtectedRoute>
        ),
    },
    {
        path: '/create-trip',
        element: (
            <ProtectedRoute>
                <CreateTrip />
            </ProtectedRoute>
        ),
    },
    {
        path: '/my-trips',
        element: (
            <ProtectedRoute>
                <MyTrips />
            </ProtectedRoute>
        ),
    },
    {
        path: '/my-bookings',
        element: (
            <ProtectedRoute>
                <MyBookings />
            </ProtectedRoute>
        ),
    },
    {
        path: '*',
        element: <div className="p-10 text-center text-2xl">404 — страница не найдена</div>,
    },
])