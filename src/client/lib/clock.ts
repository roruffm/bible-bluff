// Schätzt den Versatz zwischen Handy-Uhr und Server-Uhr, damit Timer und Aufdeckung
// auf allen Geräten gleichzeitig laufen.

interface Sample {
  offset: number;
  rtt: number;
  at: number;
}

class ServerClock {
  private samples: Sample[] = [];
  private offset = 0;

  sample(serverNow: number, sent: number, received: number) {
    const rtt = Math.max(0, received - sent);
    this.samples.push({ offset: serverNow - (sent + rtt / 2), rtt, at: received });
    if (this.samples.length > 12) this.samples.shift();
    // Die Messung mit der kürzesten Laufzeit ist am genauesten
    const best = [...this.samples].sort((a, b) => a.rtt - b.rtt)[0];
    this.offset = best.offset;
  }

  now(): number {
    return Date.now() + this.offset;
  }
}

export const clock = new ServerClock();
