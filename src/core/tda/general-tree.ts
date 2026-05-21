/**
 * Clase que representa un nodo en un árbol general.
 * @template T - Tipo de dato que almacenará el nodo.
 */
class TreeNode<T> {
  data: T; // Dato almacenado en el nodo
  children: TreeNode<T>[]; // Hijos del nodo

  constructor(data: T) {
    this.data = data;
    this.children = []; // Inicialmente, la lista de hijos está vacía
  }
}

/**
 * Clase que representa un árbol general.
 * @template T - Tipo de dato que almacenará el árbol.
 */
export class GeneralTree<T> {
  private root: TreeNode<T> | null; // Raíz del árbol

  constructor(data: T) {
    this.root = new TreeNode(data); // Inicializa la raíz del árbol
  }

  // Inserta un nuevo hijo en el nodo especificado
  public insert(parentData: T, childData: T): void {
    const parentNode = this.findNode(this.root, parentData);
    if (parentNode) {
      parentNode.children.push(new TreeNode(childData)); // Agrega el nuevo hijo
    } else {
      console.log(`Nodo padre con dato ${parentData} no encontrado.`);
    }
  }

  private findNode(node: TreeNode<T> | null, data: T): TreeNode<T> | null {
    if (node === null) return null; // Si el nodo es null, retorna null
    if (node.data === data) return node; // Si se encuentra el nodo, retorna

    for (const child of node.children) {
      const result = this.findNode(child, data); // Busca recursivamente en los hijos
      if (result) return result; // Si se encuentra, retorna
    }
    return null; // Si no se encuentra, retorna null
  }

  // Elimina un nodo y sus hijos
  public remove(data: T): void {
    this.root = this.removeNode(this.root, data);
  }

  private removeNode(node: TreeNode<T> | null, data: T): TreeNode<T> | null {
    if (node === null) return null; // Si el nodo es null, retorna null
    if (node.data === data) return null; // Si se encuentra el nodo, elimina

    node.children = node.children
      .map((child) => this.removeNode(child, data)) // Elimina recursivamente de los hijos
      .filter((child) => child !== null); // Filtra nodos null

    return node; // Retorna el nodo actualizado
  }

  // Recorrido en profundidad (DFS)
  public depthFirstTraversal(callback: (data: T) => void): void {
    this.dfs(this.root, callback);
  }

  private dfs(node: TreeNode<T> | null, callback: (data: T) => void): void {
    if (node) {
      callback(node.data); // Procesa el nodo
      for (const child of node.children) {
        this.dfs(child, callback); // Visita cada hijo
      }
    }
  }

  // Recorrido en amplitud (BFS)
  public breadthFirstTraversal(callback: (data: T) => void): void {
    if (this.root === null) return;

    const queue: TreeNode<T>[] = [this.root]; // Cola para el recorrido

    while (queue.length) {
      const node = queue.shift()!;
      callback(node.data); // Procesa el nodo
      queue.push(...node.children); // Agrega los hijos a la cola
    }
  }

  // Cuenta el número de nodos en el árbol
  public countNodes(): number {
    return this.count(this.root);
  }

  private count(node: TreeNode<T> | null): number {
    if (node === null) return 0; // Si el nodo es null, no cuenta
    let total = 1; // Cuenta el nodo actual
    for (const child of node.children) {
      total += this.count(child); // Cuenta los hijos
    }
    return total; // Retorna el total
  }

  // Devuelve la altura del árbol
  public height(): number {
    return this.calculateHeight(this.root);
  }

  private calculateHeight(node: TreeNode<T> | null): number {
    if (node === null) return -1; // Retorna -1 para contar la altura
    if (node.children.length === 0) return 0; // Si no tiene hijos, altura es 0

    const heights = node.children.map((child) => this.calculateHeight(child)); // Calcula alturas de los hijos
    return Math.max(...heights) + 1; // Retorna la altura máxima
  }

  // Imprime el árbol en profundidad
  public print(): void {
    this.depthFirstTraversal((data) => console.log(data)); // Imprime en profundidad
  }
}
