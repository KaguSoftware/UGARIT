import React from "react";

interface MaxWidthWrapperProps {
    children: React.ReactNode;
    className?: string; // Allows you to pass extra styles if needed
}

const MaxWidthWrapper = ({
    children,
    className = "",
}: MaxWidthWrapperProps) => {
    return (
        <div className={`w-full max-w-400 mx-auto px-4 md:px-6 ${className}`}>
            {children}
        </div>
    );
};

export default MaxWidthWrapper;
