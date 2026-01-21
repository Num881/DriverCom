import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Trip {
    id: number;
    from_city: string;
    to_city: string;
    date: string;
    car_model: string;
    seats_total: number;
    free_seats: number;
}

export default function MyTrips() {
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchMyTrips = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            // Проверка роли (на всякий случай)
            const role = localStorage.getItem('role');
            if (role !== 'driver') {
                setError('Эта страница доступна только водителям');
                setLoading(false);
                return;
            }

            try {
                const res = await fetch('http://localhost:3000/drivers/trips', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.error || 'Ошибка загрузки');
                }

                const data: Trip[] = await res.json();
                setTrips(data);
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
            } finally {
                setLoading(false);
            }
        };

        fetchMyTrips();
    }, [navigate]);

    if (loading) return <div className="text-center p-10 text-xl">Загрузка...</div>;
    if (error) return <div className="text-red-600 text-center p-10 text-xl">{error}</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold mb-10 text-center text-gray-800">Мои поездки</h1>

            {trips.length === 0 ? (
                <p className="text-center text-gray-600 text-2xl">У вас пока нет созданных поездок</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {trips.map((trip) => (
                        <div key={trip.id} className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
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
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}