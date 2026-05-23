import { Outlet } from 'react-router';
import Navbar from '../Components/Navbar';
import Footer from '../Components/Footer';
import ChatWidget from '../Components/ChatWidget';

const CONNECT_INSTANCE_URL = import.meta.env.VITE_CONNECT_INSTANCE_URL ?? 'https://placeholder.awsapps.com/connect';
const CONTACT_FLOW_ID = import.meta.env.VITE_CONTACT_FLOW_ID ?? 'placeholder-flow-id';

const Layout = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <ChatWidget
        connectInstanceUrl={CONNECT_INSTANCE_URL}
        contactFlowId={CONTACT_FLOW_ID}
      />
    </div>
  );
};

export default Layout;
