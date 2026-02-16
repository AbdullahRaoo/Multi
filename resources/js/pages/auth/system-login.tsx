import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import InputError from '@/components/input-error';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Shield, Lock, Eye, EyeOff, User } from 'lucide-react';
import { useState } from 'react';

export default function SystemLogin() {
    const { basePath } = usePage().props as any;
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors } = useForm({
        username: '',
        password: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(`${basePath || ''}/system-login`);
    };

    return (
        <>
            <Head title="Login" />

            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#1a3640] via-[#264c59] to-[#1a3640] p-6">
                {/* Background decorations */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-[#f7a536]/10 blur-3xl" />
                    <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-[#264c59]/30 blur-3xl" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-[#f7a536]/5 blur-2xl" />
                </div>

                <div className="relative w-full max-w-md">
                    <Card className="border-0 shadow-2xl overflow-hidden bg-white/95 backdrop-blur-sm">
                        {/* Header accent bar */}
                        <div className="h-1.5 bg-gradient-to-r from-[#264c59] via-[#f7a536] to-[#264c59]" />

                        <CardHeader className="pt-8 pb-4 text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#264c59] to-[#3d6b7a] shadow-lg shadow-[#264c59]/25">
                                <Shield className="h-8 w-8 text-white" />
                            </div>
                            <CardTitle className="text-2xl font-bold text-slate-800">MagicQC Login</CardTitle>
                            <CardDescription className="text-sm text-slate-500 mt-2">
                                Authorized personnel access only
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="pb-8 px-8">
                            <form onSubmit={submit} className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="username" className="text-sm font-medium text-slate-700">
                                        Username
                                    </Label>
                                    <div className="relative">
                                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                                        <Input
                                            id="username"
                                            type="text"
                                            name="username"
                                            value={data.username}
                                            className="h-12 pl-11 text-base border-slate-200 focus:border-[#264c59] focus:ring-[#264c59]/20"
                                            placeholder="Enter username"
                                            onChange={(e) => setData('username', e.target.value)}
                                            required
                                            autoFocus
                                            autoComplete="username"
                                        />
                                    </div>
                                    <InputError message={errors.username} className="mt-1" />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                                        Password
                                    </Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                                        <Input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            value={data.password}
                                            className="h-12 pl-11 pr-12 text-base border-slate-200 focus:border-[#264c59] focus:ring-[#264c59]/20"
                                            placeholder="Enter password"
                                            onChange={(e) => setData('password', e.target.value)}
                                            required
                                            autoComplete="new-password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-5 w-5" />
                                            ) : (
                                                <Eye className="h-5 w-5" />
                                            )}
                                        </button>
                                    </div>
                                    <InputError message={errors.password} className="mt-1" />
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-12 text-base font-medium text-white bg-gradient-to-r from-[#264c59] to-[#3d6b7a] hover:from-[#1a3640] hover:to-[#264c59] shadow-lg shadow-[#264c59]/25 transition-all hover:shadow-xl"
                                    disabled={processing}
                                >
                                    {processing ? (
                                        <span className="flex items-center gap-2">
                                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                            Authenticating...
                                        </span>
                                    ) : (
                                        <>
                                            <Shield className="mr-2 h-5 w-5 text-white" />
                                            <span className="text-white">Sign In</span>
                                        </>
                                    )}
                                </Button>
                            </form>

                            <div className="mt-6 text-center">
                                <Link
                                    href={`${basePath || ''}/`}
                                    className="text-sm text-slate-500 hover:text-[#264c59] transition-colors"
                                >
                                    ← Back to Home
                                </Link>
                            </div>
                        </CardContent>
                    </Card>

                    <p className="mt-4 text-center text-xs text-white/40">
                        MagicQC Quality Control System &bull; Secured Access
                    </p>
                </div>
            </div>
        </>
    );
}
