import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface Booking {
    id: number;
    trip_id: number;
    from_city: string;
    to_city: string;
    date: string;
    car_model: string;
}

export default function MyBookings() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const fetchMyBookings = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch('http://localhost:3000/bookings/my', {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'Ошибка загрузки');
            }

            const data: Booking[] = await res.json();
            setBookings(data);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Неизвестная ошибка';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const cancelBooking = async (bookingId: number) => {
        if (!confirm('Отменить бронь?')) return;

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const res = await fetch(`http://localhost:3000/bookings/${bookingId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: null,
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'Ошибка отмены');
            }

            toast.success('Бронь успешно отменена!');  // ← заменено на toast.success
            fetchMyBookings(); // обновляем список
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Неизвестная ошибка';
            toast.error(message);  // ← заменено на toast.error
        }
    };

    useEffect(() => {
        fetchMyBookings();
    }, [navigate]);

    if (loading) return <div className="text-center p-10 text-xl">Загрузка...</div>;
    if (error) return <div className="text-red-600 text-center p-10 text-xl">{error}</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold mb-10 text-center text-gray-800">Мои брони</h1>

            {bookings.length === 0 ? (
                <p className="text-center text-gray-600 text-2xl">У вас пока нет броней</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {bookings.map((booking) => (
                        <div key={booking.id} className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                            <h2 className="text-2xl font-bold mb-3 text-gray-800">
                                {booking.from_city} → {booking.to_city}
                            </h2>
                            <div className="space-y-2 text-gray-600">
                                <p>Дата поездки: <span className="font-medium">{booking.date}</span></p>
                                <p>Машина: <span className="font-medium">{booking.car_model}</span></p>
                                {/* <p>Забронировано: <span className="font-medium">{new Date(booking.created_at).toLocaleString()}</span></p> */}
                            </div>

                            <button
                                onClick={() => cancelBooking(booking.id)}
                                className="mt-4 w-full py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition"
                            >
                                Отменить бронь
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}