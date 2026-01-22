import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';  // ← ОБЯЗАТЕЛЬНЫЙ ИМПОРТ

export default function CreateTrip() {
    const [fromCity, setFromCity] = useState('');
    const [toCity, setToCity] = useState('');
    const [date, setDate] = useState('');
    const [price, setPrice] = useState('');
    const [seatsTotal, setSeatsTotal] = useState('');
    const [carModel, setCarModel] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const role = localStorage.getItem('role');
        if (role !== 'driver') {
            toast.error('Создавать поездки могут только водители');
            navigate('/');
        }
    }, [navigate]);

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Проверяем на фронте
        if (!fromCity.trim() || !toCity.trim() || !date || !price || !seatsTotal || !carModel.trim()) {
            setError('Все поля обязательны');
            setLoading(false);
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        toast.promise(
            fetch('http://localhost:3000/drivers/trips', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    from_city: fromCity.trim(),
                    to_city: toCity.trim(),
                    date,
                    price: Number(price),
                    seats_total: Number(seatsTotal),
                    car_model: carModel.trim(),
                }),
            }).then(async res => {
                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.error || 'Ошибка создания поездки');
                }
                return res.json();
            }),
            {
                loading: 'Создаём поездку...',
                success: 'Поездка создана!',
                error: (err) => err.message || 'Неизвестная ошибка',
            }
        ).then(() => {
            navigate('/');
        }).catch(() => {
            // toast.error уже показан через promise
        }).finally(() => {
            setLoading(false);
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-lg">
                <h1 className="text-3xl font-bold mb-8 text-center">Создать поездку</h1>

                {error && <p className="text-red-600 text-center mb-6">{error}</p>}

                <form onSubmit={handleCreate} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Откуда (город)</label>
                        <input
                            type="text"
                            value={fromCity}
                            onChange={(e) => setFromCity(e.target.value)}
                            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Куда (город)</label>
                        <input
                            type="text"
                            value={toCity}
                            onChange={(e) => setToCity(e.target.value)}
                            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Дата поездки</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Цена за место (руб)</label>
                        <input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                            min="1"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Количество мест</label>
                        <input
                            type="number"
                            value={seatsTotal}
                            onChange={(e) => setSeatsTotal(e.target.value)}
                            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                            min="1"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Модель машины</label>
                        <input
                            type="text"
                            value={carModel}
                            onChange={(e) => setCarModel(e.target.value)}
                            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center"
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        ) : 'Создать поездку'}
                    </button>
                </form>

                <p className="mt-6 text-center text-gray-600">
                    <button
                        onClick={() => navigate('/')}
                        className="text-blue-600 hover:underline"
                    >
                        Вернуться на главную
                    </button>
                </p>
            </div>
        </div>
    );
}