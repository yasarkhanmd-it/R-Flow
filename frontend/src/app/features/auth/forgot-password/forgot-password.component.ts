import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent {
  forgotForm: FormGroup;
  isProcessing = false;
  serverError: string | null = null;
  successMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit() {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.isProcessing = true;
    this.serverError = null;

    const { email } = this.forgotForm.value;

    this.authService.forgotPassword(email).subscribe({
      next: (response) => {
        this.isProcessing = false;
        // Store email in sessionStorage for the next screens
        sessionStorage.setItem('rflow_reset_email', email);
        this.router.navigate(['/verify-otp']);
      },
      error: (error) => {
        this.isProcessing = false;
        this.serverError = error.error?.message || 'Something went wrong. Please try again.';
      }
    });
  }

  get emailError() {
    const control = this.forgotForm.get('email');
    if (control?.hasError('required') && control.touched) return 'Office email is required.';
    if (control?.hasError('email') && control.touched) return 'Please enter a valid email address.';
    return null;
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
