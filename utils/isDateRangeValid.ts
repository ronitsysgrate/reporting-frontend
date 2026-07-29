import toast from "react-hot-toast";

export const isDateRangeValid = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const diffTime = end.getTime() - start.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    if (diffDays > 31) {
        toast.error('Date range should not be more than one month');
        return false;
    }

    return true;
};