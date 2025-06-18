
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-gray-400 p-4 text-center mt-auto">
      <p>&copy; {new Date().getFullYear()} Image Enhancer Pro. All rights reserved.</p>
      <p className="text-sm">Powered by React and Tailwind CSS</p>
    </footer>
  );
};

export default Footer;