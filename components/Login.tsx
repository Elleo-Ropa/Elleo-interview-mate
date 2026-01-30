import React from 'react';
import { supabase } from '../services/supabase';

export const Login: React.FC = () => {
    const handleGoogleLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                },
            });
            if (error) throw error;
        } catch (error: any) {
            alert('로그인 에러: ' + error.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans">
            <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-lg flex flex-col items-center">
                <div className="flex flex-col items-center text-center">
                    <img
                        src="https://www.sushia.com.au/wp-content/uploads/2026/01/Elleo-Group-Logo-B.svg"
                        alt="Elleo Group Logo"
                        className="h-11 w-auto mb-6 object-contain"
                    />
                    <h2 className="text-3xl font-extrabold text-elleo-dark font-montserrat tracking-tight uppercase">
                        Elleo Interview Mate
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        인터뷰 관리를 위해 로그인해주세요
                    </p>
                </div>
                <div className="mt-8 space-y-6 w-full">
                    <button
                        onClick={handleGoogleLogin}
                        className="group relative w-64 mx-auto flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-md text-white bg-elleo-purple hover:bg-elleo-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-elleo-purple transition-colors duration-200 shadow-md hover:shadow-lg"
                    >
                        <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                            {/* Google 'G' Logo (White version for contrast on purple) */}
                            <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.38 0 9.25-4.04 9.25-9.51 0-.48-.07-1.11-.15-1.39h-.01z" />
                            </svg>
                        </span>
                        Google 계정으로 로그인
                    </button>
                </div>
            </div>
        </div>
    );
};
