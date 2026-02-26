import React from 'react';
import { ScanFace } from 'lucide-react';
export function Header() {
  return (
    <header className="bg-primary-950 text-white border-b border-primary-900 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-primary-500 p-2 rounded-lg">
            <ScanFace className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Jessified
            </h1>
            <p className="text-xs text-primary-200 font-medium tracking-wide uppercase">
              Facecheck Attendance Processor
            </p>
          </div>
        </div>
        <div className="text-sm text-primary-200 hidden sm:block">v1.0.0</div>
      </div>
    </header>);

}