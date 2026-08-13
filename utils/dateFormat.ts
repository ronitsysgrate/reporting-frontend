// DD/MM/YYYY, HH:MM:SS
export const formatDateTime = (datestr: string | undefined): string => {
    if (!datestr) return '-';

    const date = datestr.split('T')[0];
    const time = datestr.split('T')[1]?.slice(0, 8);

    return `${date}, ${time}`;
};

// DD/MM/YYYY
export const formatDate = (datestr: string | undefined): string => {
    if (!datestr) return '-';
    return datestr.split('T')[0];
}

// ms to HH:MM:SS
export const formatDuration = (duration: number | string | undefined): string => {
    if (duration === undefined || duration === null || duration === '') return '00:00:00';

    const ms = Number(duration);
    if (isNaN(ms) || ms < 0) return '00:00:00';

    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};