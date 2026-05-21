/**
 * Clase que representa un nodo en la lista enlazada doble.
 * @template T - Tipo de dato que almacenará el nodo.
 */
class DoublyNode<T> {
  data: T; // Dato almacenado en el nodo
  next: DoublyNode<T> | null; // Puntero al siguiente nodo
  prev: DoublyNode<T> | null; // Puntero al nodo anterior

  constructor(data: T) {
    this.data = data;
    this.next = null; // Inicialmente, el siguiente nodo es null
    this.prev = null; // Inicialmente, el nodo anterior es null
  }
}

/**
 * Clase que representa una lista enlazada doble.
 * @template T - Tipo de dato que almacenará la lista.
 */
export class DoublyLinkedList<T> {
  private head: DoublyNode<T> | null; // Cabeza de la lista
  private tail: DoublyNode<T> | null; // Cola de la lista

  constructor() {
    this.head = null; // Inicialmente, la lista está vacía
    this.tail = null; // Inicialmente, la cola está vacía
  }

  // Agrega un nuevo elemento al final de la lista
  public add(data: T): void {
    const newNode = new DoublyNode(data);
    if (!this.head) {
      this.head = newNode; // Si la lista está vacía, el nuevo nodo es la cabeza
      this.tail = newNode; // También es la cola
      return;
    }

    this.tail!.next = newNode; // El nodo actual de la cola apunta al nuevo nodo
    newNode.prev = this.tail; // El nuevo nodo apunta a la cola anterior
    this.tail = newNode; // Actualiza la cola al nuevo nodo
  }

  // Inserta un nuevo elemento en una posición específica
  public insert(index: number, data: T): void {
    if (index < 0 || index > this.length()) {
      throw new Error("Índice fuera de rango");
    }

    const newNode = new DoublyNode(data);
    if (index === 0) {
      newNode.next = this.head; // El nuevo nodo apunta a la cabeza actual
      if (this.head) {
        this.head.prev = newNode; // Actualiza el anterior de la cabeza
      }
      this.head = newNode; // La cabeza ahora es el nuevo nodo
      if (!this.tail) {
        this.tail = newNode; // Si la lista estaba vacía, la cola es también el nuevo nodo
      }
      return;
    }

    let current = this.head;
    for (let i = 0; i < index - 1; i++) {
      current = current!.next; // Navega hasta el nodo anterior al índice
    }
    newNode.next = current!.next; // El nuevo nodo apunta al siguiente
    newNode.prev = current; // El nuevo nodo apunta al nodo anterior
    if (current!.next) {
      current!.next.prev = newNode; // Actualiza el anterior del siguiente nodo
    } else {
      this.tail = newNode; // Si se inserta al final, actualiza la cola
    }
    current!.next = newNode; // El nodo anterior apunta al nuevo nodo
  }

  // Vacía la lista
  public clear(): void {
    this.head = null; // Establece la cabeza como null para limpiar la lista
    this.tail = null; // Establece la cola como null
  }

  // Verifica si la lista está vacía
  public isEmpty(): boolean {
    return this.head === null; // La lista está vacía si la cabeza es null
  }

  // Devuelve la cantidad de elementos en la lista
  public length(): number {
    let count = 0;
    let current = this.head;
    while (current) {
      count++; // Cuenta cada nodo
      current = current.next; // Avanza al siguiente nodo
    }
    return count; // Devuelve el conteo total
  }

  // Busca un elemento en la lista
  public search(data: T): boolean {
    let current = this.head;
    while (current) {
      if (current.data === data) {
        return true; // Se encontró el dato
      }
      current = current.next; // Avanza al siguiente nodo
    }
    return false; // No se encontró el dato
  }

  // Devuelve la posición de un elemento dado
  public indexOf(data: T): number {
    let current = this.head;
    let index = 0;
    while (current) {
      if (current.data === data) {
        return index; // Retorna la posición del dato
      }
      current = current.next; // Avanza al siguiente nodo
      index++;
    }
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
    let current = this.head;
    const result: T[] = [];
    while (current) {
      result.push(current.data); // Agrega el dato del nodo actual al resultado
      current = current.next; // Avanza al siguiente nodo
    }
    console.log(result); // Imprime el resultado en la consola
  }
}
