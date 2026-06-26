import React, { createContext, useContext, useState, useEffect } from 'react';

interface UIContextType {
  isModalOpen: boolean;
  setModalOpen: (isOpen: boolean) => void;
  isAddIncomeOpen: boolean;
  setIsAddIncomeOpen: (isOpen: boolean) => void;
}

const UIContext = createContext<UIContextType>({
  isModalOpen: false,
  setModalOpen: () => {},
  isAddIncomeOpen: false,
  setIsAddIncomeOpen: () => {},
});

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddIncomeOpen, setIsAddIncomeOpen] = useState(false);

  return (
    <UIContext.Provider value={{ 
      isModalOpen, 
      setModalOpen: setIsModalOpen,
      isAddIncomeOpen,
      setIsAddIncomeOpen: setIsAddIncomeOpen
    }}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => useContext(UIContext);
