'use client'
/** Mode d'emploi du TV Show (onglet de la page Démo). */
import React from 'react';
import { MonitorPlay, Radio, Smartphone } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/kit';

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
    return (
        <Card>
            <CardHeader title={title} description={description} />
            <div className="space-y-3 px-5 py-4 text-sm leading-relaxed text-ink-700">{children}</div>
        </Card>
    );
}

const Ussd = ({ children }: { children: string }) => (
    <pre className="whitespace-pre-wrap rounded-lg bg-[#dfe6d8] p-3 font-mono text-[12px] leading-snug text-ink-900">{children}</pre>
);

function Timeline() {
    // Exemple : durée 20 s, délai 5 s. Échelle : 30 s = 100 %.
    const pct = (s: number) => `${(s / 30) * 100}%`;
    const Row = ({ label, from, to, tone, text }: { label: string; from: number; to: number; tone: string; text: string }) => (
        <div className="grid grid-cols-[96px_minmax(0,1fr)] items-center gap-3">
            <span className="text-[13px] text-ink-500">{label}</span>
            <div className="relative h-7 rounded-md bg-ink-50">
                <div className={`absolute inset-y-0 flex items-center rounded-md px-2 text-xs font-medium ${tone}`} style={{ left: pct(from), width: pct(to - from) }}>
                    <span className="truncate">{text}</span>
                </div>
            </div>
        </div>
    );
    return (
        <div className="space-y-2 rounded-lg border border-ink-100 p-3">
            <Row label="Régie" from={0} to={20} tone="bg-ink-200 text-ink-800" text="Chrono de l'écran : 0 → 20 s" />
            <Row label="Téléviseurs" from={5} to={25} tone="bg-sky-100 text-sky-800" text="Le public voit la question 5 s plus tard" />
            <Row label="USSD" from={5} to={25} tone="bg-success-50 text-success-700 ring-1 ring-inset ring-success-600/20" text="Réponses acceptées de 5 à 25 s" />
            <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-3 text-[11px] text-ink-400">
                <span />
                <div className="flex justify-between tabular"><span>0 s</span><span>10 s</span><span>20 s</span><span>30 s</span></div>
            </div>
        </div>
    );
}

export default function TvGuide() {
    return (
        <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-4">
                <Section title="Le principe" description="Un quiz en direct, à la télévision, auquel on répond par USSD.">
                    <p>L&apos;animateur passe les questions une par une. Les joueurs inscrits composent le code USSD du quiz et répondent depuis leur téléphone.</p>
                    <ul className="list-disc space-y-1 pl-5">
                        <li><b>Un seul essai</b> par joueur et par question.</li>
                        <li>Le <b>premier</b> qui donne la bonne réponse gagne <b>10 points</b>. La question se ferme aussitôt.</li>
                        <li>Si personne ne trouve, la question se ferme à la fin du temps.</li>
                        <li>Seuls les élèves des <b>écoles participantes</b> voient l&apos;option « TV Show » dans leur menu USSD et peuvent s&apos;inscrire.</li>
                        <li>Les points du TV Show <b>ne s&apos;ajoutent pas</b> au score du quiz quotidien.</li>
                        <li>Les questions choisies pour une session ne sont pas envoyées au quiz quotidien avant la fin de la session. Une fois jouées, elles ne reviennent plus dans un autre TV Show.</li>
                    </ul>
                </Section>

                <Section title="Les trois postes">
                    <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-lg border border-ink-100 p-3">
                            <Radio className="mb-1.5 size-4 text-brand-600" />
                            <p className="font-medium text-ink-900">Le pupitre</p>
                            <p className="text-[13px] text-ink-500">Dans le dashboard. L&apos;animateur ou la régie lance chaque étape et voit arriver les réponses.</p>
                        </div>
                        <div className="rounded-lg border border-ink-100 p-3">
                            <MonitorPlay className="mb-1.5 size-4 text-brand-600" />
                            <p className="font-medium text-ink-900">L&apos;écran télé</p>
                            <p className="text-[13px] text-ink-500">Une page plein écran envoyée à l&apos;antenne, avec fond animé ou fond vert pour l&apos;incrustation.</p>
                        </div>
                        <div className="rounded-lg border border-ink-100 p-3">
                            <Smartphone className="mb-1.5 size-4 text-brand-600" />
                            <p className="font-medium text-ink-900">Les joueurs</p>
                            <p className="text-[13px] text-ink-500">Sur leur téléphone, par USSD. Pendant le direct, leur menu habituel est remplacé par celui du TV Show.</p>
                        </div>
                    </div>
                </Section>

                <Section title="Préparer une émission">
                    <ol className="list-decimal space-y-1.5 pl-5">
                        <li><b>Créer la session</b> (TV Show → Nouvelle session) : titre, date, durée par question (15 à 60 s), délai de diffusion et <b>écoles participantes</b> (obligatoire).</li>
                        <li><b>Inscrire les joueurs</b> : à la main dans l&apos;onglet Joueurs, ou en ouvrant les inscriptions. Le joueur compose alors le code USSD, choisit « 9. TV Show » et tape le code à 4 chiffres de la session. Il reçoit un SMS de confirmation.</li>
                        <li><b>Choisir les questions</b> : une par une dans la banque, ou par tirage aléatoire. Ajoutez une ou deux réserves pour remplacer une question au dernier moment.</li>
                        <li><b>Générer le lien de l&apos;écran</b> (onglet Écran) et l&apos;ouvrir sur le PC de la régie, en plein écran (F11). Prenez le lien « fond vert » si la régie fait une incrustation.</li>
                        <li><b>Le jour J</b>, ouvrez le pupitre et lancez le direct.</li>
                    </ol>
                </Section>
            </div>

            <div className="space-y-4">
                <Section title="Pendant le direct" description="Chaque étape est un bouton du pupitre.">
                    <ol className="list-decimal space-y-1.5 pl-5">
                        <li><b>Lancer le direct</b> : l&apos;écran passe en attente et affiche le code USSD.</li>
                        <li><b>Afficher la question</b> : la question et le chrono apparaissent à l&apos;écran. Les réponses USSD s&apos;ouvrent après le délai de diffusion.</li>
                        <li>Le premier bon répondant ferme la question et son nom apparaît à l&apos;écran. Vous pouvez aussi <b>fermer</b> la question vous-même.</li>
                        <li><b>Révéler</b> : la bonne réponse s&apos;affiche.</li>
                        <li><b>Classement</b> quand vous le souhaitez, puis la question suivante.</li>
                        <li><b>Pause</b> pour une coupure publicitaire. À la fin, <b>Terminer</b> affiche le podium.</li>
                    </ol>
                </Section>

                <Section title="Le délai de diffusion" description="Exemple : durée 20 s, délai 5 s.">
                    <p>Le signal télé arrive chez le public avec quelques secondes de retard. Le délai réglé dans la session décale la fenêtre de réponse USSD d&apos;autant, pour que la régie n&apos;avantage personne : le chrono part à l&apos;écran au moment où vous affichez la question, mais les réponses ne sont acceptées qu&apos;à partir du moment où le public la voit.</p>
                    <Timeline />
                    <p className="text-[13px] text-ink-500">Pour régler le délai, comparez une horloge filmée en régie avec la même image sur un téléviseur.</p>
                </Section>

                <Section title="Ce que voit le joueur" description="Trois écrans USSD, puis le résultat.">
                    <div className="grid gap-2 sm:grid-cols-3">
                        <Ussd>{'TV Show - Q2/5\nQuel fleuve traverse la ville de Kinshasa ?\n1. Voir les options'}</Ussd>
                        <Ussd>{'1. Le Nil\n2. Le fleuve Congo\n3. Le Niger\n4. Le Zambeze\n0. Repondre'}</Ussd>
                        <Ussd>{'Q2 - Votre reponse (1 a 4) :'}</Ussd>
                    </div>
                    <Ussd>{'Bonne reponse ! 1er en 4,2 s.\nTotal : 10 pts\n1. Actualiser'}</Ussd>
                    <p className="text-[13px] text-ink-500">L&apos;USSD ne se met pas à jour tout seul : le joueur tape « 1. Actualiser » ou recompose le code pour voir la question suivante.</p>
                </Section>
            </div>
        </div>
    );
}
