/**
 * Clase que representa un nodo en la pila.
 * @template T - Tipo de dato que almacenará el nodo.
 */
class StackNode<T> {
  data: T; // Dato almacenado en el nodo
  next: StackNode<T> | null; // Puntero al siguiente nodo

  constructor(data: T) {
    this.data = data;
    this.next = null; // Inicialmente, el siguiente nodo es null
  }
}

/**
 * Clase que representa una pila.
 * @template T - Tipo de dato que almacenará la pila.
 */
export class Stack<T> {
  private top: StackNode<T> | null; // Nodo superior de la pila
  private count: number; // Contador de elementos en la pila

  constructor() {
    this.top = null; // Inicialmente, la pila está vacía
    this.count = 0; // Inicializa el contador en 0
  }

  // Agrega un nuevo elemento a la cima de la pila
  public push(data: T): void {
    const newNode = new StackNode(data);
    newNode.next = this.top; // El nuevo nodo apunta al nodo superior actual
    this.top = newNode; // La cima ahora es el nuevo nodo
    this.count++; // Incrementa el contador
  }

  // Elimina y devuelve el elemento en la cima de la pila
  public pop(): T | null {
    if (this.isEmpty()) {
      return null; // Si la pila está vacía, retorna null
    }
    const poppedNode = this.top; // Guarda el nodo superior
    this.top = this.top!.next; // Actualiza la cima a la siguiente
    this.count--; // Decrementa el contador
    return poppedNode!.data; // Retorna el dato del nodo eliminado
  }

  // Devuelve el elemento en la cima de la pila sin eliminarlo
  public peek(): T | null {
    return this.isEmpty() ? null : this.top!.data; // Retorna el dato de la cima o null si está vacía
  }

  // Vacía la pila
  public clear(): void {
    this.top = null; // Establece la cima como null para limpiar la pila
    this.count = 0; // Reinicia el contador
  }

  // Verifica si la pila está vacía
  public isEmpty(): boolean {
    return this.count === 0; // La pila está vacía si el contador es 0
  }

  // Devuelve la cantidad de elementos en la pila
  public length(): number {
    return this.count; // Retorna el contador
  }

  // Busca un elemento en la pila
  public search(data: T): boolean {
    let current = this.top;
    while (current) {
      if (current.data === data) {
        return true; // Se encontró el dato
      }
      current = current.next; // Avanza al siguiente nodo
    }
    return false; // No se encontró el dato
  }

  // Devuelve la posición de un elemento dado (desde la cima)
  public indexOf(data: T): number {
    let current = this.top;
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

  // Imprime los elementos de la pila en la consola
  public print(): void {
    let current = this.top;
    const result: T[] = [];
    while (current) {
      result.push(current.data); // Agrega el dato del nodo actual al resultado
      current = current.next; // Avanza al siguiente nodo
    }
    console.log(result); // Imprime el resultado en la consola
  }
}
