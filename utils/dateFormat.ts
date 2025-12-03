// DD/MM/YYYY, HH:MM:SS
export const formatDateTime = (datestr: string | undefined): string => {
    if (!datestr) return '-';

    const date = new Date(datestr);

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');

    return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
};

// DD/MM/YYYY
export const formatDate = (datestr: string | undefined): string => {
    if (!datestr) return '-';

    const date = new Date(datestr);

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
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