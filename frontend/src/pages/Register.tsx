import { AuthForm } from '../components/AuthForm'

export default function Register() {
    const handleRegister = async (data: { username: string; password: string; role?: 'driver' | 'passenger' }) => {
        // role точно есть, потому что в форме регистрации оно обязательное
        const role = data.role!

        const res = await fetch('http://localhost:3000/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: data.username, password: data.password, role }),
        })

        if (!res.ok) {
            const errData = await res.json()
            throw new Error(errData.error || 'Ошибка регистрации')
        }
    }

    return <AuthForm type="register" onSubmit={handleRegister} />
}