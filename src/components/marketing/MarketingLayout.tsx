import { Outlet } from 'react-router-dom';
import MarketingHeader from './MarketingHeader';
import MarketingFooter from './MarketingFooter';

export default function MarketingLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <MarketingHeader />
      <main className="flex-1 pt-16">
        <Outlet />
      </main>
      <MarketingFooter />
    </div>
  );
}
