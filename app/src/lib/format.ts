// Formatage partagé client/serveur (pas de 'use client' ici).

export const fmtInt = (n: number | null | undefined) => (n === null || n === undefined ? '—' : n.toLocaleString('fr-FR'));

export const fmtDate = (iso: string | null | undefined, withTime = true) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('fr-FR', {
        timeZone: 'Africa/Kinshasa', day: '2-digit', month: 'short', year: 'numeric',
        ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    });
};

/** "243970908479" -> "+243 970 908 479" */
export const fmtPhone = (p?: string | null) => {
    if (!p) return '—';
    const m = /^243(\d{3})(\d{3})(\d{3})$/.exec(p);
    return m ? `+243 ${m[1]} ${m[2]} ${m[3]}` : p;
};
