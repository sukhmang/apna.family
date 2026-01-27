/**
 * Path Finder
 * 
 * Uses graphlib to find the shortest path between two people in the family tree
 * Handles both parent-child relationships and partner/spouse relationships
 */

// Note: graphlib doesn't have a default export, we'll use BFS instead
// import { Graph } from 'graphlib'

/**
 * Build a simple adjacency map from tree.json people array
 * @param {Array} people - Array of person objects from tree.json
 * @returns {Map<string, Set<string>>} - Map of person ID to set of connected person IDs
 */
export function buildFamilyGraph(people) {
  const graph = new Map()

  // Initialize all nodes
  people.forEach(person => {
    graph.set(person.id, new Set())
  })

  // Add parent-child relationships (bidirectional)
  people.forEach(person => {
    if (person.parents && Array.isArray(person.parents)) {
      person.parents.forEach(parentId => {
        if (graph.has(parentId)) {
          graph.get(person.id).add(parentId)
          graph.get(parentId).add(person.id)
        }
      })
    }
  })

  // Add partner/spouse relationships (bidirectional)
  people.forEach(person => {
    if (person.partners && Array.isArray(person.partners)) {
      person.partners.forEach(partnerId => {
        if (graph.has(partnerId)) {
          graph.get(person.id).add(partnerId)
          graph.get(partnerId).add(person.id)
        }
      })
    }
  })

  return graph
}

/**
 * Find shortest path between two people in the family tree using BFS
 * @param {string} rootId - Tree ID of root person (e.g., "sukhman_grewal")
 * @param {string} targetId - Tree ID of target person (e.g., "baljit_grewal")
 * @param {Array} people - Array of person objects from tree.json
 * @returns {Array<string>|null} - Array of tree IDs representing the path, or null if no path exists
 * 
 * @example
 * findPath("sukhman_grewal", "ranjit_singh_grewal", people)
 * // Returns: ["sukhman_grewal", "baljit_grewal", "ranjit_singh_grewal"]
 */
export function findPath(rootId, targetId, people) {
  if (!rootId || !targetId || rootId === targetId) {
    return rootId === targetId ? [rootId] : null
  }

  try {
    const graph = buildFamilyGraph(people)
    
    if (!graph.has(rootId) || !graph.has(targetId)) {
      return null
    }

    // BFS to find shortest path
    const queue = [[rootId]]
    const visited = new Set([rootId])

    while (queue.length > 0) {
      const path = queue.shift()
      const current = path[path.length - 1]

      if (current === targetId) {
        return path
      }

      // Get neighbors from graph map
      const neighbors = graph.get(current) || new Set()
      
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor)
          queue.push([...path, neighbor])
        }
      }
    }

    return null // No path found
  } catch (error) {
    console.error('Error finding path:', error)
    return null
  }
}
