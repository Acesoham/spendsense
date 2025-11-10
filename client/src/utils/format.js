export const formatINR = (n) => {
  try { return `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}` } catch { return `₹${n}` }
}
