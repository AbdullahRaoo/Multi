import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';

const isDockerBuild = !!process.env.DOCKER_BUILD;

export default defineConfig({
    base: '/meb/',
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react(),
        tailwindcss(),
        // Wayfinder needs `php artisan` — skip in Docker builds where PHP isn't available
        ...(!isDockerBuild ? [wayfinder({ formVariants: true })] : []),
    ],
    esbuild: {
        jsx: 'automatic',
    },
});
