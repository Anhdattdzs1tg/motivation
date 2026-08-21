// Tạo âm thanh báo hiệu ~5 giây bằng Web Audio API — không cần file âm thanh ngoài,
// đảm bảo hoạt động offline hoàn toàn.

let audioCtx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
  }
  return audioCtx
}

/** Phát 1 chuỗi beep sôi động, tổng thời lượng khoảng 5 giây */
export function playAlertSound(): void {
  const ctx = getCtx()
  if (ctx.state === 'suspended') ctx.resume()

  const now = ctx.currentTime
  // Một chuỗi nốt nhạc vui tai, lặp lại tạo cảm giác "sôi động"
  const notes = [880, 1046.5, 880, 1318.5, 1046.5, 880, 1318.5, 1568]
  const noteDuration = 0.28
  const gap = 0.35

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.value = freq
    const startTime = now + i * gap
    gain.gain.setValueAtTime(0, startTime)
    gain.gain.linearRampToValueAtTime(0.25, startTime + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + noteDuration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(startTime)
    osc.stop(startTime + noteDuration + 0.05)
  })
}
