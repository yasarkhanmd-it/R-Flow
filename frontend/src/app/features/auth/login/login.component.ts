import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  loginForm: FormGroup;
  showPassword = false;
  isProcessing = false;
  serverError: string | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9._%+-]+@motherson\.com$/)]],
      password: ['', Validators.required],
      rememberMe: [false]
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isProcessing = true;
    this.serverError = null;

    const { email, password } = this.loginForm.value;

    this.authService.login({ email, password }).subscribe({
      next: () => {
        this.isProcessing = false;
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.isProcessing = false;
        this.serverError = error.error?.message || 'Invalid email or password.';
      }
    });
  }

  get emailError() {
    const control = this.loginForm.get('email');
    if (control?.hasError('required') && control.touched) return 'Office email is required.';
    if (control?.hasError('pattern') && control.touched) return 'Please enter a valid company email (@motherson.com).';
    return null;
  }

  get passwordError() {
    const control = this.loginForm.get('password');
    if (control?.hasError('required') && control.touched) return 'Password is required.';
    return null;
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }
}
