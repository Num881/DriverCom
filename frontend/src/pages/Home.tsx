import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';  // ← импорт toast

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

export default function Home() {
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Фильтры
    const [fromCity, setFromCity] = useState('');
    const [toCity, setToCity] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [priceMin, setPriceMin] = useState('');
    const [priceMax, setPriceMax] = useState('');

    const fetchTrips = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const params = new URLSearchParams();
            if (fromCity.trim()) params.append('from_city', fromCity.trim());
            if (toCity.trim()) params.append('to_city', toCity.trim());
            if (dateFrom) params.append('date_from', dateFrom);
            if (dateTo) params.append('date_to', dateTo);
            if (priceMin) params.append('price_min', priceMin);
            if (priceMax) params.append('price_max', priceMax);

            const queryString = params.toString() ? `?${params.toString()}` : '';

            const res = await fetch(`http://localhost:3000/drivers/trips/search${queryString}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `Ошибка сервера: ${res.status}`);
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

    const bookTrip = async (tripId: number) => {
        if (!confirm('Забронировать место?')) return;

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const res = await fetch('http://localhost:3000/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ trip_id: tripId }),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Ошибка бронирования');
            }

            toast.success('Место успешно забронировано!');
            fetchTrips(); // обновляем список
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Неизвестная ошибка';
            toast.error(message);
        }
    };

    useEffect(() => {
        fetchTrips();
    }, [navigate]);

    const applyFilters = () => {
        fetchTrips();
    };

    const resetFilters = () => {
        setFromCity('');
        setToCity('');
        setDateFrom('');
        setDateTo('');
        setPriceMin('');
        setPriceMax('');
        fetchTrips();
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Кнопка выхода */}
            <div className="flex justify-end mb-6">
                <button
                    onClick={() => {
                        localStorage.removeItem('token');
                        localStorage.removeItem('role');
                        navigate('/login');
                    }}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                    Выйти
                </button>
            </div>

            {/* Кнопка создания поездки */}
            {localStorage.getItem('role') === 'driver' && (
                <div className="flex justify-center mb-10">
                    <button
                        onClick={() => navigate('/create-trip')}
                        className="px-10 py-4 bg-green-600 text-white font-bold text-lg rounded-full shadow-lg hover:bg-green-700 hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    >
                        Создать новую поездку
                    </button>
                </div>
            )}

            <div className="flex justify-center gap-6 mb-10">
                {localStorage.getItem('role') === 'driver' && (
                    <button
                        onClick={() => navigate('/my-trips')}
                        className="px-8 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition shadow-md"
                    >
                        Мои поездки
                    </button>
                )}

                {localStorage.getItem('role') === 'passenger' && (
                    <button
                        onClick={() => navigate('/my-bookings')}
                        className="px-8 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition shadow-md"
                    >
                        Мои брони
                    </button>
                )}
            </div>

            <h1 className="text-4xl font-bold mb-6 text-center text-gray-800">Доступные поездки</h1>

            {/* Фильтр */}
            <div className="bg-white p-6 rounded-xl shadow-md mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Откуда</label>
                        <input
                            type="text"
                            value={fromCity}
                            onChange={(e) => setFromCity(e.target.value)}
                            placeholder="Город отправления"
                            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Куда</label>
                        <input
                            type="text"
                            value={toCity}
                            onChange={(e) => setToCity(e.target.value)}
                            placeholder="Город прибытия"
                            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Дата от</label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Дата до</label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Цена от</label>
                        <input
                            type="number"
                            value={priceMin}
                            onChange={(e) => setPriceMin(e.target.value)}
                            placeholder="от"
                            min="0"
                            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Цена до</label>
                        <input
                            type="number"
                            value={priceMax}
                            onChange={(e) => setPriceMax(e.target.value)}
                            placeholder="до"
                            min="0"
                            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div className="mt-6 flex justify-center gap-4">
                    <button
                        onClick={applyFilters}
                        className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        Применить фильтр
                    </button>
                    <button
                        onClick={resetFilters}
                        className="px-8 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                    >
                        Сбросить
                    </button>
                </div>
            </div>

            {/* Список поездок */}
            {loading ? (
                <div className="text-center p-10 text-xl">Загрузка поездок...</div>
            ) : error ? (
                <div className="text-red-600 text-center p-10 text-xl">{error}</div>
            ) : trips.length === 0 ? (
                <p className="text-center text-gray-600 text-2xl">Поездок не найдено</p>
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
                                <p className="text-indigo-600 font-bold text-lg">
                                    Цена: {trip.price} ₽
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
    );
}