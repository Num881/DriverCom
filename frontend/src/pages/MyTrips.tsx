import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';  // ← добавляем импорт toast

interface Trip {
    id: number;
    from_city: string;
    to_city: string;
    date: string;
    car_model: string;
    seats_total: number;
    free_seats: number;
    price: number;
}

export default function MyTrips() {
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const fetchMyTrips = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch('http://localhost:3000/drivers/trips', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'Ошибка загрузки');
            }

            const data: Trip[] = await res.json();
            setTrips(data);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Неизвестная ошибка';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const deleteTrip = async (tripId: number) => {
        if (!confirm('Удалить поездку? Все брони будут отменены.')) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:3000/drivers/trips/${tripId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'Ошибка удаления');
            }

            toast.success('Поездка удалена');  // ← заменено на toast.success
            fetchMyTrips();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Неизвестная ошибка';
            toast.error(message);  // ← заменено на toast.error
        }
    };

    useEffect(() => {
        fetchMyTrips();
    }, [navigate]);

    if (loading) return <div className="text-center p-10 text-xl">Загрузка...</div>;
    if (error) return <div className="text-red-600 text-center p-10 text-xl">{error}</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold mb-10 text-center">Мои поездки</h1>

            {trips.length === 0 ? (
                <p className="text-center text-gray-600 text-2xl">У вас пока нет поездок</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {trips.map(trip => (
                        <div key={trip.id} className="bg-white p-6 rounded-2xl shadow-lg border">
                            <h2 className="text-2xl font-bold mb-3">
                                {trip.from_city} → {trip.to_city}
                            </h2>
                            <div className="space-y-2 text-gray-600">
                                <p>Дата: {trip.date}</p>
                                <p>Машина: {trip.car_model}</p>
                                <p>Мест всего: {trip.seats_total}</p>
                                <p className="text-green-600 font-bold">Свободно: {trip.free_seats}</p>
                                <p>Цена: {trip.price} ₽</p>
                            </div>

                            <div className="mt-6 flex gap-4">
                                <button
                                    onClick={() => navigate(`/edit-trip/${trip.id}`)}
                                    className="flex-1 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                                >
                                    Редактировать
                                </button>
                                <button
                                    onClick={() => deleteTrip(trip.id)}
                                    className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                >
                                    Удалить
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}