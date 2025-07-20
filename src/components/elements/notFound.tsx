import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFoundComponent() {
  return (
    <div className="min-h-[80%] flex items-center justify-center px-4 py-16 bg-gray-50">
      <div className="max-w-md w-full text-center">
        {/* Error Code */}
        <h1 className="text-6xl font-extrabold text-gray-800 mb-2">404</h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-8">
          The page you’re looking for doesn’t exist or has been moved.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </button>
        </div>

        {/* Optional Help */}
        <div className="mt-8 text-sm text-gray-500">
          <p>If you believe this is an error, please <a href="/contact" className="text-blue-600 hover:underline">contact support</a>.</p>
        </div>
      </div>
    </div>
  );
}
