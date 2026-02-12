import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { login, register } from '@/routes';

export default function Login({ status, canResetPassword }: { status?: string; canResetPassword?: boolean }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(login().url, {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="Log in" />

            <div className="flex min-h-screen flex-col items-center justify-center bg-[#FDFDFC] p-6 text-[#1b1b18] dark:bg-[#0a0a0a] dark:text-[#EDEDEC]">
                <div className="w-full max-w-md space-y-8 rounded-lg border border-[#19140035] bg-white p-8 shadow-sm dark:border-[#3E3E3A] dark:bg-[#161615]">
                    <div>
                        <h2 className="text-center text-2xl font-semibold">Log in to your account</h2>
                        <p className="mt-2 text-center text-sm text-neutral-600 dark:text-neutral-400">
                            Or{' '}
                            <Link href={register()} className="font-medium text-[#f53003] hover:underline dark:text-[#FF4433]">
                                create a new account
                            </Link>
                        </p>
                    </div>

                    {status && (
                        <div className="rounded-md bg-green-50 p-4 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
                            {status}
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email address</Label>
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                className="mt-1 block w-full"
                                autoComplete="username"
                                onChange={(e) => setData('email', e.target.value)}
                                required
                                autoFocus
                            />
                            <InputError message={errors.email} className="mt-2" />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                name="password"
                                value={data.password}
                                className="mt-1 block w-full"
                                autoComplete="current-password"
                                onChange={(e) => setData('password', e.target.value)}
                                required
                            />
                            <InputError message={errors.password} className="mt-2" />
                        </div>

                        <div className="flex items-center">
                            <input
                                id="remember"
                                name="remember"
                                type="checkbox"
                                checked={data.remember}
                                onChange={(e) => setData('remember', e.target.checked)}
                                className="h-4 w-4 rounded border-neutral-300 text-[#f53003] focus:ring-[#f53003] dark:border-neutral-600 dark:focus:ring-[#FF4433]"
                            />
                            <Label htmlFor="remember" className="ml-2 text-sm">
                                Remember me
                            </Label>
                        </div>

                        <div className="flex items-center justify-end">
                            <Button className="w-full" disabled={processing}>
                                Log in
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

