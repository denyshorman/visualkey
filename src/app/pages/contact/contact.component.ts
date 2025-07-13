import { Component, signal } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { TextareaModule } from 'primeng/textarea';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [InputTextModule, TextareaModule, ButtonModule, FormsModule],
  templateUrl: './contact.component.html',
})
export class ContactComponent {
  readonly name = signal('');
  readonly email = signal('');
  readonly message = signal('');

  sendEmail() {
    const subject = `Contact Form: ${this.name()}`;
    const body = `Name: ${this.name()}%0D%0AEmail: ${this.email()}%0D%0AMessage: ${this.message()}`;
    window.location.href = `mailto:creator@visualkey.link?subject=${subject}&body=${body}`;
  }
}
