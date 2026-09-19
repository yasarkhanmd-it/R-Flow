import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  showPassword = false;
  showConfirmPassword = false;
  isProcessing = false;
  passwordStrength: 'weak' | 'medium' | 'strong' | '' = '';

  // Modals
  showSuccessModal = false;
  showErrorModal = false;
  serverError: string | null = null;

  departments = [
    'Software', 'Design', 'Production', 'Purchase', 'HR',
    'Quality', 'Maintenance', 'Material Handling', 'Warehouse', 'IT'
  ];

  roles = ['Manager', 'Lead', 'User'];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.registerForm = this.fb.group({
      employeeName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9._%+-]+@motherson\.com$/)]],
      employeeId: ['', Validators.required],
      department: ['', Validators.required],
      role: ['', Validators.required],
      phone: ['', [Validators.pattern(/^[0-9]{10}$/)]],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required],
      terms: [false, Validators.requiredTrue]
    }, { validators: this.passwordMatchValidator });
  }

  // Custom Validator for Password Rules
  passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumeric = /[0-9]/.test(value);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);

    const valid = hasUpperCase && hasLowerCase && hasNumeric && hasSpecial;
    if (!valid) {
      return { passwordRules: true };
    }
    return null;
  }

  // Cross-field Validator for Matching Passwords
  passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const pass = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return pass === confirm ? null : { passwordMismatch: true };
  }

  calculatePasswordStrength(password: string) {
    if (!password) {
      this.passwordStrength = '';
      return;
    }
    let strengthScore = 0;
    if (password.length >= 8) strengthScore++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strengthScore++;
    if (/[0-9]/.test(password)) strengthScore++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strengthScore++;

    if (strengthScore <= 2) this.passwordStrength = 'weak';
    else if (strengthScore === 3) this.passwordStrength = 'medium';
    else if (strengthScore === 4) this.passwordStrength = 'strong';
  }

  togglePasswordVisibility(field: 'password' | 'confirm') {
    if (field === 'password') this.showPassword = !this.showPassword;
    else this.showConfirmPassword = !this.showConfirmPassword;
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isProcessing = true;
    this.serverError = null;

    const payload = this.registerForm.getRawValue();

    this.authService.register(payload).subscribe({
      next: () => {
        this.isProcessing = false;
        this.showSuccessModal = true;
      },
      error: (error) => {
        this.isProcessing = false;
        this.serverError = error.error?.errors?.join(', ') || error.error?.message || 'Registration failed.';
        this.showErrorModal = true;
      }
    });
  }

  closeModals() {
    this.showSuccessModal = false;
    this.showErrorModal = false;
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  // Helpers for template validation messages
  hasError(field: string, errorName: string) {
    const control = this.registerForm.get(field);
    return control?.hasError(errorName) && control.touched;
  }
}
