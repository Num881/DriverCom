export default function App() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-6">
            <div className="bg-white/10 backdrop-blur-2xl p-12 rounded-3xl shadow-2xl border border-white/20 max-w-2xl w-full text-center">
                <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-pink-300 mb-6 drop-shadow-lg">
                    DriverSite
                </h1>

                <p className="text-xl md:text-2xl text-gray-200 font-light mb-12">
                    Бронируй места в машинах друзей — быстро, удобно и без споров
                </p>

                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                    <a
                        href="/login"
                        className="inline-block px-10 py-5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold text-lg rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                    >
                        Войти
                    </a>

                    <a
                        href="/register"
                        className="inline-block px-10 py-5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-bold text-lg rounded-full border border-white/40 transition-all duration-300 transform hover:scale-105"
                    >
                        Зарегистрироваться
                    </a>
                </div>
            </div>
        </div>
    )
}