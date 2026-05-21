/**
 * Clase que representa un nodo en la cola.
 * @template T - Tipo de dato que almacenará el nodo.
 */
class QueueNode<T> {
  data: T; // Dato almacenado en el nodo
  next: QueueNode<T> | null; // Puntero al siguiente nodo

  constructor(data: T) {
    this.data = data;
    this.next = null; // Inicialmente, el siguiente nodo es null
  }
}

/**
 * Clase que representa una cola.
 * @template T - Tipo de dato que almacenará la cola.
 */
export class Queue<T> {
  private front: QueueNode<T> | null; // Nodo frontal de la cola
  private rear: QueueNode<T> | null; // Nodo trasero de la cola
  private count: number; // Contador de elementos en la cola

  constructor() {
    this.front = null; // Inicialmente, la cola está vacía
    this.rear = null; // Inicialmente, la cola está vacía
    this.count = 0; // Inicializa el contador en 0
  }

  // Agrega un nuevo elemento al final de la cola
  public enqueue(data: T): void {
    const newNode = new QueueNode(data);
    if (this.isEmpty()) {
      this.front = newNode; // Si la cola está vacía, el nuevo nodo es el frente
      this.rear = newNode; // También es el trasero
    } else {
      this.rear!.next = newNode; // El nodo trasero apunta al nuevo nodo
      this.rear = newNode; // Actualiza el trasero al nuevo nodo
    }
    this.count++; // Incrementa el contador
  }

  // Elimina y devuelve el elemento en el frente de la cola
  public dequeue(): T | null {
    if (this.isEmpty()) {
      return null; // Si la cola está vacía, retorna null
    }
    const dequeuedNode = this.front; // Guarda el nodo frontal
    this.front = this.front!.next; // Actualiza el frente al siguiente
    if (this.front === null) {
      this.rear = null; // Si la cola queda vacía, también actualiza el trasero
    }
    this.count--; // Decrementa el contador
    return dequeuedNode!.data; // Retorna el dato del nodo eliminado
  }

  // Devuelve el elemento en el frente de la cola sin eliminarlo
  public peek(): T | null {
    return this.isEmpty() ? null : this.front!.data; // Retorna el dato del frente o null si está vacía
  }

  // Vacía la cola
  public clear(): void {
    this.front = null; // Establece el frente como null para limpiar la cola
    this.rear = null; // Establece el trasero como null
    this.count = 0; // Reinicia el contador
  }

  // Verifica si la cola está vacía
  public isEmpty(): boolean {
    return this.count === 0; // La cola está vacía si el contador es 0
  }

  // Devuelve la cantidad de elementos en la cola
  public length(): number {
    return this.count; // Retorna el contador
  }

  // Busca un elemento en la cola
  public search(data: T): boolean {
    let current = this.front;
    while (current) {
      if (current.data === data) {
        return true; // Se encontró el dato
      }
      current = current.next; // Avanza al siguiente nodo
    }
    return false; // No se encontró el dato
  }

  // Devuelve la posición de un elemento dado (desde el frente)
  public indexOf(data: T): number {
    let current = this.front;
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

  // Imprime los elementos de la cola en la consola
  public print(): void {
    let current = this.front;
    const result: T[] = [];
    while (current) {
      result.push(current.data); // Agrega el dato del nodo actual al resultado
      current = current.next; // Avanza al siguiente nodo
    }
    console.log(result); // Imprime el resultado en la consola
  }
}
