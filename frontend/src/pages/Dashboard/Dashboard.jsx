import { useAuth } from '../../context/AuthContext';

const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="mt-2">Welcome, {user?.name}!</p>
      <button
        onClick={logout}
        className="mt-4 bg-red-500 text-white px-4 py-2 rounded"
      >
        Logout
      </button>
    </div>
  );
};

export default Dashboard;