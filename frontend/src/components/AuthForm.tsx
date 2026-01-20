import { useState } from 'react'
import { useNavigate } from 'react-router-dom'  // ← добавь эту строку
import { Eye, EyeOff, User, Lock } from 'lucide-react'
import toast from 'react-hot-toast'

interface AuthFormProps {
    type: 'login' | 'register'
    onSubmit: (data: { username: string; password: string; role?: 'driver' | 'passenger' }) => Promise<void>
}

export function AuthForm({ type, onSubmit }: AuthFormProps) {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [role, setRole] = useState<'driver' | 'passenger'>('passenger')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()  // ← теперь работает
    const isRegister = type === 'register'

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)

        try {
            await onSubmit({ username, password, ...(isRegister ? { role } : {}) })
            toast.success(isRegister ? 'Регистрация прошла успешно! Теперь войдите.' : 'Вход выполнен!')
            if (isRegister) {
                navigate('/login')  // ← теперь без ошибки
            }
        } catch (err: any) {
            toast.error(err.message || 'Ошибка')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md transition-all duration-300 hover:shadow-2xl">
                <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
                    {isRegister ? 'Регистрация' : 'Вход'}
                </h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Имя пользователя"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                            required
                        />
                    </div>

                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Пароль"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>

                    {isRegister && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Роль</label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value as 'driver' | 'passenger')}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                required
                            >
                                <option value="passenger">Пассажир</option>
                                <option value="driver">Водитель</option>
                            </select>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center"
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        ) : isRegister ? 'Зарегистрироваться' : 'Войти'}
                    </button>
                </form>

                <p className="mt-6 text-center text-gray-600">
                    {isRegister ? 'Уже есть аккаунт?' : 'Нет аккаунта?'}{' '}
                    <a
                        href={isRegister ? '/login' : '/register'}
                        className="text-blue-600 hover:underline font-medium"
                    >
                        {isRegister ? 'Войти' : 'Зарегистрироваться'}
                    </a>
                </p>
            </div>
        </div>
    )
}