import { createContext, ReactNode } from "react";

export interface AuthDataContextType {
  serverUrl: string;
}

export const AuthDataContext = createContext<AuthDataContextType | undefined>(undefined);

interface AuthContextProps {
  children: ReactNode;
}

const AuthContext = ({ children }: AuthContextProps) => {
  // const serverUrl="https://vibeshare-backend-j92a.onrender.com";
  const serverUrl = "http://localhost:8901";
  const value: AuthDataContextType = {
    serverUrl,
  };

  return (
    <AuthDataContext.Provider value={value}>
      {children}
    </AuthDataContext.Provider>
  );
};

export default AuthContext;