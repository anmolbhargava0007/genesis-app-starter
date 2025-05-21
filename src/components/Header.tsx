import UserMenu from "./UserMenu";
import { useAuth } from "@/context/AuthContext";
import logo from "./../../public/icons/logo-light1.png";

const Header = () => {
  const { isAuthenticated } = useAuth();

  return (
    <header className="w-full p-2 flex justify-between items-center border-b bg-[#D3D3D3] text-white">
      <img src={logo} alt="Logo" className="h-20 w-auto" />
      {isAuthenticated && <UserMenu />}
    </header>
  );
};

export default Header;
