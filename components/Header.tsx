
import React from 'react';
import { APP_TITLE } from '../constants';

const Header: React.FC = () => {
  return (
    <header className="bg-gray-800 shadow-lg p-4 sm:p-6">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <i className="fas fa-magic text-3xl text-purple-400"></i>
          <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
            {APP_TITLE}
          </h1>
        </div>
      </div>
    </header>
  );
};

export default Header;
