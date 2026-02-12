import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import InputError from '@/components/input-error';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Code2, Lock, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

export default function DeveloperLogin() {
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors } = useForm({
        password: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/developer-login');
    };

    return (
        <>
            <Head title="Developer Login" />

            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
                {/* Background decorations */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-[#264c59]/20 blur-3xl" />
                    <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-[#f7a536]/10 blur-3xl" />
                </div>

                <div className="relative w-full max-w-md">
                    <Card className="border-0 shadow-2xl overflow-hidden">
                        {/* Header with gradient */}
                        <div className="h-2 bg-gradient-to-r from-[#264c59] to-[#3d6b7a]" />

                        <CardHeader className="pt-8 pb-4 text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#264c59]/5 border border-[#264c59]/10">
                                <Code2 className="h-8 w-8 text-[#264c59]" />
                            </div>
                            <CardTitle className="text-2xl font-bold text-slate-800">Developer Access</CardTitle>
                            <CardDescription className="text-base text-slate-500 mt-2">
                                Enter developer password to continue
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="relative z-10 bg-white rounded-t-2xl -mt-2 pt-6 pb-6">
                            <form onSubmit={submit} className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                                        Password
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            value={data.password}
                                            className="h-12 pr-12 text-base border-slate-200 focus:border-[#264c59] focus:ring-[#264c59]"
                                            placeholder="Enter developer password"
                                            onChange={(e) => setData('password', e.target.value)}
                                            required
                                            autoFocus
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
                                    <InputError message={errors.password} className="mt-2" />
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-12 text-base font-medium text-white bg-gradient-to-r from-[#264c59] to-[#3d6b7a] hover:from-[#1a3640] hover:to-[#264c59]"
                                    disabled={processing}
                                >
                                    {processing ? (
                                        <span className="text-white">Verifying...</span>
                                    ) : (
                                        <>
                                            <Lock className="mr-2 h-5 w-5 text-white" />
                                            <span className="text-white">Access Developer Mode</span>
                                        </>
                                    )}
                                </Button>
                            </form>

                            <div className="mt-6 text-center">
                                <Link
                                    href="/"
                                    className="text-sm text-slate-500 hover:text-[#264c59] transition-colors"
                                >
                                    ← Back to Home
                                </Link>
                            </div>
                        </CardContent>
                    </Card>

                    <p className="mt-4 text-center text-sm text-slate-400">
                        Developer access is restricted to authorized personnel
                    </p>
                </div>
            </div>
        </>
    );
}
