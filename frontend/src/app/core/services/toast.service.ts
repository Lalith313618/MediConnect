import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ToastMessage {
  id: number;
  type: 'success' | 'danger' | 'warning' | 'info';
  title: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSubject = new BehaviorSubject<ToastMessage[]>([]);
  toasts$ = this.toastsSubject.asObservable();
  private counter = 0;

  show(type: 'success' | 'danger' | 'warning' | 'info', title: string, message: string, duration = 4000) {
    const id = ++this.counter;
    const newToast: ToastMessage = { id, type, title, message };
    const current = this.toastsSubject.value;
    this.toastsSubject.next([...current, newToast]);

    setTimeout(() => {
      this.remove(id);
    }, duration);
  }

  success(message: string, title = 'Success') {
    this.show('success', title, message);
  }

  error(message: string, title = 'Error') {
    this.show('danger', title, message);
  }

  info(message: string, title = 'Information') {
    this.show('info', title, message);
  }

  warning(message: string, title = 'Warning') {
    this.show('warning', title, message);
  }

  remove(id: number) {
    const updated = this.toastsSubject.value.filter((t) => t.id !== id);
    this.toastsSubject.next(updated);
  }
}
