import { useState } from 'react'
import { useNavigate } from 'react-router-dom'  // ← добавь эту строку

export default function Login() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const navigate = useNavigate()  // ← теперь работает без ошибки

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const res = await fetch('http://localhost:3000/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            })

            if (!res.ok) {
                const errData = await res.json()
                setError(errData.error || 'Ошибка входа')
                return
            }

            const data = await res.json()
            localStorage.setItem('token', data.token)
            localStorage.setItem('role', data.role)  // ← вот эту строку добавить
            navigate('/')
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Неизвестная ошибка'
            setError(message)
        } finally {
            setLoading(false)
        }
    }


    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
                <h1 className="text-3xl font-bold mb-6 text-center">Вход</h1>

                {error && <p className="text-red-600 text-center mb-4">{error}</p>}

                <form onSubmit={handleLogin} className="space-y-4">
                    <input
                        type="text"
                        placeholder="Имя пользователя"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Пароль"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                    >
                        {loading ? 'Входим...' : 'Войти'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-gray-600 mb-4">Нет аккаунта?</p>
                    <a
                        href="/register"
                        className="inline-block px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition shadow-md hover:shadow-lg"
                    >
                        Зарегистрироваться
                    </a>
                </div>
            </div>
        </div>
    )
}