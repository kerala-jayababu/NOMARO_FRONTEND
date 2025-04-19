import { createContext, useContext, useState } from 'react';
import { ThreeDots } from 'react-loader-spinner';

const LoaderContext = createContext();

export const LoaderProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  
  const showLoader = () => setLoading(true);
  const hideLoader = () => setLoading(false);

  return (
    <LoaderContext.Provider value={{ showLoader, hideLoader }}>
      {children}
      
      {loading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999
        }}>
          <ThreeDots 
            height="80" 
            width="80" 
            radius="9"
            color="#0d384d" 
            ariaLabel="three-dots-loading"
            visible={true}
          />
        </div>
      )}
    </LoaderContext.Provider>
  );
};

export const useLoader = () => useContext(LoaderContext);