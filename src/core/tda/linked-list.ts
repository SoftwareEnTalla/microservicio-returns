/**
 * Clase que representa un nodo en la lista enlazada.
 * @template T - Tipo de dato que almacenará el nodo.
 */
class Node<T> {
  data: T; // Dato almacenado en el nodo
  next: Node<T> | null; // Puntero al siguiente nodo

  constructor(data: T) {
    this.data = data;
    this.next = null; // Inicialmente, el siguiente nodo es null
  }
}

/**
 * Clase que representa una lista enlazada hacia adelante.
 * @template T - Tipo de dato que almacenará la lista.
 */
export class LinkedList<T> {
  private head: Node<T> | null; // Cabeza de la lista

  constructor() {
    this.head = null; // Inicialmente, la lista está vacía
  }

  // Agrega un nuevo elemento al final de la lista
  public add(data: T): void {
    const newNode = new Node(data);
    if (!this.head) {
      this.head = newNode; // Si la lista está vacía, el nuevo nodo es la cabeza
      return;
    }

    let current = this.head;
    while (current.next) {
      current = current.next; // Navega hasta el último nodo
    }
    current.next = newNode; // Asigna el nuevo nodo como el siguiente del último nodo
  }

  // Inserta un nuevo elemento en una posición específica
  public insert(index: number, data: T): void {
    if (index < 0 || index > this.length()) {
      throw new Error("Índice fuera de rango");
    }

    const newNode = new Node(data);
    if (index === 0) {
      newNode.next = this.head; // El nuevo nodo apunta a la cabeza actual
      this.head = newNode; // La cabeza ahora es el nuevo nodo
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
