export function applyFee(amount: bigint, feeBps: number) {
  if (!feeBps) return { out: amount, fee: 0n }
  const fee = (amount * BigInt(feeBps)) / 10000n
  const out = amount - fee
  return { out, fee }
}

export function withinLimits(amount: bigint, min?: bigint, max?: bigint) {
  if (min && amount < min) return false
  if (max && amount > max) return false
  return true
}
