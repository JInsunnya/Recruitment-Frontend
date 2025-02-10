import axios from 'axios';
import React from 'react';

export const useLogout = () => {
  const handleLogout = async (token, setIsLogout) => {
    try {
      const response = await axios.post(
        'https://woodzverse.pythonanywhere.com/member/logout/',
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log(response);
      localStorage.removeItem('access_token');
      window.dispatchEvent(new Event('storage'));
      alert("로그아웃을 성공하였습니다")
      setIsLogout(true);
    } catch (error) {
      console.log(error);
      console.log(token);
    }
  };

  return {
    handleLogout,
  };
};
