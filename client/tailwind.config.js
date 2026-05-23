/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                nss: {
                    blue: '#000080', // Navy Blue
                    red: '#C21E2B',   // Red
                }
            }
        },
    },
    plugins: [],
}
