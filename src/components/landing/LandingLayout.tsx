import { Outlet } from "react-router-dom";
import LandingHeader from "./LandingHeader";
import LandingFooter from "./LandingFooter";
import { CookieConsent } from "@/components/CookieConsent";
import { ProductChatWidget } from "@/components/landing/ProductChatWidget";

const LandingLayout = () => (
  <div className="min-h-screen flex flex-col">
    <LandingHeader />
    <main className="flex-1 pt-16">
      <Outlet />
    </main>
    <LandingFooter />
    <CookieConsent />
    <ProductChatWidget />
  </div>
);

export default LandingLayout;
