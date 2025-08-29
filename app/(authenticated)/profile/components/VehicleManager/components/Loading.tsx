import React from "react";

const Loading = () => {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      {/* Animated shimmer spinner */}
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 border-4 border-gray-700 border-t-emerald-600 rounded-full animate-spin"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse rounded-full"></div>
      </div>
      {/* Shimmer text placeholder */}
      <div className="mt-4 h-4 w-32 bg-gray-700/50 rounded animate-pulse"></div>
    </div>
  );
};

export default Loading;