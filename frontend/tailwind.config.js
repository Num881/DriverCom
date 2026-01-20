/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/**/*.{js,ts,jsx,tsx}",
        "./src/*.tsx",
        "./src/**/*.tsx",
    ],
    safelist: [  // ← это ключевой блок!
        'bg-purple-900',
        'from-purple-900',
        'via-indigo-900',
        'to-pink-900',
        'bg-gradient-to-br',
        'backdrop-blur-2xl',
        'bg-white/10',
        'border-white/30',
        'text-white',
        'text-gray-200',
        'text-6xl',
        'font-black',
    ],
    theme: {
        extend: {
            colors: {
                // Добавляем цвета явно, чтобы Tailwind их точно сгенерировал
                purple: {
                    900: '#581c87',
                },
                indigo: {
                    900: '#312e81',
                },
                pink: {
                    900: '#831843',
                    500: '#ec4899',
                    600: '#db2777',
                },
                cyan: {
                    300: '#67e8f9',
                },
            },
        },
    },
    plugins: [],
}