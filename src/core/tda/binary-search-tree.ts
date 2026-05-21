/**
 * Clase que representa un nodo en el árbol binario de búsqueda.
 * @template T - Tipo de dato que almacenará el nodo.
 */
class BSTNode<T> {
  data: T; // Dato almacenado en el nodo
  left: BSTNode<T> | null; // Hijo izquierdo
  right: BSTNode<T> | null; // Hijo derecho

  constructor(data: T) {
    this.data = data;
    this.left = null; // Inicialmente, el hijo izquierdo es null
    this.right = null; // Inicialmente, el hijo derecho es null
  }
}

/**
 * Clase que representa un árbol binario de búsqueda.
 * @template T - Tipo de dato que almacenará el árbol.
 */
export class BinarySearchTree<T> {
  private root: BSTNode<T> | null; // Raíz del árbol

  constructor() {
    this.root = null; // Inicialmente, el árbol está vacío
  }

  // Inserta un nuevo elemento en el árbol
  public insert(data: T): void {
    this.root = this.insertNode(this.root, data);
  }

  private insertNode(node: BSTNode<T> | null, data: T): BSTNode<T> {
    if (node === null) {
      return new BSTNode(data); // Crea un nuevo nodo si el espacio está vacío
    }
    if (data < node.data) {
      node.left = this.insertNode(node.left, data); // Inserta en el subárbol izquierdo
    } else if (data > node.data) {
      node.right = this.insertNode(node.right, data); // Inserta en el subárbol derecho
    }
    return node; // Retorna el nodo actualizado
  }

  // Busca un elemento en el árbol
  public search(data: T): boolean {
    return this.searchNode(this.root, data);
  }

  private searchNode(node: BSTNode<T> | null, data: T): boolean {
    if (node === null) {
      return false; // No se encontró el dato
    }
    if (data === node.data) {
      return true; // Se encontró el dato
    }
    return data < node.data
      ? this.searchNode(node.left, data) // Busca en el subárbol izquierdo
      : this.searchNode(node.right, data); // Busca en el subárbol derecho
  }

  // Elimina un elemento del árbol
  public remove(data: T): void {
    this.root = this.removeNode(this.root, data);
  }

  private removeNode(node: BSTNode<T> | null, data: T): BSTNode<T> | null {
    if (node === null) {
      return null; // Si el nodo es null, no hay nada que eliminar
    }
    if (data < node.data) {
      node.left = this.removeNode(node.left, data); // Busca en el subárbol izquierdo
    } else if (data > node.data) {
      node.right = this.removeNode(node.right, data); // Busca en el subárbol derecho
    } else {
      // Nodo a eliminar encontrado
      if (node.left === null && node.right === null) {
        return null; // Nodo sin hijos
      } else if (node.left === null) {
        return node.right; // Nodo con un solo hijo derecho
      } else if (node.right === null) {
        return node.left; // Nodo con un solo hijo izquierdo
      } else {
        // Nodo con dos hijos
        const minLargerNode = this.findMinNode(node.right); // Encuentra el nodo más pequeño del subárbol derecho
        node.data = minLargerNode.data; // Reemplaza el valor del nodo a eliminar
        node.right = this.removeNode(node.right, minLargerNode.data); // Elimina el nodo más pequeño
      }
    }
    return node; // Retorna el nodo actualizado
  }

  private findMinNode(node: BSTNode<T>): BSTNode<T> {
    while (node.left) {
      node = node.left; // Recorre hacia la izquierda para encontrar el nodo más pequeño
    }
    return node;
  }

  // Recorrido en orden (In-Order)
  public inOrderTraversal(callback: (data: T) => void): void {
    this.inOrder(this.root, callback);
  }

  private inOrder(node: BSTNode<T> | null, callback: (data: T) => void): void {
    if (node) {
      this.inOrder(node.left, callback); // Visita el subárbol izquierdo
      callback(node.data); // Visita el nodo actual
      this.inOrder(node.right, callback); // Visita el subárbol derecho
    }
  }

  // Recorrido en preorden (Pre-Order)
  public preOrderTraversal(callback: (data: T) => void): void {
    this.preOrder(this.root, callback);
  }

  private preOrder(node: BSTNode<T> | null, callback: (data: T) => void): void {
    if (node) {
      callback(node.data); // Visita el nodo actual
      this.preOrder(node.left, callback); // Visita el subárbol izquierdo
      this.preOrder(node.right, callback); // Visita el subárbol derecho
    }
  }

  // Recorrido en postorden (Post-Order)
  public postOrderTraversal(callback: (data: T) => void): void {
    this.postOrder(this.root, callback);
  }

  private postOrder(
    node: BSTNode<T> | null,
    callback: (data: T) => void
  ): void {
    if (node) {
      this.postOrder(node.left, callback); // Visita el subárbol izquierdo
      this.postOrder(node.right, callback); // Visita el subárbol derecho
      callback(node.data); // Visita el nodo actual
    }
  }

  // Devuelve la altura del árbol
  public height(): number {
    return this.calculateHeight(this.root);
  }

  private calculateHeight(node: BSTNode<T> | null): number {
    if (node === null) {
      return -1; // Retorna -1 para contar la altura de los nodos
    }
    const leftHeight = this.calculateHeight(node.left);
    const rightHeight = this.calculateHeight(node.right);
    return Math.max(leftHeight, rightHeight) + 1; // Retorna la altura máxima
  }

  // Cuenta el número de nodos en el árbol
  public countNodes(): number {
    return this.count(this.root);
  }

  private count(node: BSTNode<T> | null): number {
    if (node === null) {
      return 0; // Si el nodo es null, no hay nodos
    }
    return 1 + this.count(node.left) + this.count(node.right); // Cuenta el nodo actual y sus hijos
  }

  // Imprime el árbol en orden
  public print(): void {
    this.inOrderTraversal((data) => console.log(data)); // Imprime en orden
  }
}
