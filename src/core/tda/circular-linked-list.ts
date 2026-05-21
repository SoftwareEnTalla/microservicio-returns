/**
 * Clase que representa un nodo en la lista circular.
 * @template T - Tipo de dato que almacenará el nodo.
 */
class CircularNode<T> {
  data: T; // Dato almacenado en el nodo
  next: CircularNode<T>; // Puntero al siguiente nodo

  constructor(data: T) {
    this.data = data;
    this.next = this; // Inicialmente, el siguiente nodo apunta a sí mismo
  }
}

/**
 * Clase que representa una lista circular.
 * @template T - Tipo de dato que almacenará la lista.
 */
export class CircularLinkedList<T> {
  private head: CircularNode<T> | null; // Cabeza de la lista

  constructor() {
    this.head = null; // Inicialmente, la lista está vacía
  }

  // Agrega un nuevo elemento al final de la lista
  public add(data: T): void {
    const newNode = new CircularNode(data);
    if (!this.head) {
      this.head = newNode; // Si la lista está vacía, el nuevo nodo es la cabeza
    } else {
      let current = this.head;
      while (current.next !== this.head) {
        current = current.next; // Navega hasta el último nodo
      }
      current.next = newNode; // El último nodo apunta al nuevo nodo
    }
    newNode.next = this.head; // El nuevo nodo apunta a la cabeza
  }

  // Inserta un nuevo elemento en una posición específica
  public insert(index: number, data: T): void {
    if (index < 0 || index > this.length()) {
      throw new Error("Índice fuera de rango");
    }

    const newNode = new CircularNode(data);
    if (index === 0) {
      if (!this.head) {
        this.head = newNode; // Si la lista está vacía, el nuevo nodo es la cabeza
        newNode.next = this.head; // El nuevo nodo apunta a sí mismo
      } else {
        let current = this.head;
        while (current.next !== this.head) {
          current = current.next; // Navega hasta el último nodo
        }
        current.next = newNode; // El último nodo apunta al nuevo nodo
        newNode.next = this.head; // El nuevo nodo apunta a la cabeza
        this.head = newNode; // La cabeza ahora es el nuevo nodo
      }
      return;
    }

    let current = this.head;
    for (let i = 0; i < index - 1; i++) {
      current = current!.next; // Navega hasta el nodo anterior al índice
    }
    newNode.next = current!.next; // El nuevo nodo apunta al siguiente
    current!.next = newNode; // El nodo anterior apunta al nuevo nodo
  }

  // Vacía la lista
  public clear(): void {
    this.head = null; // Establece la cabeza como null para limpiar la lista
  }

  // Verifica si la lista está vacía
  public isEmpty(): boolean {
    return this.head === null; // La lista está vacía si la cabeza es null
  }

  // Devuelve la cantidad de elementos en la lista
  public length(): number {
    if (!this.head) return 0; // Si la lista está vacía, la longitud es 0

    let count = 1; // Contamos la cabeza
    let current = this.head.next;
    while (current !== this.head) {
      count++; // Cuenta cada nodo
      current = current.next; // Avanza al siguiente nodo
    }
    return count; // Devuelve el conteo total
  }

  // Busca un elemento en la lista
  public search(data: T): boolean {
    if (!this.head) return false; // Si la lista está vacía, no se encuentra

    let current = this.head;
    do {
      if (current.data === data) {
        return true; // Se encontró el dato
      }
      current = current.next; // Avanza al siguiente nodo
    } while (current !== this.head);
    return false; // No se encontró el dato
  }

  // Devuelve la posición de un elemento dado
  public indexOf(data: T): number {
    if (!this.head) return -1; // Si la lista está vacía, devuelve -1

    let current = this.head;
    let index = 0;
    do {
      if (current.data === data) {
        return index; // Retorna la posición del dato
      }
      current = current.next; // Avanza al siguiente nodo
      index++;
    } while (current !== this.head);
    return -1; // Si no se encuentra, devuelve -1
  }

  // Agrega una lista completa de elementos
  public addAll(elements: T[]): void {
    for (const element of elements) {
      this.add(element); // Agrega cada elemento usando el método add
    }
  }

  // Imprime los elementos de la lista en la consola
  public print(): void {
    if (!this.head) {
      console.log([]); // Si la lista está vacía, imprime un array vacío
      return;
    }

    const result: T[] = [];
    let current = this.head;
    do {
      result.push(current.data); // Agrega el dato del nodo actual al resultado
      current = current.next; // Avanza al siguiente nodo
    } while (current !== this.head);
    console.log(result); // Imprime el resultado en la consola
  }
}
