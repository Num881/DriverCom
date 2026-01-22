import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { Toaster } from 'react-hot-toast'
import './index.css'


ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <RouterProvider router={router} />
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
    </React.StrictMode>
);