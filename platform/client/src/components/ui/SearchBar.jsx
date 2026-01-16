import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

export function SearchBar({ value, onChange, placeholder = "Search...", className, ...props }) {
    return (
        <div className={cn("relative", className)}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="pl-8 lg:pl-10 bg-white border-slate-200 focus:ring-slate-900 focus:border-slate-900 rounded-lg text-sm"
                {...props}
            />
        </div>
    );
}
