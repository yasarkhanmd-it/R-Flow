import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

// ── PASSWORD STRENGTH VALIDATOR ─────────────────────────────────────────────
// CURRENT MODE: Relaxed – only minimum length enforced.
// To re-enable strict rules later, uncomment the rule lines and set
// PASSWORD_STRICT_MODE = true.
const PASSWORD_STRICT_MODE = false;
const PASSWORD_MIN_LENGTH = 6;

function passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
  const value: string = control.value || '';
  const rules = {
    minLength: value.length >= PASSWORD_MIN_LENGTH,
    // uppercase: /[A-Z]/.test(value),   // uncomment to re-enable
    // lowercase: /[a-z]/.test(value),   // uncomment to re-enable
    // number: /\d/.test(value),         // uncomment to re-enable
    // special: /[^a-zA-Z0-9]/.test(value) // uncomment to re-enable
  };
  if (PASSWORD_STRICT_MODE) {
    // In strict mode all rules must pass
    const allPassed = Object.values(rules).every(Boolean);
    return allPassed ? null : { passwordStrength: rules };
  }
  // Relaxed mode – only minimum length
  return rules.minLength ? null : { passwordStrength: rules };
}

function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const pw = group.get('newPassword')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return pw && confirm && pw !== confirm ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent implements OnInit, OnDestroy {
  resetForm: FormGroup;
  email = '';
  isProcessing = false;
  serverError: string | null = null;
  showSuccess = false;
  showPassword = false;
  showConfirmPassword = false;
  private redirectTimer: any;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.resetForm = this.fb.group(
      {
        newPassword: ['', [Validators.required, Validators.minLength(PASSWORD_MIN_LENGTH), passwordStrengthValidator]],
        confirmPassword: ['', Validators.required]
      },
      { validators: passwordMatchValidator }
    );
  }

  ngOnInit() {
    const stored = sessionStorage.getItem('rflow_reset_email');
    if (!stored) {
      this.router.navigate(['/forgot-password']);
      return;
    }
    this.email = stored;
  }

  ngOnDestroy() {
    if (this.redirectTimer) clearTimeout(this.redirectTimer);
  }

  togglePassword() { this.showPassword = !this.showPassword; }
  toggleConfirmPassword() { this.showConfirmPassword = !this.showConfirmPassword; }

  onSubmit() {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    this.isProcessing = true;
    this.serverError = null;

    const { newPassword } = this.resetForm.value;

    this.authService.resetPassword(this.email, newPassword).subscribe({
      next: (response) => {
        this.isProcessing = false;
        sessionStorage.removeItem('rflow_reset_email');
        this.showSuccess = true;
        // Auto-redirect to login after 3 seconds
        this.redirectTimer = setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      },
      error: (error) => {
        this.isProcessing = false;
        this.serverError = error.error?.message || 'Failed to reset password. Please try again.';
      }
    });
  }

  goToLogin() {
    if (this.redirectTimer) clearTimeout(this.redirectTimer);
    sessionStorage.removeItem('rflow_reset_email');
    this.router.navigate(['/login']);
  }

  cancel() {
    this.router.navigate(['/login']);
  }

  // ── Password strength helpers ────────────────────────────────────────────
  get passwordValue(): string {
    return this.resetForm.get('newPassword')?.value || '';
  }

  get rules() {
    const v = this.passwordValue;
    return {
      minLength: v.length >= PASSWORD_MIN_LENGTH,
      // These are preserved for display when strict mode is re-enabled:
      // uppercase: /[A-Z]/.test(v),
      // lowercase: /[a-z]/.test(v),
      // number: /\d/.test(v),
      // special: /[^a-zA-Z0-9]/.test(v)
    };
  }

  get strengthScore(): number {
    return Object.values(this.rules).filter(Boolean).length;
  }

  get strengthLabel(): string {
    const s = this.strengthScore;
    if (s <= 1) return 'Very Weak';
    if (s === 2) return 'Weak';
    if (s === 3) return 'Fair';
    if (s === 4) return 'Strong';
    return 'Very Strong';
  }

  get strengthClass(): string {
    const s = this.strengthScore;
    if (s <= 1) return 'very-weak';
    if (s === 2) return 'weak';
    if (s === 3) return 'fair';
    if (s === 4) return 'strong';
    return 'very-strong';
  }

  // ── Error getters ────────────────────────────────────────────────────────
  get newPasswordError(): string | null {
    const ctrl = this.resetForm.get('newPassword');
    if (ctrl?.hasError('required') && ctrl.touched) return 'New password is required.';
    if (ctrl?.hasError('minlength') && ctrl.touched) return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
    if (ctrl?.hasError('passwordStrength') && ctrl.touched) return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
    return null;
  }

  get confirmPasswordError(): string | null {
    const ctrl = this.resetForm.get('confirmPassword');
    if (ctrl?.hasError('required') && ctrl.touched) return 'Please confirm your new password.';
    if (this.resetForm.hasError('passwordMismatch') && ctrl?.touched) return 'Passwords do not match.';
    return null;
  }
}
