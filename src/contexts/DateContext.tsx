'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

interface DateContextValue {
    date: string; // YYYY-MM-DD
    setDate: (date: string) => void;
    apiDate: string | undefined; // YYYY/MM/DD or undefined for today
}

const today = () => new Date().toISOString().split('T')[0];

const DateContext = createContext<DateContextValue>({
    date: today(),
    setDate: () => {},
    apiDate: undefined,
});

export function DateProvider({ children }: { children: ReactNode }) {
    const [date, setDate] = useState(today());
    const apiDate = date === today() ? undefined : date.replace(/-/g, '/');

    return (
        <DateContext.Provider value={{ date, setDate, apiDate }}>
            {children}
        </DateContext.Provider>
    );
}

export function useDate() {
    return useContext(DateContext);
}
