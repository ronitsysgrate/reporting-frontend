import { useMemo } from 'react';

interface DateRange {
    today: string;
    pastDate: string;
}

export const useDateRange = (): DateRange => {
    const today = new Date();
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - 28);

    const formatDate = (date: Date): string => {
        return date.toISOString().split('T')[0];
    };

    return useMemo(
        () => ({
            today: formatDate(today),
            pastDate: formatDate(pastDate),
        }),
        []
    );
};