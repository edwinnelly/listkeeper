'use client';
import Productlist from "../purchase/items";

export default function DashboardPage() {
  // const [sidebarOpen, setSidebarOpen] = useState(false);
  
  return (
    <div className="flex h-screen bg-gray-100">
    
      {/* Main Content */}
      <div className="flex flex-col flex-1">
        <Productlist />
      </div>
    </div>
  );
}

