import type { RoomView } from '../../shared/types';

/** Eine alte Aktion darf nach einem Phasenwechsel keine weitere Runde/Partie starten. */
export function actionPhase(view: RoomView | null): string {
  return JSON.stringify([
    view?.status, view?.round?.writeStartedAt, view?.round?.index, view?.round?.question.id,
    view?.round?.phase, view?.heart?.phase, view?.heart?.question, view?.final?.talk?.step,
  ]);
}
