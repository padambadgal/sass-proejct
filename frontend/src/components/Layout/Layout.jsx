import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const Layout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Sidebar />
      <main className="p-4 md:ml-64 pt-20">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;