import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

const PaymentSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/dashboard');
    }, 4000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
        <h2 className="mt-4 text-2xl font-bold text-gray-900">Payment Successful! 🎉</h2>
        <p className="mt-2 text-gray-600">Your subscription is now active.</p>
        <p className="mt-1 text-sm text-gray-500">You can now start setting up your business.</p>
        <div className="mt-4 p-3 bg-gray-50 rounded-md text-sm text-gray-500">
          Redirecting to dashboard...
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;