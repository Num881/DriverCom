import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

// Интерфейс для поездки (чтобы TS не ругался на trip.*)
interface Trip {
    id: number
    from_city: string
    to_city: string
    date: string
    car_model: string
    seats_total: number
    free_seats: number
}

export default function Home() {
    const [trips, setTrips] = useState<Trip[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const navigate = useNavigate()

    const fetchTrips = async () => {
        const token = localStorage.getItem('token')
        if (!token) {
            navigate('/login')
            return
        }

        setLoading(true)
        setError('')

        try {
            const res = await fetch('http://localhost:3000/drivers/trips/search?from_city=&to_city=', {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            })

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}))
                const message = errData.error || `Ошибка сервера: ${res.status}`
                setError(message)
                if (res.status === 401 || res.status === 403) {
                    navigate('/login')
                }
                return
            }

            const data: Trip[] = await res.json()
            setTrips(data)
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Неизвестная ошибка'
            setError(message)
            if (message.includes('401') || message.includes('403')) {
                navigate('/login')
            }
        } finally {
            setLoading(false)
        }
    }

    const bookTrip = async (tripId: number) => {
        if (!confirm('Забронировать место?')) return

        try {
            const token = localStorage.getItem('token')
            if (!token) {
                navigate('/login')
                return
            }

            const res = await fetch('http://localhost:3000/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ trip_id: tripId }),
            })

            if (!res.ok) {
                const errData = await res.json()
                throw new Error(errData.error || 'Ошибка бронирования')
            }

            alert('Место успешно забронировано!')
            fetchTrips() // обновляем список — free_seats уменьшится
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Неизвестная ошибка'
            alert(message)
        }
    }

    useEffect(() => {
        fetchTrips()
    }, [navigate])

    if (loading) {
        return <div className="text-center p-10 text-xl">Загрузка поездок...</div>
    }

    if (error) {
        return <div className="text-red-600 text-center p-10 text-xl">{error}</div>
    }

    return (
        <div className="p-6 max-w-7xl mx-auto relative">
            {/* Кнопка выхода */}
            <div className="flex justify-end mb-6">
                <button
                    onClick={() => {
                        localStorage.removeItem('token')
                        navigate('/login')
                    }}
                    className="px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition shadow-md"
                >
                    Выйти
                </button>
            </div>
            <div className="flex justify-center gap-6 mb-10">
                {localStorage.getItem('role') === 'driver' && (
                    <button
                        onClick={() => navigate('/my-trips')}
                        className="px-8 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition"
                    >
                        Мои поездки
                    </button>
                )}
                {localStorage.getItem('role') === 'passenger' && (
                    <button
                        onClick={() => navigate('/my-bookings')}
                        className="px-8 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition"
                    >
                        Мои брони
                    </button>
                )}
            </div>

            {/* Кнопка создания поездки */}
            <div className="flex justify-center mb-10">
                {localStorage.getItem('role') === 'driver' ? (
                    <button
                        onClick={() => navigate('/create-trip')}
                        className="px-10 py-4 bg-green-600 text-white font-bold text-lg rounded-full shadow-lg hover:bg-green-700 hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    >
                        Создать новую поездку
                    </button>
                ) : null}
            </div>

            <h1 className="text-4xl font-bold mb-10 text-center text-gray-800">Доступные поездки</h1>

            {trips.length === 0 ? (
                <p className="text-center text-gray-600 text-2xl">Поездок пока нет</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {trips.map((trip) => (
                        <div
                            key={trip.id}
                            className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100"
                        >
                            <h2 className="text-2xl font-bold mb-3 text-gray-800">
                                {trip.from_city} → {trip.to_city}
                            </h2>
                            <div className="space-y-2 text-gray-600">
                                <p>Дата: <span className="font-medium">{trip.date}</span></p>
                                <p>Машина: <span className="font-medium">{trip.car_model}</span></p>
                                <p>Мест всего: <span className="font-medium">{trip.seats_total}</span></p>
                                <p className="text-green-600 font-bold text-lg">
                                    Свободно: {trip.free_seats}
                                </p>
                            </div>
                            <button
                                onClick={() => bookTrip(trip.id)}
                                disabled={trip.free_seats === 0}
                                className={`mt-6 w-full py-3 text-white font-medium rounded-xl transition ${
                                    trip.free_seats === 0
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                            >
                                {trip.free_seats === 0 ? 'Мест нет' : 'Забронировать место'}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}