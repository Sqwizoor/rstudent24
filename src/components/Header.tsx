import React from "react";

const Header = ({ title, subtitle }: HeaderProps) => {
  return (
    <div className="mb-5">
      <h1 className="text-xl font-bold text-[#043e55]">{title}</h1>
      <p className="text-sm text-[#536167] font-normal mt-1">{subtitle}</p>
    </div>
  );
};

export default Header;