/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
            },
            colors: {
                background: "rgb(var(--background))",
                foreground: "rgb(var(--foreground))",
                card: "rgb(var(--card))",
                "card-foreground": "rgb(var(--card-foreground))",
                popover: "rgb(var(--popover))",
                "popover-foreground": "rgb(var(--popover-foreground))",
                primary: "rgb(var(--primary))",
                "primary-foreground": "rgb(var(--primary-foreground))",
                secondary: "rgb(var(--secondary))",
                "secondary-foreground": "rgb(var(--secondary-foreground))",
                muted: "rgb(var(--muted))",
                "muted-foreground": "rgb(var(--muted-foreground))",
                accent: "rgb(var(--accent))",
                "accent-foreground": "rgb(var(--accent-foreground))",
                destructive: "rgb(var(--destructive))",
                "destructive-foreground": "rgb(var(--destructive-foreground))",
                border: "rgb(var(--border))",
                input: "rgb(var(--input))",
                ring: "rgb(var(--ring))",
                // Pluma brand colors
                'pluma': {
                    'orange': '#FF6A00',
                    'orange-600': '#E15B00',
                    'teal': '#1C3F3A',
                    'success': '#23D18B',
                    'safety': '#EBE8D8',
                },
            },
            borderRadius: {
                'lg': '20px',    // Pluma lg
                'md': '12px',    // Pluma md  
                'sm': '8px',     // Pluma sm
            },
            boxShadow: {
                'elevated': '0 8px 30px rgba(0,0,0,0.6)',
                'card': '0 6px 18px rgba(0,0,0,0.55)',
            },
            spacing: {
                '0': '4px',
                '1': '8px',
                '2': '16px',
                '3': '24px',
                '4': '32px',
                '5': '48px',
            },
            transitionDuration: {
                '120': '120ms',
                '200': '200ms',
            },
            transitionTimingFunction: {
                'pluma': 'cubic-bezier(.18,.9,.32,1)',
            },
            maxWidth: {
                'container': '1200px',
            },
        },
    },
    plugins: [],
}
