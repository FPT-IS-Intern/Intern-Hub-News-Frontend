import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonContainerComponent } from '@goat-bravos/intern-hub-layout';

@Component({
  selector: 'app-pop-up-confirm',
  standalone: true,
  imports: [CommonModule, ButtonContainerComponent],
  templateUrl: './pop-up-confirm.component.html',
  styleUrl: './pop-up-confirm.component.scss',
})
export class PopUpConfirmComponent {
  @Input() title: string = 'Xác nhận';
  @Input() content: string = 'Bạn có chắc chắn muốn thực hiện hành động này?';
  @Input() confirmText: string = 'Chấp nhận';
  @Input() cancelText: string = 'Hủy';

  @Output() confirmClick = new EventEmitter<void>();
  @Output() cancelClick = new EventEmitter<void>();

  onConfirm(): void {
    this.confirmClick.emit();
  }

  onCancel(): void {
    this.cancelClick.emit();
  }
}
