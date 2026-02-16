import { usePage } from '@inertiajs/react';

export default function AppLogo() {
    const { basePath } = usePage().props as any;
    return (
        <div className="flex items-center justify-center">
            <img
                src={`${basePath || ''}/MagicQC logo.png`}
                alt="MagicQC"
                className="h-8 w-auto object-contain"
            />
        </div>
    );
}
