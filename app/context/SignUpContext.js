// app/context/SignUpContext.js
import React, { createContext, useState } from 'react';

export const SignUpContext = createContext();

export const SignUpProvider = ({ children }) => {
  const [signUpData, setSignUpData] = useState({
    email: '',
    password: '',
  });

  return (
    <SignUpContext.Provider value={{ signUpData, setSignUpData }}>
      {children}
    </SignUpContext.Provider>
  );
};
