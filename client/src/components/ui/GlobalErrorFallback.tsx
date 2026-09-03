import type { FallbackProps } from 'react-error-boundary';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import { Button } from './button';

export const GlobalErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-xl border border-red-100 p-8 text-center space-y-6">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <AlertTriangle className="w-10 h-10 text-red-600" />
                </div>
                
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
                    <p className="text-sm text-gray-500">
                        An unexpected error occurred in the application. Our technical team has been notified.
                    </p>
                </div>

                <div className="bg-red-50 text-red-800 text-xs text-left p-4 rounded-lg overflow-auto max-h-32 border border-red-100 font-mono">
                    {error instanceof Error ? error.message : 'Unknown render error.'}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button 
                        onClick={resetErrorBoundary} 
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    >
                        <RefreshCcw className="w-4 h-4 mr-2" />
                        Try Again
                    </Button>
                    <Button 
                        variant="outline"
                        onClick={() => window.location.href = '/'}
                        className="flex-1"
                    >
                        <Home className="w-4 h-4 mr-2" />
                        Go Home
                    </Button>
                </div>
            </div>
        </div>
    );
};
