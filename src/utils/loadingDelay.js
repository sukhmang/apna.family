/**
 * Loading Delay Utility
 * 
 * Ensures a minimum loading time to allow animations and skeleton loaders
 * to be visible, providing a better user experience even when data loads quickly.
 * 
 * @param {Promise} dataPromise - The promise that loads the actual data
 * @param {number} minDelayMs - Minimum delay in milliseconds (default: 1000ms)
 * @returns {Promise} - Promise that resolves after both data loads AND minimum delay
 * 
 * @example
 * // In a context or component:
 * const loadData = async () => {
 *   const dataPromise = loadFamilyData(familyId)
 *   const data = await withMinimumDelay(dataPromise, 1000)
 *   setFamilyData(data)
 *   setLoading(false)
 * }
 */
export function withMinimumDelay(dataPromise, minDelayMs = 1000) {
  const delayPromise = new Promise(resolve => setTimeout(resolve, minDelayMs))
  
  return Promise.all([dataPromise, delayPromise]).then(([data]) => data)
}

/**
 * Creates a loading delay promise
 * Useful when you want to show loading state even if there's no async operation
 * 
 * @param {number} delayMs - Delay in milliseconds (default: 1000ms)
 * @returns {Promise} - Promise that resolves after the delay
 * 
 * @example
 * // Show skeleton for minimum time:
 * await createDelay(1000)
 * setLoading(false)
 */
export function createDelay(delayMs = 1000) {
  return new Promise(resolve => setTimeout(resolve, delayMs))
}
