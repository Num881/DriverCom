import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function EditTrip() {
    const { id } = useParams<{ id: string }>(); // ← типизация params
    const navigate = useNavigate();
    const [form, setForm] = useState({
        from_city: '',
        to_city: '',
        date: '',
        price: '',
        seats_total: '',
        car_model: '',
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchTrip = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            try {
                const res = await fetch(`http://localhost:3000/drivers/trips/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error('Ошибка загрузки');
                const data = await res.json();
                setForm({
                    from_city: data.from_city || '',
                    to_city: data.to_city || '',
                    date: data.date || '',
                    price: data.price?.toString() || '',
                    seats_total: data.seats_total?.toString() || '',
                    car_model: data.car_model || '',
                });
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Неизвестная ошибка';
                setError(message);
            } finally {
                setLoading(false);
            }
        };
        fetchTrip();
    }, [id, navigate]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const res = await fetch(`http://localhost:3000/drivers/trips/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    from_city: form.from_city.trim(),
                    to_city: form.to_city.trim(),
                    date: form.date,
                    price: Number(form.price),
                    seats_total: Number(form.seats_total),
                    car_model: form.car_model.trim(),
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'Ошибка обновления');
            }

            toast.success('Поездка обновлена!');
            navigate('/my-trips');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Неизвестная ошибка';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="text-center p-10">Загрузка...</div>;
    if (error) return <div className="text-red-600 text-center p-10">{error}</div>;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-lg">
                <h1 className="text-3xl font-bold mb-8 text-center">Редактировать поездку</h1>

                {error && <p className="text-red-600 text-center mb-6">{error}</p>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Откуда</label>
                        <input
                            type="text"
                            value={form.from_city}
                            onChange={e => setForm({ ...form, from_city: e.target.value })}
                            className="w-full p-3 border rounded-lg"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Куда</label>
                        <input
                            type="text"
                            value={form.to_city}
                            onChange={e => setForm({ ...form, to_city: e.target.value })}
                            className="w-full p-3 border rounded-lg"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Дата</label>
                        <input
                            type="date"
                            value={form.date}
                            onChange={e => setForm({ ...form, date: e.target.value })}
                            className="w-full p-3 border rounded-lg"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Цена</label>
                        <input
                            type="number"
                            value={form.price}
                            onChange={e => setForm({ ...form, price: e.target.value })}
                            className="w-full p-3 border rounded-lg"
                            required
                            min="1"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Мест</label>
                        <input
                            type="number"
                            value={form.seats_total}
                            onChange={e => setForm({ ...form, seats_total: e.target.value })}
                            className="w-full p-3 border rounded-lg"
                            required
                            min="1"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Машина</label>
                        <input
                            type="text"
                            value={form.car_model}
                            onChange={e => setForm({ ...form, car_model: e.target.value })}
                            className="w-full p-3 border rounded-lg"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50"
                    >
                        {loading ? 'Сохраняем...' : 'Сохранить изменения'}
                    </button>
                </form>
            </div>
        </div>
    );
}