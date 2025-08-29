import React from "react";

const Loading = () => {
  return (
    <div className="p-6">
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-gray-700 animate-pulse"
          >
            <div className="flex items-center w-full">
              <div className="rounded-full bg-emerald-700 p-2 mr-3 w-9 h-9 flex-shrink-0"></div>
              <div className="space-y-2 flex-grow">
                <div className="h-5 w-28 bg-gray-700 rounded"></div>
                <div className="h-3.5 w-40 bg-gray-600 rounded"></div>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <div className="h-8 w-8 bg-gray-700 rounded-md"></div>
              <div className="h-8 w-8 bg-red-600/50 rounded-md"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Loading;