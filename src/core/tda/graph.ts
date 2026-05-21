/**
 * Clase que representa un grafo.
 * @template T - Tipo de dato que almacenará los nodos del grafo.
 */
export class Graph<T> {
  private adjacencyList: Map<T, { vertex: T; weight: number }[]>; // Lista de adyacencia con pesos
  private directed: boolean; // Indica si el grafo es dirigido

  constructor(directed: boolean = false) {
    this.adjacencyList = new Map(); // Inicializa la lista de adyacencia
    this.directed = directed; // Configura si el grafo es dirigido
  }

  // Agrega un nuevo vértice al grafo
  public addVertex(vertex: T): void {
    if (!this.adjacencyList.has(vertex)) {
      this.adjacencyList.set(vertex, []); // Crea una lista vacía para el nuevo vértice
    }
  }

  // Agrega una arista entre dos vértices con un peso
  public addEdge(vertex1: T, vertex2: T, weight: number = 1): void {
    this.addVertex(vertex1); // Asegura que el vértice1 exista
    this.addVertex(vertex2); // Asegura que el vértice2 exista
    this.adjacencyList.get(vertex1)!.push({ vertex: vertex2, weight }); // Agrega vertex2 a la lista de adyacencia de vertex1
    if (!this.directed) {
      this.adjacencyList.get(vertex2)!.push({ vertex: vertex1, weight }); // Agrega vertex1 a la lista de adyacencia de vertex2 (para grafos no dirigidos)
    }
  }

  // Realiza un recorrido en profundidad (DFS)
  public dfs(start: T, visited: Set<T> = new Set()): void {
    if (!this.adjacencyList.has(start) || visited.has(start)) return;
    visited.add(start); // Marca el vértice como visitado
    console.log(start); // Procesa el vértice
    for (const neighbor of this.adjacencyList.get(start)!) {
      this.dfs(neighbor.vertex, visited); // Visita cada vecino
    }
  }

  // Realiza un recorrido en amplitud (BFS)
  public bfs(start: T): void {
    if (!this.adjacencyList.has(start)) return;

    const visited = new Set<T>(); // Conjunto para marcar los vértices visitados
    const queue: T[] = [start]; // Cola para el recorrido

    while (queue.length) {
      const vertex = queue.shift()!;
      if (!visited.has(vertex)) {
        visited.add(vertex); // Marca el vértice como visitado
        console.log(vertex); // Procesa el vértice
        for (const neighbor of this.adjacencyList.get(vertex)!) {
          queue.push(neighbor.vertex); // Agrega los vecinos a la cola
        }
      }
    }
  }

  // Detección de ciclos usando DFS
  public hasCycle(): boolean {
    const visited = new Set<T>();
    const recStack = new Set<T>();

    for (const vertex of this.adjacencyList.keys()) {
      if (this.detectCycle(vertex, visited, recStack)) {
        return true; // Se encontró un ciclo
      }
    }
    return false; // No se encontraron ciclos
  }

  private detectCycle(vertex: T, visited: Set<T>, recStack: Set<T>): boolean {
    if (!visited.has(vertex)) {
      visited.add(vertex);
      recStack.add(vertex);

      for (const neighbor of this.adjacencyList.get(vertex)!) {
        if (
          !visited.has(neighbor.vertex) &&
          this.detectCycle(neighbor.vertex, visited, recStack)
        ) {
          return true; // Ciclo encontrado en la recursión
        } else if (recStack.has(neighbor.vertex)) {
          return true; // Ciclo encontrado en el stack de recursión
        }
      }
    }
    recStack.delete(vertex); // Remueve el vértice del stack de recursión
    return false; // No se encontró ciclo
  }

  // Encuentra la ruta más corta desde un vértice usando Dijkstra
  public dijkstra(start: T): Map<T, number> {
    const distances = new Map<T, number>(); // Distancias desde el vértice de inicio
    const visited = new Set<T>(); // Conjunto de vértices visitados
    const priorityQueue = new MinPriorityQueue<T>(); // Cola de prioridad

    this.adjacencyList.forEach((_, vertex) => {
      distances.set(vertex, Infinity); // Inicializa todas las distancias a infinito
    });
    distances.set(start, 0); // La distancia al vértice de inicio es 0
    priorityQueue.enqueue(start, 0); // Encola el vértice de inicio

    while (!priorityQueue.isEmpty()) {
      const { element: currentVertex } = priorityQueue.dequeue(); // Obtiene el vértice con la distancia más corta
      if (visited.has(currentVertex)) continue; // Si ya fue visitado, lo ignora
      visited.add(currentVertex); // Marca el vértice como visitado

      for (const neighbor of this.adjacencyList.get(currentVertex)!) {
        const newDist = distances.get(currentVertex)! + neighbor.weight; // Calcula la nueva distancia
        if (newDist < distances.get(neighbor.vertex)!) {
          distances.set(neighbor.vertex, newDist); // Actualiza la distancia
          priorityQueue.enqueue(neighbor.vertex, newDist); // Encola el vecino
        }
      }
    }
    return distances; // Retorna las distancias más cortas
  }

  // Método para calcular la ruta crítica (simplificado)
  public criticalPath(start: T): { vertex: T; duration: number }[] {
    const distances = this.dijkstra(start); // Calcula las distancias más cortas
    const criticalPath: { vertex: T; duration: number }[] = [];

    distances.forEach((duration, vertex) => {
      if (duration < Infinity) {
        criticalPath.push({ vertex, duration }); // Agrega el vértice y su duración a la ruta crítica
      }
    });

    return criticalPath; // Retorna la ruta crítica
  }

  // Método para encontrar caminos óptimos (Bellman-Ford)
  public bellmanFord(start: T): Map<T, number> {
    const distances = new Map<T, number>();
    const edges: { from: T; to: T; weight: number }[] = [];

    this.adjacencyList.forEach((neighbors, vertex) => {
      distances.set(vertex, Infinity); // Inicializa todas las distancias a infinito
      neighbors.forEach((neighbor) => {
        edges.push({
          from: vertex,
          to: neighbor.vertex,
          weight: neighbor.weight,
        }); // Agrega las aristas
      });
    });

    distances.set(start, 0); // La distancia al vértice de inicio es 0

    // Relaja las aristas
    for (let i = 0; i < this.adjacencyList.size - 1; i++) {
      for (const edge of edges) {
        if (distances.get(edge.from)! + edge.weight < distances.get(edge.to)!) {
          distances.set(edge.to, distances.get(edge.from)! + edge.weight); // Actualiza la distancia
        }
      }
    }

    // Verificación de ciclos negativos
    for (const edge of edges) {
      if (distances.get(edge.from)! + edge.weight < distances.get(edge.to)!) {
        throw new Error("El grafo contiene un ciclo negativo."); // Ciclo negativo encontrado
      }
    }

    return distances; // Retorna las distancias
  }

  public floydWarshall(): Map<T, Map<T, number>> {
    const distances = new Map<T, Map<T, number>>();

    this.adjacencyList.forEach((_, vertex) => {
      distances.set(vertex, new Map<T, number>());
      this.adjacencyList.forEach((_, otherVertex) => {
        distances.get(vertex)!.set(otherVertex, Infinity); // Inicializa todas las distancias a infinito
      });
      distances.get(vertex)!.set(vertex, 0); // La distancia a sí mismo es 0
    });

    // Inicializa las distancias con los pesos de las aristas
    this.adjacencyList.forEach((neighbors, vertex) => {
      neighbors.forEach((neighbor) => {
        distances.get(vertex)!.set(neighbor.vertex, neighbor.weight);
      });
    });

    // Aplica el algoritmo de Floyd-Warshall
    for (const k of this.adjacencyList.keys()) {
      for (const i of this.adjacencyList.keys()) {
        for (const j of this.adjacencyList.keys()) {
          if (
            distances.get(i)!.get(k)! + distances.get(k)!.get(j)! <
            distances.get(i)!.get(j)!
          ) {
            distances
              .get(i)!
              .set(j, distances.get(i)!.get(k)! + distances.get(k)!.get(j)!); // Actualiza la distancia
          }
        }
      }
    }

    return distances; // Retorna la matriz de distancias
  }

  public aStar(
    start: T,
    goal: T,
    heuristic: (vertex: T) => number
  ): Map<T, number> {
    const openSet = new Set<T>(); // Conjunto de nodos abiertos
    const closedSet = new Set<T>(); // Conjunto de nodos cerrados
    const gScores = new Map<T, number>(); // Costos desde el inicio
    const fScores = new Map<T, number>(); // Costos estimados hasta el objetivo

    this.adjacencyList.forEach((vertex) => {
      gScores.set(vertex as T, Infinity); // Inicializa todas las distancias a infinito
      fScores.set(vertex as T, Infinity); // Inicializa todas las distancias a infinito
    });

    gScores.set(start, 0); // La distancia al vértice de inicio es 0
    fScores.set(start, heuristic(start)); // Estimación inicial

    openSet.add(start); // Agrega el vértice inicial al conjunto abierto

    while (openSet.size > 0) {
      // Encuentra el nodo con el menor fScore
      const current = Array.from(openSet).reduce((a, b) =>
        fScores.get(a)! < fScores.get(b)! ? a : b
      );

      if (current === goal) {
        return this.reconstructPath(gScores, current); // Reconstruye el camino si se llegó al objetivo
      }

      openSet.delete(current); // Remueve el nodo actual del conjunto abierto
      closedSet.add(current); // Agrega el nodo actual al conjunto cerrado

      for (const neighbor of this.adjacencyList.get(current)!) {
        if (closedSet.has(neighbor.vertex)) continue; // Ignora los nodos cerrados

        const tentativeGScore = gScores.get(current)! + neighbor.weight; // Calcula el nuevo costo

        if (!openSet.has(neighbor.vertex)) {
          openSet.add(neighbor.vertex); // Agrega el vecino al conjunto abierto
        } else if (tentativeGScore >= gScores.get(neighbor.vertex)!) {
          continue; // Si no es mejor, ignora
        }

        gScores.set(neighbor.vertex, tentativeGScore); // Actualiza el costo
        fScores.set(
          neighbor.vertex,
          tentativeGScore + heuristic(neighbor.vertex)
        ); // Actualiza la estimación
      }
    }

    throw new Error("No se encontró un camino."); // No se encontró un camino
  }

  private reconstructPath(gScores: Map<T, number>, current: T): Map<T, number> {
    const totalPath = new Map<T, number>();
    let totalCost = gScores.get(current)!;

    totalPath.set(current, totalCost); // Agrega el nodo actual al camino

    // Reconstruye el camino hacia atrás
    while (gScores.get(current)! > 0) {
      for (const [vertex, cost] of gScores) {
        if (
          cost + this.getEdgeWeight(vertex, current) ===
          gScores.get(current)!
        ) {
          totalPath.set(vertex, cost); // Agrega el nodo al camino
          current = vertex; // Mueve al nodo anterior
          break;
        }
      }
    }

    return totalPath; // Retorna el camino reconstruido
  }

  private getEdgeWeight(vertex1: T, vertex2: T): number {
    const neighbors = this.adjacencyList.get(vertex1);
    if (neighbors) {
      const edge = neighbors.find((n) => n.vertex === vertex2);
      return edge ? edge.weight : Infinity; // Retorna el peso de la arista o infinito
    }
    return Infinity; // Si no hay arista, retorna infinito
  }

  public johnson(newVertex: T): Map<T, Map<T, number>> {
    this.addVertex(newVertex); // Agrega el nuevo vértice

    // Conecta el nuevo vértice a todos los demás vértices con peso 0
    this.adjacencyList.forEach((_, vertex) => {
      this.addEdge(newVertex, vertex, 0);
    });

    // Usa Bellman-Ford para calcular las distancias desde el nuevo vértice
    const h = this.bellmanFord(newVertex);

    const modifiedGraph = new Graph<any>(this.directed); // Nuevo grafo para almacenar los pesos modificados

    // Modifica los pesos de las aristas
    this.adjacencyList.forEach((neighbors, vertex) => {
      neighbors.forEach((neighbor) => {
        const newWeight =
          neighbor.weight + h.get(vertex)! - h.get(neighbor.vertex)!;
        modifiedGraph.addEdge(vertex, neighbor.vertex, newWeight); // Agrega arista con peso modificado
      });
    });

    const distances = new Map<T, Map<T, number>>(); // Matriz de distancias

    // Aplica Dijkstra para cada vértice en el grafo modificado
    this.adjacencyList.forEach((vertex) => {
      distances.set(vertex as T, modifiedGraph.dijkstra(vertex)); // Calcula distancias
    });

    // Elimina el vértice nuevo
    this.removeVertex(newVertex); // Elimina el vértice auxiliar

    return distances; // Retorna la matriz de distancias
  }

  private removeVertex(vertex: T): void {
    this.adjacencyList.delete(vertex); // Elimina el vértice de la lista de adyacencia
    this.adjacencyList.forEach((neighbors) => {
      const index = neighbors.findIndex((n) => n.vertex === vertex);
      if (index !== -1) {
        neighbors.splice(index, 1); // Elimina el vértice de los vecinos
      }
    });
  }

  // Imprime el grafo
  public print(): void {
    for (const [vertex, neighbors] of this.adjacencyList) {
      console.log(
        `${vertex} -> ${neighbors.map((n) => `${n.vertex}(${n.weight})`).join(", ")}`
      );
    }
  }
}

/**
 * Clase auxiliar para la cola de prioridad
 */
class MinPriorityQueue<T> {
  private elements: { element: T; priority: number }[] = [];

  enqueue(element: T, priority: number): void {
    this.elements.push({ element, priority });
    this.elements.sort((a, b) => a.priority - b.priority); // Ordena por prioridad
  }

  dequeue(): { element: T; priority: number } {
    return this.elements.shift()!; // Retorna el elemento con la prioridad más baja
  }

  isEmpty(): boolean {
    return this.elements.length === 0; // Verifica si la cola está vacía
  }
}
