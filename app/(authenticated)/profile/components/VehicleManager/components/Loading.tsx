import React from "react";

const Loading = () => {
  return (
    <div className="space-y-4 p-4">
      {[...Array(3)].map((_, index) => (
        <div
          key={index}
          className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-gray-700 animate-pulse"
        >
          <div className="flex items-center">
            <div className="rounded-full bg-gray-700 p-2 mr-3 w-9 h-9"></div>
            <div className="space-y-2">
              <div className="h-4 w-32 bg-gray-700 rounded"></div>
              <div className="h-3 w-48 bg-gray-600 rounded"></div>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-8 bg-gray-700 rounded"></div>
            <div className="h-8 w-8 bg-gray-700 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Loading;
