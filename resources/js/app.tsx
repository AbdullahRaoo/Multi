import '../css/app.css';

import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';

const appName = import.meta.env.VITE_APP_NAME || 'MagicQC';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ el, App, props }) {
        // Get the basePath from shared props (e.g. "/meb")
        const basePath = (props.initialPage.props as any).basePath || '';

        // Fix the initial page URL to include /meb prefix
        // (WordPress proxy strips /meb/ before forwarding to Laravel)
        if (basePath && !props.initialPage.url.startsWith(basePath)) {
            props.initialPage.url = basePath + props.initialPage.url;
        }

        const root = createRoot(el);
        root.render(<App {...props} />);

        // Intercept all Inertia navigations to prepend basePath
        if (basePath) {
            router.on('before', (event) => {
                const url = event.detail.visit.url;
                if (url.pathname && !url.pathname.startsWith(basePath)) {
                    url.pathname = basePath + url.pathname;
                }
            });
        }
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
