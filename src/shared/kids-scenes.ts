export const KIDS_SCENE_MS = 10_000;
export type KidsSceneMotif = 'ark' | 'manger' | 'lion' | 'boat';
/** Die Emmy-Aufnahmen sind auf diese drei Texteinblendungen geschnitten. */
export const KIDS_SCENE_BEATS = [0, 3000, 6500] as const;
export const KIDS_SCENE_VOICES: Partial<Record<KidsSceneMotif, string>> = {
  ark: '/audio/kids-scenes/ark-emmy-20261022.mp3',
  manger: '/audio/kids-scenes/manger-emmy-20261022.mp3',
  lion: '/audio/kids-scenes/lion-emmy-20261022.mp3',
};
export const KIDS_SCENE_VOICE_URLS = Object.values(KIDS_SCENE_VOICES);
export const KIDS_SCENES: Record<KidsSceneMotif, { description:string; captions:readonly [string,string,string] }> = {
  ark: {
    description: 'Ein Mann baut ein großes Holzschiff. Tiere kommen an Bord. Im Regen sind alle sicher im Schiff.',
    captions: ['Klopf, klopf! Hier wird gebaut.', 'Die Tiere kommen an Bord.', 'Es regnet. Alle sind sicher im Schiff.'],
  },
  manger: {
    description: 'Unter einem leuchtenden Stern schauen zwei Erwachsene liebevoll zu einem Baby. Es liegt in einem Futtertrog und schläft.',
    captions: ['Ein Stern leuchtet in der Nacht.', 'Ein kleines Baby ist da.', 'Schlaf gut, kleines Baby.'],
  },
  lion: {
    description: 'Ein Mann steht zwischen freundlichen Löwen. Ein Engel breitet schützend seine Flügel aus. Die Löwen legen sich friedlich hin.',
    captions: ['Hört ihr die Löwen?', 'Der Mann ist nicht allein.', 'Die Löwen werden ganz ruhig.'],
  },
  boat: {
    description: 'Ein kleines Boot fährt durch hohe Wellen. Ein Mann schläft auf einem Kissen. Er steht auf, hebt die Hand und der Sturm legt sich.',
    captions: ['Wind und Wellen schaukeln das Boot.', 'Jemand schläft auf einem Kissen.', 'Eine Hand hebt sich. Der Sturm wird still.'],
  },
};
export function kidsSceneBeat(elapsedMs:number):0|1|2 { return elapsedMs < KIDS_SCENE_BEATS[1] ? 0 : elapsedMs < KIDS_SCENE_BEATS[2] ? 1 : 2; }
