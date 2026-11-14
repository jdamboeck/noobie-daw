import * as Tone from 'tone';

export function configureMasterCompressor(compressor: Tone.Compressor, amount: number): void {
  const normalized = Math.max(0, Math.min(100, amount)) / 100;
  compressor.threshold.value = -3 - normalized * 15;
  compressor.ratio.value = 1 + normalized;
  compressor.knee.value = 12;
  compressor.attack.value = 0.02;
  compressor.release.value = 0.15;
}
