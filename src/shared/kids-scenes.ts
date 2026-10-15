export const KIDS_SCENE_MS = 10_000;
export type KidsSceneMotif = 'ark' | 'manger' | 'lion' | 'boat';
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
export function kidsSceneBeat(elapsedMs:number):0|1|2 { return elapsedMs < 3000 ? 0 : elapsedMs < 6500 ? 1 : 2; }
