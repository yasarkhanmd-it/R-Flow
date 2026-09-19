import { Component, EventEmitter, Input, Output, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule, X } from 'lucide-angular';
import { Module, ModuleService } from '../../../core/services/module.service';

@Component({
  selector: 'app-module-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './module-form.component.html',
  styleUrl: './module-form.component.scss'
})
export class ModuleFormComponent implements OnInit {
  @Input() projectId!: string;
  @Input() module: Module | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private moduleService = inject(ModuleService);

  readonly X = X;
  
  moduleForm!: FormGroup;
  isSubmitting = false;
  error: string | null = null;

  ngOnInit() {
    this.moduleForm = this.fb.group({
      name: [this.module?.name || '', [Validators.required, Validators.minLength(3)]],
      description: [this.module?.description || ''],
      dueDate: [this.module?.dueDate ? new Date(this.module.dueDate).toISOString().split('T')[0] : '']
    });
  }

  onSubmit() {
    if (this.moduleForm.invalid) return;

    this.isSubmitting = true;
    this.error = null;

    const formData = this.moduleForm.value;
    const payload = {
      ...formData,
      projectId: this.projectId
    };

    if (this.module) {
      this.moduleService.updateModule(this.module._id, payload).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          if (res.success) {
            this.save.emit();
            this.close.emit();
          }
        },
        error: (err) => {
          this.isSubmitting = false;
          this.error = err.error?.message || 'An error occurred while updating the module';
        }
      });
    } else {
      this.moduleService.createModule(payload).subscribe({
        next: (res) => {
          this.isSubmitting = false;
          if (res.success) {
            this.save.emit();
            this.close.emit();
          }
        },
        error: (err) => {
          this.isSubmitting = false;
          this.error = err.error?.message || 'An error occurred while creating the module';
        }
      });
    }
  }

  onClose() {
    this.close.emit();
  }
}
