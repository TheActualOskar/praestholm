import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import AnimatedBackground from "./AnimatedBackground";
import ScrollToTop from "./ScrollToTop";

export default function AppLayout() {
    return (
        <div className="app-shell">
            <AnimatedBackground />
            <ScrollToTop />
            <Header />
            <main style={{ flex: 1 }}>
                <Outlet />
            </main>
            <Footer />
        </div>
    );

}
