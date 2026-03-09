import React, {createContext, useState} from "react";

export const AuthContext = createContext();

export const AuthProvider = ({children}) => {

    const [isLoading,setIsLoading] = useState(false);
    const [userToken,setUserToken] = useState(null);
    const [userDetails,setUserDeatils] = useState([]);

    const UserLogin = () => {
        setUserToken('jhbiakbfkf');
        setIsLoading(false);
    }

    const UserLogOut = () => {
        setUserToken(null);
        setIsLoading(false);
    }

    const saveUserDeatils = (ob) =>{
        setUserDeatils(ob)
    }

    return (
        <AuthContext.Provider value={{UserLogOut, UserLogin,saveUserDeatils, isLoading, userToken, userDetails}}>
            {children}
        </AuthContext.Provider>
    )
}