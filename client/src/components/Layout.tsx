import { Outlet } from "react-router-dom";

const Layout = () => {
  return (
    <main className="min-w-[410px] w-full bg-background">
      <Outlet />
    </main>
  );
};

export default Layout;
