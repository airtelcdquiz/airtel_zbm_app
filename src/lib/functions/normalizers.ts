export function normalizePhone(tel: string): string {
    tel = tel.replace(/\D/g, ''); // Enlever tout sauf les chiffres

    if (tel.startsWith('0')) {
        // Ex: 0987654321 → 2439 + 87654321
        return '243' + tel.slice(1);
    }

    if (tel.startsWith('243')) {
        return tel;
    }

    if (tel.startsWith('9') && tel.length === 9) {
        // Ex: 987654321 → 2439 + 87654321
        return '243' + tel;
    }

    // Si le numéro ne correspond pas à un format reconnu, retourner tel sans modif
    return tel;
}