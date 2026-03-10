import { Outlet } from "react-router-dom";
import LandingHeader from "./LandingHeader";
import LandingFooter from "./LandingFooter";

const LandingLayout = () => (
  <div className="min-h-screen flex flex-col">
    <LandingHeader />
    <main className="flex-1 pt-16">
      <Outlet />
    </main>
    <LandingFooter />
  </div>
);

export default LandingLayout;
